// 1. MOCK CLOUDINARY TRƯỚC TIÊN!
jest.mock("../src/middlewares/upload.middleware", () => {
  return {
    array: () => (req, res, next) => {
      req.files = [{ path: "https://res.cloudinary.com/mock/trang_1.jpg" }];
      next();
    },
    // Thêm hàm single vào đây để không bị lỗi undefined
    single: () => (req, res, next) => {
      req.file = { path: "https://res.cloudinary.com/mock/cover.jpg" };
      next();
    },
  };
});

const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const pageRoutes = require("../src/routes/page.routes");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");

const app = express();
app.use(express.json());
app.use("/api/pages", pageRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Page API - Upload Tests", () => {
  it("Nên upload thành công với link Cloudinary giả", async () => {
    // Tạo 1 chapter mồi
    const chapter = await Chapter.create({
      series_id: new mongoose.Types.ObjectId(),
      chapter_number: 1,
      title: "Test",
      deadline: new Date(),
    });

    const response = await request(app)
      .post(`/api/pages/upload/${chapter._id}/upload`)
      .attach("pages", Buffer.from("anh-gia"), "trang_1.jpg"); // Bắn file giả lên

    // Kiểm tra API trả về mã 200 và link mây ảo
    expect(response.status).toBe(200);
    expect(response.body.pages[0].file_url).toBe(
      "https://res.cloudinary.com/mock/trang_1.jpg",
    );

    // Kiểm tra trạng thái Chapter tự chuyển sang 'In Production'
    const updatedChapter = await Chapter.findById(chapter._id);
    expect(updatedChapter.status).toBe("In Production");
  });
  it("Nên cập nhật version mới cho trang truyện thành công", async () => {
    // 1. DỮ LIỆU MỒI: Tạo 1 chapter và 1 page version 1
    const chapter = await Chapter.create({
      series_id: new mongoose.Types.ObjectId(),
      chapter_number: 1,
      title: "Test Update Version",
      deadline: new Date(),
    });

    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      file_url: "https://link-cu-rich-da-bi-loi.jpg",
      version: 1, // Đang là version 1
    });

    // 2. GỌI API: Đóng giả Frontend gửi 1 file ảnh mới lên
    const response = await request(app)
      .put(`/api/pages/update/${page._id}`)
      .attach("page", Buffer.from("anh-ve-lai"), "trang_1_sua.jpg"); // Chú ý key là 'page'

    // 3. KIỂM TRA:
    expect(response.status).toBe(200);

    // Kiểm tra link ảnh đã đổi thành link do jest.mock cấp chưa
    expect(response.body.page.file_url).toBe(
      "https://res.cloudinary.com/mock/cover.jpg",
    );

    // Kiểm tra Version đã tự động nhảy lên 2 chưa!
    expect(response.body.page.version).toBe(2);
  });
});
