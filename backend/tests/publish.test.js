const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const publishRoutes = require("../src/routes/publish.routes");

// Import đủ các Model
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");
const Task = require("../src/models/TaskModel");
const Annotation = require("../src/models/AnnotationModel");

const app = express();
app.use(express.json());
app.use("/api/publish", publishRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Publish API Tests", () => {
  // Tạo sẵn các ID giả để nhét vào các trường required
  const fakeUserId = new mongoose.Types.ObjectId();
  const fakeRegionId = new mongoose.Types.ObjectId();

  it("1. KHÔNG cho phép xuất bản nếu có trang truyện chưa được Approved", async () => {
    const chapter = await Chapter.create({
      series_id: new mongoose.Types.ObjectId(),
      chapter_number: 1,
      title: "Chapter Lỗi Trang",
      deadline: new Date(),
    });

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
    }); // Lỗi ở đây

    const response = await request(app)
      .post(`/api/publish/chapter/${chapter._id}`)
      .send({ release_issue_id: new mongoose.Types.ObjectId() });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("trang truyện chưa được phê duyệt");
  });

  it("2. KHÔNG cho phép xuất bản nếu Task của Assistant chưa hoàn thành", async () => {
    const chapter = await Chapter.create({
      series_id: new mongoose.Types.ObjectId(),
      title: "Tên gì cũng được",
      chapter_number: 2,
      deadline: new Date(),
    });

    // Trang thì đã duyệt xong
    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      file_url: "link",
      status: "Approved",
    });

    // Nhưng Task dọn rác/tô nền vẫn đang In Progress
    await Task.create({
      page_id: page._id,
      region_id: fakeRegionId,
      assigned_to: fakeUserId,
      assigned_by: fakeUserId,
      task_type: "Tô nền",
      deadline: new Date(),
      status: "In Progress", // Lỗi ở đây
    });

    const response = await request(app)
      .post(`/api/publish/chapter/${chapter._id}`)
      .send({ release_issue_id: new mongoose.Types.ObjectId() });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "Không thể xuất bản. Vẫn còn task chưa hoàn thành trên các trang truyện",
    );
  });

  it("3. KHÔNG cho phép xuất bản nếu Annotation của Editor chưa sửa xong", async () => {
    const chapter = await Chapter.create({
      series_id: new mongoose.Types.ObjectId(),
      title: "Tên gì cũng được",
      chapter_number: 3,
      deadline: new Date(),
    });
    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      file_url: "link",
      status: "Approved",
    });

    // Task đã làm xong
    await Task.create({
      page_id: page._id,
      region_id: fakeRegionId,
      assigned_to: fakeUserId,
      assigned_by: fakeUserId,
      task_type: "Đi nét",
      deadline: new Date(),
      status: "Approved",
    });

    // Nhưng Editor để lại 1 cái Comment chưa được giải quyết
    await Annotation.create({
      page_id: page._id,
      created_by: fakeUserId,
      role: "Tantou Editor",
      coordinates: "x:10, y:20",
      comment: "Chỗ này vẽ sai tay rồi",
      status: "Open", // Lỗi ở đây
    });

    const response = await request(app)
      .post(`/api/publish/chapter/${chapter._id}`)
      .send({ release_issue_id: new mongoose.Types.ObjectId() });
    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "Không thể xuất bản. Vẫn còn annotation chưa được giải quyết trên các trang truyện",
    );
  });

  it("4. CHO PHÉP xuất bản thành công khi mọi điều kiện đều xanh", async () => {
    const chapter = await Chapter.create({
      series_id: new mongoose.Types.ObjectId(),
      chapter_number: 4,
      title: "Chapter Hoàn Hảo",
      deadline: new Date(),
      status: "Waiting Review",
    });
    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      file_url: "link",
      status: "Approved",
    });

    // Task đã được phê duyệt (Approved)
    await Task.create({
      page_id: page._id,
      region_id: fakeRegionId,
      assigned_to: fakeUserId,
      assigned_by: fakeUserId,
      task_type: "Vẽ bóng",
      deadline: new Date(),
      status: "Approved",
    });

    // Comment của Editor đã được sửa xong (Resolved)
    await Annotation.create({
      page_id: page._id,
      created_by: fakeUserId,
      role: "Editor",
      coordinates: "0,0",
      comment: "Sửa tóc",
      status: "Resolved",
    });

    const response = await request(app)
      .post(`/api/publish/chapter/${chapter._id}`)
      .send({ release_issue_id: "60d21b4667d0d8992e610c85" });

    // Bắt buộc qua ải thành công
    expect(response.status).toBe(200);
    expect(response.body.message).toContain("thành công");
    expect(response.body.chapter.status).toBe("Published");
  });
});
