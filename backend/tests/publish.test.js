const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const publishRoutes = require("../src/routes/publish.routes");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");

const app = express();
app.use(express.json());
app.use("/api/publish", publishRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Publish API Tests", () => {
  it("KHÔNG cho phép xuất bản nếu có trang truyện chưa được Approved", async () => {
    const chapter = await Chapter.create({
      series_id: new mongoose.Types.ObjectId(),
      chapter_number: 1,
      title: "Chapter Sắp Xuất Bản",
      deadline: new Date(),
      status: "Waiting Review",
    });

    // Tạo 1 trang đã duyệt, 1 trang chưa duyệt (Draft)
    await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      file_url: "link1",
      status: "Approved",
    });
    await Page.create({
      chapter_id: chapter._id,
      page_number: 2,
      file_url: "link2",
      status: "Draft",
    }); // Kẻ ngáng đường

    const response = await request(app)
      .post(`/api/publish/chapter/${chapter._id}`)
      .send({ release_issue_id: "60d21b4667d0d8992e610c85" });

    // Bắt buộc phải báo lỗi 400
    expect(response.status).toBe(400);
    expect(response.body.message).toContain("chưa được phê duyệt");
  });
});
