const RankingService = require("../services/RankingService");
const { ROLES } = require("../constants/roles");

const getLeaderboard = (req, res) => {
  const { role, id: userId } = req.user;
  const { issueId, genre, authorId } = req.query;

  let records = RankingService.getVoteHistory();
  const seriesStore = RankingService.getSeriesStore();

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
};

const getPerformanceChartData = (req, res) => {
  const { seriesId } = req.params;
  const records = RankingService.getVoteHistory();

  const chartData = records
    .filter((record) => record.seriesId === seriesId)
    .map((record) => ({
      issueId: record.issueId,
      rank: record.currentRank,
      totalScore: record.totalScore,
      votes: record.votes,
    }))
    .sort((left, right) => left.issueId.localeCompare(right.issueId));

  res.json(chartData);
};

module.exports = { getLeaderboard, getPerformanceChartData };
