const mongoose = require("mongoose");

const annotationSchema = new mongoose.Schema(
  {
    region_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PageRegion",
      // Không require vì có thể comment toàn trang chứ không thuộc một vùng cụ thể
    },
    page_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Page",
      required: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Tài khoản của Editor hoặc Mangaka
      required: true,
    },
    role: {
      type: String,
      required: true,
    }, // Vai trò của người comment lúc đó (vd: 'Tantou Editor')
    coordinates: {
      type: String,
      required: true,
    }, // Tọa độ điểm hoặc vùng hiển thị comment trên ảnh
    comment: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    }, // Phân loại lỗi: nội dung, kịch bản, thoại, nét vẽ...
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Reopened"],
      default: "Open",
    },
  },
  { timestamps: true },
); // Tự động tạo created_at và updated_at

module.exports = mongoose.model("Annotation", annotationSchema);
