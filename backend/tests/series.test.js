const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
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
  const authorId = new mongoose.Types.ObjectId();

  it("Nên tạo series mới thành công", async () => {
    const response = await request(app).post("/api/series").send({
      title: "One Piece",
      description: "Pirate adventure",
      genre: "Action",
      target_audience: "Teen",
      author_id: authorId.toString(),
      summary: "Monkey D. Luffy sets sail",
      characters: "Luffy, Zoro",
      art_style: "Shonen",
    });

    expect(response.status).toBe(201);
    expect(response.body.series.title).toBe("One Piece");
    expect(response.body.series.status).toBe("Draft");
    expect(response.body.proposal.summary).toBe("Monkey D. Luffy sets sail");

    const saved = await Series.findOne({ title: "One Piece" });
    expect(saved).not.toBeNull();
  });

  it("Nên lấy danh sách series của Mangaka", async () => {
    await Series.create({
      title: "Series A",
      author_id: authorId,
      status: "Draft",
    });

    const response = await request(app).get(`/api/series/mine/${authorId}`);

    expect(response.status).toBe(200);
    expect(response.body.series).toHaveLength(1);
    expect(response.body.series[0].series.title).toBe("Series A");
  });

  it("Nên lấy chi tiết series kèm proposal", async () => {
    const series = await Series.create({
      title: "Series B",
      author_id: authorId,
      status: "Draft",
    });
    await SeriesProposal.create({
      series_id: series._id,
      summary: "Plot summary",
      status: "Draft",
    });

    const response = await request(app).get(`/api/series/${series._id}`);

    expect(response.status).toBe(200);
    expect(response.body.series.title).toBe("Series B");
    expect(response.body.proposal.summary).toBe("Plot summary");
  });

  it("Nên cập nhật proposal khi đang Draft", async () => {
    const series = await Series.create({
      title: "Series C",
      author_id: authorId,
      status: "Draft",
    });
    await SeriesProposal.create({
      series_id: series._id,
      summary: "Old summary",
      status: "Draft",
    });

    const response = await request(app)
      .put(`/api/series/${series._id}/proposal`)
      .send({
        summary: "New summary",
        characters: "Hero",
        art_style: "Modern",
      });

    expect(response.status).toBe(200);
    expect(response.body.proposal.summary).toBe("New summary");

    const updated = await SeriesProposal.findOne({ series_id: series._id });
    expect(updated.summary).toBe("New summary");
  });

  it("Nên trả 404 khi không tìm thấy series", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/api/series/${fakeId}`);
    expect(response.status).toBe(404);
  });
});
