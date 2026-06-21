const request = require("supertest");
const express = require("express");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const seriesRoutes = require("../src/routes/series.routes");
const boardRoutes = require("../src/routes/board.routes");
const Series = require("../src/models/SeriesModel");
const SeriesProposal = require("../src/models/SeriesProposalModel");

const app = express();
app.use(express.json());
app.use("/api/series", seriesRoutes);
app.use("/api/board", boardRoutes);
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  return res.status(error.status || 500).json({
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Unexpected error",
    },
  });
});

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Board review flow Phase 2", () => {
  let mangakaToken;
  let mangakaUser;
  let boardToken;

  beforeEach(async () => {
    ({ accessToken: mangakaToken, user: mangakaUser } =
      await createAuthenticatedUser({ role: "Mangaka" }));
    ({ accessToken: boardToken } = await createAuthenticatedUser({
      role: "Editorial Board",
      email: `board-${Date.now()}@example.com`,
    }));
  });

  const createSubmittedSeries = async () => {
    const createRes = await withAuth(
      request(app).post("/api/series"),
      mangakaToken,
    ).send({
      title: "Demon Slayer",
      summary: "A boy fights demons",
      characters: "Tanjiro",
      art_style: "Shonen",
    });

    const seriesId = createRes.body.series._id;

    await withAuth(
      request(app).post(`/api/series/${seriesId}/proposal/submit`),
      mangakaToken,
    );

    return seriesId;
  };

  it("submits a proposal for board review", async () => {
    const seriesId = await createSubmittedSeries();
    const proposal = await SeriesProposal.findOne({ series_id: seriesId });

    expect(proposal.status).toBe("Submitted");
    expect(proposal.submitted_at).toBeTruthy();
  });

  it("lists pending series for editorial board", async () => {
    await createSubmittedSeries();

    const response = await withAuth(
      request(app).get("/api/board/series/pending"),
      boardToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.pending[0].proposal.status).toBe("Submitted");
  });

  it("approves a series and activates it after finalize", async () => {
    const seriesId = await createSubmittedSeries();

    const voteRes = await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      boardToken,
    ).send({ vote: "Approve", comment: "Strong concept" });

    expect(voteRes.status).toBe(201);

    const finalizeRes = await withAuth(
      request(app).post(`/api/board/series/${seriesId}/finalize`),
      boardToken,
    ).send({ approved_schedule: "weekly" });

    expect(finalizeRes.status).toBe(200);
    expect(finalizeRes.body.decision).toBe("Approve");
    expect(finalizeRes.body.series.status).toBe("Active");
    expect(finalizeRes.body.proposal.status).toBe("Approved");

    const series = await Series.findById(seriesId);
    expect(series.status).toBe("Active");
    expect(series.approved_schedule).toBe("weekly");
  });

  it("finalizes by majority vote across board members", async () => {
    const seriesId = await createSubmittedSeries();

    const { accessToken: board2 } = await createAuthenticatedUser({
      role: "Editorial Board",
      email: `board2-${Date.now()}@example.com`,
    });
    const { accessToken: board3 } = await createAuthenticatedUser({
      role: "Editorial Board",
      email: `board3-${Date.now()}@example.com`,
    });

    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      boardToken,
    ).send({ vote: "Approve" });
    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      board2,
    ).send({ vote: "Approve" });
    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      board3,
    ).send({ vote: "Reject" });

    const finalizeRes = await withAuth(
      request(app).post(`/api/board/series/${seriesId}/finalize`),
      boardToken,
    ).send({ approved_schedule: "weekly" });

    expect(finalizeRes.status).toBe(200);
    expect(finalizeRes.body.decision).toBe("Approve");
    expect(finalizeRes.body.tally).toEqual({
      Approve: 2,
      Reject: 1,
      "Need Revision": 0,
    });
  });

  it("rejects a series on finalize", async () => {
    const seriesId = await createSubmittedSeries();

    await withAuth(
      request(app).post(`/api/board/series/${seriesId}/vote`),
      boardToken,
    ).send({ vote: "Reject", comment: "Not suitable" });

    const finalizeRes = await withAuth(
      request(app).post(`/api/board/series/${seriesId}/finalize`),
      boardToken,
    ).send({});

    expect(finalizeRes.status).toBe(200);
    expect(finalizeRes.body.proposal.status).toBe("Rejected");
    expect(finalizeRes.body.series.status).toBe("Draft");
  });

  it("denies mangaka access to board pending list", async () => {
    const response = await withAuth(
      request(app).get("/api/board/series/pending"),
      mangakaToken,
    );

    expect(response.status).toBe(403);
  });
});
