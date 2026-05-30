const express = require("express");
const router = express.Router();
const creareChapter = require("../controllers/chapter/createChapter");
const getChaptersBySeries = require("../controllers/chapter/getChaptersBySeries");

// Route tạo chapter mới
router.post("/create", creareChapter.Chapter);

// Route lấy chapters theo series_id
router.get("/series/:series_id", getChaptersBySeries.getChaptersBySeries);
module.exports = router;
