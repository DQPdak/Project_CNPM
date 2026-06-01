const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
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
  // Test 2: Update status thành công
  it("Nên cập nhật trạng thái chapter thành công", async () => {
    // 1. Tạo 1 chapter lưu sẵn vào DB ảo trước (Mặc định status là Draft)
    const chapter = new Chapter({
      series_id: "60d21b4667d0d8992e610c85",
      chapter_number: 2,
      title: "Chapter cần đổi trạng thái",
      deadline: "2026-12-31",
    });
    await chapter.save();

    // 2. Gửi request PUT để cập nhật trạng thái sang "In Production"
    const response = await request(app)
      .put(`/api/chapters/update-status/${chapter._id}`)
      .send({ status: "In Production" });

    // 3. Kiểm tra kết quả trả về từ API
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Cập nhật trạng thái chapter thành công",
    );
    expect(response.body.chapter.status).toBe("In Production");

    // 4. Truy vấn lại DB xem đã thực sự thay đổi chưa
    const updatedChapter = await Chapter.findById(chapter._id);
    expect(updatedChapter.status).toBe("In Production");
  });

  // Test 3: Báo lỗi khi gửi status sai
  it("Nên báo lỗi 400 khi gửi trạng thái không hợp lệ", async () => {
    const chapter = new Chapter({
      series_id: "60d21b4667d0d8992e610c85",
      chapter_number: 3,
      title: "Chapter test lỗi enum",
      deadline: "2026-12-31",
    });
    await chapter.save();

    // Gửi status không có trong [Draft, In Production, Waiting Review, Approved, Published]
    const response = await request(app)
      .put(`/api/chapters/update-status/${chapter._id}`)
      .send({ status: "Done" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Trạng thái không hợp lệ");
  });

  // Test 4: Báo lỗi 404 khi chapter không tồn tại
  it("Nên báo lỗi 404 khi không tìm thấy chapter", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    // FIX LỖI: Sửa URL và đổi sang .put
    const response = await request(app)
      .put(`/api/chapters/update-status/${fakeId}`)
      .send({ status: "In Production" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Không tìm thấy chapter");
  });
});
