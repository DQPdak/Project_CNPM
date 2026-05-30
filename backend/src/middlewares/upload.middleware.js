const multer = require("multer");
const { cloudinary } = require("../config/config_cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "manga_images", // Thư mục trên Cloudinary để lưu trữ ảnh
    allowed_formats: ["jpg", "jpeg", "png", "webp"], // Định dạng ảnh được phép tải lên
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
