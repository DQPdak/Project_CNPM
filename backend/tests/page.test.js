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

  // Test 1: Chốt trang thành công (Happy Path)
  it("Nên cập nhật trạng thái trang thành Approved thành công", async () => {
    // 1. Tạo 1 page giả lập đang chờ duyệt (Ready For Review) và lưu vào DB ảo
    const fakeChapterId = new mongoose.Types.ObjectId();
    const page = new Page({
      chapter_id: fakeChapterId,
      page_number: 1,
      file_url: "https://example.com/page1_v2.jpg", // Đã upload bản v2
      version: 2,
      status: "Ready For Review",
    });
    await page.save();

    // 2. Gửi request PUT để duyệt trang (chốt Final)
    const response = await request(app)
      .put(`/api/pages/approve/${page._id}`)
      .send({ status: "Approved" });

    // 3. Kiểm tra kết quả trả về từ API
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Đã chốt bản Final cho trang này");
    expect(response.body.page.status).toBe("Approved");

    // 4. Truy vấn lại DB xem đã thực sự thay đổi chưa
    const updatedPage = await Page.findById(page._id);
    expect(updatedPage.status).toBe("Approved");
  });

  // Test 2: Báo lỗi khi gửi status không nằm trong Enum
  it("Nên báo lỗi 400 khi gửi trạng thái không hợp lệ", async () => {
    const fakeChapterId = new mongoose.Types.ObjectId();
    const page = new Page({
      chapter_id: fakeChapterId,
      page_number: 2,
      file_url: "https://example.com/page2_draft.jpg",
      status: "Draft",
    });
    await page.save();

    // Gửi status sai (ví dụ: "Done" hoặc "Hoàn thành")
    const response = await request(app)
      .put(`/api/pages/approve/${page._id}`)
      .send({ status: "Done" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Trạng thái trang không hợp lệ");
  });

  // Test 3: Báo lỗi 404 khi ID của Page không tồn tại
  it("Nên báo lỗi 404 khi không tìm thấy trang truyện", async () => {
    // Sinh ra một ID đúng định dạng MongoDB nhưng không có thật
    const fakePageId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .put(`/api/pages/approve/${fakePageId}`)
      .send({ status: "Approved" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Không tìm thấy trang truyện");
  });
});
