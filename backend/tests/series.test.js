jest.mock("../src/middlewares/upload.middleware", () => ({
  single: () => (req, res, next) => {
    req.file = { path: "https://res.cloudinary.com/mock/cover.jpg" };
    next();
  },
}));

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const seriesRoutes = require("../src/routes/series.routes");
const Series = require("../src/models/SeriesModel");
const SeriesProposal = require("../src/models/SeriesProposalModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const Task = require("../src/models/TaskModel");

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

describe("Series API Phase 3 - Upload cover", () => {
  let accessToken;
  let user;

  beforeEach(async () => {
    ({ accessToken, user } = await createAuthenticatedUser());
  });

  it("uploads cover image to proposal", async () => {
    const series = await Series.create({
      title: "Cover Series",
      author_id: user._id,
      status: "Draft",
    });
    await SeriesProposal.create({
      series_id: series._id,
      summary: "Summary",
      status: "Draft",
    });

    const response = await withAuth(
      request(app).post(`/api/series/${series._id}/proposal/upload-cover`),
      accessToken,
    ).attach("cover", Buffer.from("cover-image"), "cover.jpg");

    expect(response.status).toBe(200);
    expect(response.body.cover_image).toBe(
      "https://res.cloudinary.com/mock/cover.jpg",
    );

    const proposal = await SeriesProposal.findOne({ series_id: series._id });
    expect(proposal.cover_image).toBe("https://res.cloudinary.com/mock/cover.jpg");
  });

  it("rejects cover upload when proposal is not editable", async () => {
    const series = await Series.create({
      title: "Locked Series",
      author_id: user._id,
      status: "Draft",
    });
    await SeriesProposal.create({
      series_id: series._id,
      summary: "Summary",
      status: "Submitted",
    });

    const response = await withAuth(
      request(app).post(`/api/series/${series._id}/proposal/upload-cover`),
      accessToken,
    ).attach("cover", Buffer.from("cover-image"), "cover.jpg");

    expect(response.status).toBe(400);
  });
});

describe("Series API Phase 5 - Module 13 lifecycle", () => {
  let boardToken;
  let mangakaToken;
  let author;

  beforeEach(async () => {
    ({ accessToken: mangakaToken, user: author } =
      await createAuthenticatedUser({ role: "Mangaka" }));
    ({ accessToken: boardToken } = await createAuthenticatedUser({
      role: "Editorial Board",
      email: `board-${Date.now()}@example.com`,
    }));
  });

  it("lists at-risk series for editorial board", async () => {
    await Series.create({
      title: "At Risk Series",
      author_id: author._id,
      status: "At Risk",
      risk_status: "Warning",
    });
    await Series.create({
      title: "Safe Series",
      author_id: author._id,
      status: "Active",
      risk_status: "Safe",
    });

    const response = await withAuth(
      request(app).get("/api/series/at-risk"),
      boardToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.series[0].title).toBe("At Risk Series");
  });

  it("includes series with critical risk status", async () => {
    await Series.create({
      title: "Critical Series",
      author_id: author._id,
      status: "Active",
      risk_status: "Critical",
    });

    const response = await withAuth(
      request(app).get("/api/series/at-risk"),
      boardToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.series[0].risk_status).toBe("Critical");
  });

  it("updates series lifecycle status", async () => {
    const series = await Series.create({
      title: "Lifecycle Series",
      author_id: author._id,
      status: "Active",
    });

    const response = await withAuth(
      request(app).patch(`/api/series/${series._id}/status`),
      boardToken,
    ).send({
      status: "Hiatus",
      risk_status: "Critical",
      approved_schedule: "monthly",
    });

    expect(response.status).toBe(200);
    expect(response.body.series.status).toBe("Hiatus");
    expect(response.body.series.risk_status).toBe("Critical");
    expect(response.body.series.approved_schedule).toBe("monthly");
  });

  it("rejects invalid lifecycle status", async () => {
    const series = await Series.create({
      title: "Invalid Status Series",
      author_id: author._id,
      status: "Active",
    });

    const response = await withAuth(
      request(app).patch(`/api/series/${series._id}/status`),
      boardToken,
    ).send({ status: "Draft" });

    expect(response.status).toBe(400);
  });

  it("denies mangaka access to at-risk list", async () => {
    const response = await withAuth(
      request(app).get("/api/series/at-risk"),
      mangakaToken,
    );

    expect(response.status).toBe(403);
  });

  it("casts a lifecycle decision vote", async () => {
    const series = await Series.create({
      title: "Lifecycle Vote Series",
      author_id: author._id,
      status: "At Risk",
      risk_status: "Critical",
    });

    const response = await withAuth(
      request(app).post(`/api/series/${series._id}/lifecycle-vote`),
      boardToken,
    ).send({ vote: "Hiatus", comment: "Tam dung de cai thien" });

    expect(response.status).toBe(201);
    expect(response.body.vote.vote).toBe("Hiatus");
    expect(response.body.vote.vote_context).toBe("lifecycle");
  });

  it("accepts new Module 13 vote options", async () => {
    const series = await Series.create({
      title: "Online Only Series",
      author_id: author._id,
      status: "At Risk",
    });

    const response = await withAuth(
      request(app).post(`/api/series/${series._id}/lifecycle-vote`),
      boardToken,
    ).send({ vote: "Need Improvement Plan" });

    expect(response.status).toBe(201);
    expect(response.body.vote.vote).toBe("Need Improvement Plan");
  });

  it("rejects invalid lifecycle vote value", async () => {
    const series = await Series.create({
      title: "Bad Vote Series",
      author_id: author._id,
      status: "At Risk",
    });

    const response = await withAuth(
      request(app).post(`/api/series/${series._id}/lifecycle-vote`),
      boardToken,
    ).send({ vote: "Approve" });

    expect(response.status).toBe(400);
  });

  it("lists lifecycle votes with tally", async () => {
    const series = await Series.create({
      title: "Dossier Series",
      author_id: author._id,
      status: "At Risk",
    });

    await withAuth(
      request(app).post(`/api/series/${series._id}/lifecycle-vote`),
      boardToken,
    ).send({ vote: "Continue", comment: "Van con tiem nang" });

    const response = await withAuth(
      request(app).get(`/api/series/${series._id}/lifecycle-votes`),
      boardToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.tally.Continue).toBe(1);
  });
});

describe("Series API - Lấy series theo từng role", () => {
  it("admin lấy được series theo author_id chỉ định", async () => {
    const { user: mangaka } = await createAuthenticatedUser({
      role: "Mangaka",
    });
    const { accessToken: adminToken } = await createAuthenticatedUser({
      role: "Admin",
      email: `admin-${Date.now()}@example.com`,
    });

    await Series.create({
      title: "Series cua Mangaka",
      author_id: mangaka._id,
      status: "Draft",
    });

    const response = await withAuth(
      request(app).get(`/api/series/mine/${mangaka._id}`),
      adminToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(1);
    expect(response.body.series[0].series.title).toBe("Series cua Mangaka");
  });

  it("chặn mangaka truy cập route admin /mine/:author_id", async () => {
    const { user: mangaka, accessToken: mangakaToken } =
      await createAuthenticatedUser({ role: "Mangaka" });
    const { user: other } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `other-${Date.now()}@example.com`,
    });

    await Series.create({
      title: "Series nguoi khac",
      author_id: other._id,
      status: "Draft",
    });

    const response = await withAuth(
      request(app).get(`/api/series/mine/${other._id}`),
      mangakaToken,
    );

    expect(response.status).toBe(403);
  });

  it("tantou editor lấy series theo editor_id", async () => {
    const { user: editor, accessToken: editorToken } =
      await createAuthenticatedUser({
        role: "Tantou Editor",
        email: `editor-${Date.now()}@example.com`,
      });
    const { user: mangaka } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `mk-${Date.now()}@example.com`,
    });

    await Series.create({
      title: "Series duoc phu trach",
      author_id: mangaka._id,
      editor_id: editor._id,
      status: "Active",
    });
    await Series.create({
      title: "Series khong phu trach",
      author_id: mangaka._id,
      status: "Active",
    });

    const response = await withAuth(
      request(app).get("/api/series/editor"),
      editorToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(1);
    expect(response.body.series[0].series.title).toBe("Series duoc phu trach");
  });

  it("editorial board lấy tất cả series", async () => {
    const { user: mangaka } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `mk2-${Date.now()}@example.com`,
    });
    const { accessToken: boardToken } = await createAuthenticatedUser({
      role: "Editorial Board",
      email: `board-${Date.now()}@example.com`,
    });

    await Series.create({
      title: "Series A",
      author_id: mangaka._id,
      status: "Active",
    });
    await Series.create({
      title: "Series B",
      author_id: mangaka._id,
      status: "Draft",
    });

    const response = await withAuth(
      request(app).get("/api/series/all"),
      boardToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(2);
  });

  it("assistant lấy series gián tiếp qua task được giao", async () => {
    const { user: mangaka } = await createAuthenticatedUser({
      role: "Mangaka",
      email: `mk3-${Date.now()}@example.com`,
    });
    const { user: assistant, accessToken: assistantToken } =
      await createAuthenticatedUser({
        role: "Assistant",
        email: `assistant-${Date.now()}@example.com`,
      });

    const series = await Series.create({
      title: "Series co task",
      author_id: mangaka._id,
      status: "Active",
    });
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 1,
      title: "Chuong 1",
      deadline: new Date("2026-12-31"),
    });
    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      file_url: "https://example.com/p1.jpg",
    });
    await Task.create({
      page_id: page._id,
      region_id: new mongoose.Types.ObjectId(),
      assigned_to: assistant._id,
      assigned_by: mangaka._id,
      task_type: "To bong",
      deadline: new Date("2026-12-31"),
    });

    // Series khac khong giao task -> khong duoc lay
    await Series.create({
      title: "Series khong task",
      author_id: mangaka._id,
      status: "Active",
    });

    const response = await withAuth(
      request(app).get("/api/series/assistant"),
      assistantToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(1);
    expect(response.body.series[0].series.title).toBe("Series co task");
  });

  it("trả về rỗng khi assistant chưa có task", async () => {
    const { accessToken: assistantToken } = await createAuthenticatedUser({
      role: "Assistant",
      email: `assistant2-${Date.now()}@example.com`,
    });

    const response = await withAuth(
      request(app).get("/api/series/assistant"),
      assistantToken,
    );

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(0);
  });
});
