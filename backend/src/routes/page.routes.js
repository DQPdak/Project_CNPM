const express = require("express");
const router = express.Router();
const uploadPages = require("../controllers/page/uploadPages");
const updatePageVersion = require("../controllers/page/updatePageVersion");

// đường dẫn để upload thông qua Cloudinary
const upload = require("../middlewares/upload.middleware");
// luồng sử lý ảnh đi từ giao diện -> Multer (Upload Middleware) ➔ Cloudinary ➔ Controller ➔ Database (MongoDB)
router.post(
  "/upload/:chapter_id/upload",
  upload.array("pages", 50),
  uploadPages.uploadPages,
);

router.put(
  "/update/:page_id",
  upload.single("page"),
  updatePageVersion.updatePageVersion,
);

module.exports = router;
