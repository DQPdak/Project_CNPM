const mongoose = require("mongoose");

const boardVoteSchema = new mongoose.Schema(
  {
    series_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Series",
      required: true,
    },
    board_member_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vote: {
      type: String,
      enum: [
        "Approve",
        "Reject",
        "Need Revision", // Dùng cho lúc duyệt series mới
        "Continue",
        "Cancel",
        "Hiatus",
        "Change Schedule", // Dùng cho lúc đánh giá định kỳ
      ],
      required: true,
    },
    comment: {
      type: String, // Lời phê/góp ý của thành viên hội đồng
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BoardVote", boardVoteSchema);
