const mongoose = require("mongoose");

const readerVoteSchema = new mongoose.Schema(
  {
    release_issue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReleaseIssue",
      required: true,
    },
    series_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series",
      required: true,
    },
    chapter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    vote_count: {
      type: Number,
      default: 0,
    }, // Số lượng phiếu bầu
    average_score: {
      type: Number,
      default: 0,
    }, // Điểm trung bình đánh giá
    rank: {
      type: Number,
    }, // Thứ hạng của chương/series trong kỳ phát hành này
    reader_comments: {
      type: String,
    }, // Tổng hợp bình luận nổi bật của độc giả
  },
  { timestamps: true },
); // Tự động tạo created_at và updated_at

module.exports = mongoose.model("ReaderVote", readerVoteSchema);
