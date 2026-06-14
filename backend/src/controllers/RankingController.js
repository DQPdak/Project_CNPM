const RankingService = require("../services/RankingService");
const { ROLES } = require("../constants/roles");

const getLeaderboard = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { issueId, genre, authorId } = req.query;

    let records = await RankingService.getVoteHistory();
    const seriesStore = await RankingService.getSeriesStore();

    if (role === ROLES.MANGAKA) {
      const mySeriesIds = seriesStore
        .filter((series) => series.authorId === userId)
        .map((series) => series.id);
      records = records.filter((record) => mySeriesIds.includes(record.seriesId));
    } else if (role === ROLES.TANTOU_EDITOR) {
      const managedSeriesIds = seriesStore
        .filter((series) => series.editorId === userId)
        .map((series) => series.id);
      records = records.filter((record) =>
        managedSeriesIds.includes(record.seriesId),
      );
    }

    if (issueId) {
      records = records.filter((record) => record.issueId === issueId);
    }
    if (authorId) {
      records = records.filter((record) => {
        const series = seriesStore.find((item) => item.id === record.seriesId);
        return series && series.authorId === authorId;
      });
    }
    if (genre) {
      records = records.filter((record) => {
        const series = seriesStore.find((item) => item.id === record.seriesId);
        return series && series.genre.toLowerCase() === genre.toLowerCase();
      });
    }

    const detailedRecords = records.map((record) => {
      const series = seriesStore.find((item) => item.id === record.seriesId);
      return { ...record, seriesName: series ? series.name : "Unknown series" };
    });

    res.json(detailedRecords);
  } catch (error) {
    res.status(500).json({ error: "Lỗi hệ thống khi lấy bảng xếp hạng: " + error.message });
  }
};

const getPerformanceChartData = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const records = await RankingService.getVoteHistory();
    const targetShortId = await RankingService.getShortId(seriesId);

    const chartData = records
      .filter((record) => record.seriesId === targetShortId || record.seriesId === seriesId)
      .map((record) => ({
        issueId: record.issueId,
        rank: record.currentRank,
        totalScore: record.totalScore,
        votes: record.votes,
      }))
      .sort((left, right) => left.issueId.localeCompare(right.issueId));

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: "Lỗi hệ thống khi lấy biểu đồ hiệu suất: " + error.message });
  }
};

module.exports = { getLeaderboard, getPerformanceChartData };
