const mongoose = require("mongoose");
const Series = require("../models/SeriesModel");
const User = require("../models/UserModel");
const ReleaseIssue = require("../models/ReleaseIssueModel");
const ReaderVote = require("../models/ReaderVoteModel");
const Ranking = require("../models/RankingModel");

// Ánh xạ từ ID ngắn từ Frontend sang tên truyện tương ứng
const SHORT_ID_MAP = {
  "S1": "One Piece",
  "S2": "Naruto",
  "S3": "Bleach",
  "S4": "Conan"
};

class RankingService {
  // Giải quyết ID từ frontend (S1, S2, hoặc MongoDB ObjectId) thành ObjectId thực tế của Series trong DB
  static async resolveSeriesId(shortIdOrMongoId) {
    if (!shortIdOrMongoId) return null;

    if (mongoose.Types.ObjectId.isValid(shortIdOrMongoId)) {
      return shortIdOrMongoId;
    }

    const title = SHORT_ID_MAP[shortIdOrMongoId];
    if (!title) return null;

    // Tìm truyện trong DB
    let series = await Series.findOne({ title });
    if (!series) {
      // Tự động tạo truyện mới nếu chưa có trong DB để tránh lỗi hệ thống
      let user = await User.findOne();
      if (!user) {
        user = await User.create({
          name: "System Admin",
          email: "admin@example.com",
          password: "password_hash_placeholder",
          role: "Admin",
          status: "Active"
        });
      }

      series = await Series.create({
        title,
        description: `Truyện được tạo tự động cho hệ thống xếp hạng: ${title}`,
        genre: shortIdOrMongoId === "S1" || shortIdOrMongoId === "S2" ? "Shonen" : (shortIdOrMongoId === "S3" ? "Action" : "Mystery"),
        target_audience: "Teen",
        author_id: user._id,
        status: "Active"
      });
    }

    return series._id;
  }

  // Chuyển đổi ObjectId của Series trong DB thành mã ID ngắn S1-S4 cho Frontend
  static async getShortId(seriesObjectId) {
    if (!seriesObjectId) return "Unknown";

    if (SHORT_ID_MAP[seriesObjectId]) {
      return seriesObjectId;
    }

    if (!mongoose.Types.ObjectId.isValid(seriesObjectId)) {
      return seriesObjectId.toString();
    }
    
    const series = await Series.findById(seriesObjectId);
    if (!series) return seriesObjectId.toString();
    
    for (const [shortId, title] of Object.entries(SHORT_ID_MAP)) {
      if (series.title && series.title.toLowerCase() === title.toLowerCase()) {
        return shortId;
      }
    }
    return series._id.toString();
  }

  // Thuật toán tính điểm, xếp hạng, tìm xu hướng và lưu dữ liệu vào MongoDB
  static async calculateRankingAndTrends(customIssueId, rawVotes) {
    // 1. Tìm hoặc tạo Kỳ phát hành trong DB
    let issue = await ReleaseIssue.findOne({ custom_id: customIssueId });
    if (!issue) {
      issue = await ReleaseIssue.create({
        custom_id: customIssueId,
        title: `Kỳ phát hành ${customIssueId}`,
        release_date: new Date(),
        type: "Weekly",
        status: "Published"
      });
    }

    // 2. Chuẩn bị dữ liệu và tính điểm tổng hợp cho từng series
    let processedVotes = [];
    const seriesObjectIdList = [];

    for (const vote of rawVotes) {
      const seriesObjectId = await this.resolveSeriesId(vote.seriesId);
      if (!seriesObjectId) continue;

      seriesObjectIdList.push(seriesObjectId);

      const totalScore = parseFloat((vote.votes * 0.6 + vote.avgScore * 0.4).toFixed(2));
      processedVotes.push({
        series_id: seriesObjectId,
        vote_count: vote.votes,
        average_score: vote.avgScore,
        views: vote.views || 0,
        comments: vote.comments || 0,
        totalScore,
        currentRank: 0,
        trend: "NEW",
        cancellationWarning: false
      });
    }

    // Cập nhật danh sách truyện vào Kỳ phát hành
    issue.series_list = seriesObjectIdList;
    await issue.save();

    // 3. Sắp xếp thứ hạng giảm dần theo điểm tổng hợp
    processedVotes.sort((a, b) => b.totalScore - a.totalScore);
    processedVotes.forEach((item, index) => {
      item.currentRank = index + 1;
    });

    // 4. Tìm kỳ phát hành trước đó (theo thời gian gần nhất) để tính xu hướng
    const allIssues = await ReleaseIssue.find().sort({ release_date: -1 });
    const currentIssueIndex = allIssues.findIndex(i => i.custom_id === customIssueId);
    let prevIssue = null;
    if (currentIssueIndex !== -1 && currentIssueIndex < allIssues.length - 1) {
      prevIssue = allIssues[currentIssueIndex + 1];
    } else {
      prevIssue = await ReleaseIssue.findOne({ custom_id: { $ne: customIssueId } }).sort({ release_date: -1 });
    }

    // 5. So sánh thứ hạng và lưu dữ liệu vào DB
    for (let current of processedVotes) {
      let previousRankVal = null;
      if (prevIssue) {
        const prevRanking = await Ranking.findOne({
          release_issue_id: prevIssue._id,
          series_id: current.series_id
        });

        if (prevRanking) {
          previousRankVal = prevRanking.rank;
          if (current.currentRank < prevRanking.rank) {
            current.trend = "UP";
          } else if (current.currentRank > prevRanking.rank) {
            current.trend = "DOWN";
          } else {
            current.trend = "STABLE";
          }

          if (current.currentRank >= 4 || current.trend === "DOWN") {
            current.cancellationWarning = true;
          }
        } else {
          current.trend = "STABLE";
        }
      } else {
        current.trend = "STABLE";
      }

      // Lưu/Cập nhật dữ liệu bình chọn (ReaderVote)
      await ReaderVote.findOneAndUpdate(
        { release_issue_id: issue._id, series_id: current.series_id },
        {
          release_issue_id: issue._id,
          series_id: current.series_id,
          vote_count: current.vote_count,
          average_score: current.average_score,
          views: current.views,
          comments: current.comments,
          rank: current.currentRank
        },
        { upsert: true, new: true }
      );

      // Lưu/Cập nhật dữ liệu xếp hạng (Ranking)
      await Ranking.findOneAndUpdate(
        { release_issue_id: issue._id, series_id: current.series_id },
        {
          release_issue_id: issue._id,
          series_id: current.series_id,
          rank: current.currentRank,
          previous_rank: previousRankVal,
          score: current.totalScore,
          trend: current.trend,
          cancellationWarning: current.cancellationWarning
        },
        { upsert: true, new: true }
      );
    }

    // 6. Trả về kết quả sau khi cập nhật
    return await this.getVoteHistory();
  }

  // Lấy lịch sử xếp hạng kết hợp đầy đủ thông tin từ DB để trả về cho Frontend
  static async getVoteHistory() {
    const rankings = await Ranking.find().populate("release_issue_id").populate("series_id");
    const result = [];
    
    for (const r of rankings) {
      if (!r.release_issue_id || !r.series_id) continue;

      const vote = await ReaderVote.findOne({
        release_issue_id: r.release_issue_id._id,
        series_id: r.series_id._id
      });

      const shortId = await this.getShortId(r.series_id._id);

      result.push({
        seriesId: shortId,
        seriesName: r.series_id.title,
        issueId: r.release_issue_id.custom_id,
        votes: vote ? vote.vote_count : 0,
        avgScore: vote ? vote.average_score : 0,
        views: vote ? vote.views : 0,
        comments: vote ? vote.comments : 0,
        totalScore: r.score,
        currentRank: r.rank,
        trend: r.trend,
        cancellationWarning: r.cancellationWarning
      });
    }
    return result;
  }

  // Trả về danh sách truyện mapped dạng short ID để tương thích frontend
  static async getSeriesStore() {
    const seriesList = await Series.find().populate("author_id").populate("editor_id");
    const result = [];
    
    for (const s of seriesList) {
      const shortId = await this.getShortId(s._id);
      result.push({
        id: shortId,
        name: s.title,
        authorId: s.author_id ? s.author_id._id.toString() : "A1",
        editorId: s.editor_id ? s.editor_id._id.toString() : "E1",
        genre: s.genre || "Shonen",
        status: s.status || "Active"
      });
    }
    return result;
  }

  // Trả về danh sách các kỳ phát hành từ MongoDB
  static async getReleaseIssues() {
    const issues = await ReleaseIssue.find().sort({ release_date: -1 });
    return issues.map(i => ({
      id: i.custom_id,
      name: i.title,
      releaseDate: i.release_date,
      type: i.type,
      status: i.status
    }));
  }
}

module.exports = RankingService;
