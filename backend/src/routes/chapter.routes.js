const express = require("express");
const router = express.Router();
const creareChapter = require("../controllers/chapter/createChapter");
const getChaptersBySeries = require("../controllers/chapter/getChaptersBySeries");
const updateChapterStatus = require("../controllers/chapter/updateChapterStatus");

// Route cập nhật trạng thái chapter
router.put(
  "/update-status/:chapter_id",
  updateChapterStatus.updateChapterStatus,
);

// Route tạo chapter mới
router.post("/create", creareChapter.Chapter);

// Route lấy chapters theo series_id
router.get("/series/:series_id", getChaptersBySeries.getChaptersBySeries);
module.exports = router;
