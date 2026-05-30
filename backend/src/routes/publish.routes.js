const express = require("express");
const router = express.Router();
const publishChapter = require("../controllers/publish/publishChapter");

router.post("/chapter/:chapter_id", publishChapter.publishChapter);

module.exports = router;
