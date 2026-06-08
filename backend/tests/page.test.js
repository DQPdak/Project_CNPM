jest.mock("../src/middlewares/upload.middleware", () => {
  return {
    array: () => (req, res, next) => {
      req.files = [{ path: "https://res.cloudinary.com/mock/trang_1.jpg" }];
      next();
    },
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
const { createAuthenticatedUser, withAuth } = require("./setup/authHelper");
const pageRoutes = require("../src/routes/page.routes");
const Series = require("../src/models/SeriesModel");
const Chapter = require("../src/models/ChapterModel");
const Page = require("../src/models/PageModel");

const app = express();
app.use(express.json());
app.use("/api/pages", pageRoutes);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Page API - Upload Tests", () => {
  let accessToken;
  let user;
  let series;

  beforeEach(async () => {
    ({ accessToken, user } = await createAuthenticatedUser());
    series = await Series.create({
      title: "Page Test Series",
      author_id: user._id,
      status: "Draft",
    });
  });

  it("uploads pages successfully", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 1,
      title: "Test",
      deadline: new Date(),
    });

    const response = await withAuth(
      request(app).post(`/api/pages/upload/${chapter._id}/upload`),
      accessToken,
    ).attach("pages", Buffer.from("anh-gia"), "trang_1.jpg");

    expect(response.status).toBe(200);
    expect(response.body.pages[0].file_url).toBe(
      "https://res.cloudinary.com/mock/trang_1.jpg",
    );

    const updatedChapter = await Chapter.findById(chapter._id);
    expect(updatedChapter.status).toBe("In Production");
  });

  it("updates page version successfully", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 1,
      title: "Test Update Version",
      deadline: new Date(),
    });

    const page = await Page.create({
      chapter_id: chapter._id,
      page_number: 1,
      file_url: "https://link-cu-rich-da-bi-loi.jpg",
      version: 1,
    });

    const response = await withAuth(
      request(app).put(`/api/pages/update/${page._id}`),
      accessToken,
    ).attach("page", Buffer.from("anh-ve-lai"), "trang_1_sua.jpg");

    expect(response.status).toBe(200);
    expect(response.body.page.file_url).toBe(
      "https://res.cloudinary.com/mock/cover.jpg",
    );
    expect(response.body.page.version).toBe(2);
  });

  it("approves page successfully", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 2,
      title: "Approve Test",
      deadline: new Date(),
    });
    const page = new Page({
      chapter_id: chapter._id,
      page_number: 1,
      file_url: "https://example.com/page1_v2.jpg",
      version: 2,
      status: "Ready For Review",
    });
    await page.save();

    const response = await withAuth(
      request(app).put(`/api/pages/approve/${page._id}`),
      accessToken,
    ).send({ status: "Approved" });

    expect(response.status).toBe(200);
    expect(response.body.page.status).toBe("Approved");

    const updatedPage = await Page.findById(page._id);
    expect(updatedPage.status).toBe("Approved");
  });

  it("returns 400 for invalid page status", async () => {
    const chapter = await Chapter.create({
      series_id: series._id,
      chapter_number: 3,
      title: "Invalid Status Test",
      deadline: new Date(),
    });
    const page = new Page({
      chapter_id: chapter._id,
      page_number: 2,
      file_url: "https://example.com/page2_draft.jpg",
      status: "Draft",
    });
    await page.save();

    const response = await withAuth(
      request(app).put(`/api/pages/approve/${page._id}`),
      accessToken,
    ).send({ status: "Done" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Trạng thái trang không hợp lệ");
  });

  it("returns 404 when page is not found", async () => {
    const fakePageId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      request(app).put(`/api/pages/approve/${fakePageId}`),
      accessToken,
    ).send({ status: "Approved" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Không tìm thấy trang truyện");
  });
});
