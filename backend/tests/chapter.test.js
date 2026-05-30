const request = require("supertest");
const express = require("express");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const chapterRoutes = require("../src/routes/chapter.routes");
const Chapter = require("../src/models/ChapterModel");

const app = express();
app.use(express.json());
app.use("/api/chapters", chapterRoutes);

// Khởi động DB ảo trước khi test
beforeAll(async () => await connectDB());
// Dọn rác sau mỗi lần test
afterEach(async () => await clearDB());
// Tắt DB ảo khi test xong
afterAll(async () => await closeDB());

describe("Chapter API Tests", () => {
  it("Nên tạo một chapter mới thành công", async () => {
    const newChapterData = {
      series_id: "60d21b4667d0d8992e610c85", // ID giả
      chapter_number: 1,
      title: "Khởi đầu mới",
      deadline: "2026-12-31",
    };

    const response = await request(app)
      .post("/api/chapters/create")
      .send(newChapterData);

    expect(response.status).toBe(201);
    expect(response.body.chapter.title).toBe("Khởi đầu mới");

    // Kiểm tra DB ảo xem đã lưu chưa
    const savedChapter = await Chapter.findOne({ title: "Khởi đầu mới" });
    expect(savedChapter).not.toBeNull();
  });
});
