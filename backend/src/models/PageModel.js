const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    chapter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    page_number: {
      type: Number,
      required: true,
    },
    file_url: {
      type: String,
      required: true,
    }, // Đường dẫn tới file ảnh của trang truyện
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["Draft", "In Progress", "Ready For Review", "Approved"],
      default: "Draft",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Page", pageSchema);
