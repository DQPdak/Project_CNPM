const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const seriesRoutes = require("../src/routes/series.routes");
const Series = require("../src/models/SeriesModel");
const SeriesProposal = require("../src/models/SeriesProposalModel");

const app = express();
app.use(express.json());
app.use("/api/series", seriesRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Series API Phase 1", () => {
  let accessToken;
  let user;

  beforeEach(async () => {
    ({ accessToken, user } = await createAuthenticatedUser());
  });

  it("creates a new series successfully", async () => {
    const response = await withAuth(
      request(app).post("/api/series"),
      accessToken,
    ).send({
      title: "One Piece",
      description: "Pirate adventure",
      genre: "Action",
      target_audience: "Teen",
      author_id: user._id.toString(),
      summary: "Monkey D. Luffy sets sail",
      characters: "Luffy, Zoro",
      art_style: "Shonen",
    });

    expect(response.status).toBe(201);
    expect(response.body.series.title).toBe("One Piece");
    expect(response.body.proposal.summary).toBe("Monkey D. Luffy sets sail");

    const saved = await Series.findOne({ title: "One Piece" });
    expect(saved).not.toBeNull();
  });

  it("returns series list for an author", async () => {
    await Series.create({
      title: "Series A",
      author_id: user._id,
      status: "Draft",
    });

    const response = await withAuth(
      request(app).get("/api/series/mine"),
      accessToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(1);
    expect(response.body.series[0].series.title).toBe("Series A");
  });

  it("returns series details with proposal", async () => {
    const series = await Series.create({
      title: "Series B",
      author_id: user._id,
      status: "Draft",
    });
    await SeriesProposal.create({
      series_id: series._id,
      summary: "Plot summary",
      status: "Draft",
    });

    const response = await withAuth(
      request(app).get(`/api/series/${series._id}`),
      accessToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.series.title).toBe("Series B");
    expect(response.body.proposal.summary).toBe("Plot summary");
  });

  it("updates proposal when it is still draft", async () => {
    const series = await Series.create({
      title: "Series C",
      author_id: user._id,
      status: "Draft",
    });
    await SeriesProposal.create({
      series_id: series._id,
      summary: "Old summary",
      status: "Draft",
    });

    const response = await withAuth(
      request(app).put(`/api/series/${series._id}/proposal`),
      accessToken,
    ).send({
      summary: "New summary",
      characters: "Hero",
      art_style: "Modern",
    });

    expect(response.status).toBe(200);
    expect(response.body.proposal.summary).toBe("New summary");

    const updated = await SeriesProposal.findOne({ series_id: series._id });
    expect(updated.summary).toBe("New summary");
  });

  it("returns 404 when series is not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await withAuth(
      request(app).get(`/api/series/${fakeId}`),
      accessToken,
    );
    expect(response.status).toBe(404);
  });
});
