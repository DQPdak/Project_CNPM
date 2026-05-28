const mongoose = require("mongoose");

const releaseIssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    }, // Tên kỳ phát hành (vd: Weekly Shonen Jump Issue 12 - 2024)
    release_date: {
      type: Date,
      required: true,
    }, // Ngày phát hành chính thức
    type: {
      type: String,
      enum: ["Weekly", "Monthly", "Special", "Online"],
      required: true,
    }, // Loại kỳ phát hành (vd: 'Weekly', 'Monthly', 'Special', 'Online')
    status: {
      type: String,
      enum: ["Planned", "Published", "Archived"],
      default: "Planned",
    },
  },
  { timestamps: true },
); // Tự động tạo created_at và updated_at

module.exports = mongoose.model("ReleaseIssue", releaseIssueSchema);
