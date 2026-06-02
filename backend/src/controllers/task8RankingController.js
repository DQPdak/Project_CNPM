const Task8RankingService = require('../services/task8RankingService');

// Lấy bảng xếp hạng có lọc thông minh và phân quyền xem theo Role Scoping [cite: 159, 162]
const getLeaderboard = (req, res) => {
    const { role, id: userId } = req.user;
    const { issueId, genre, authorId } = req.query;

    let records = Task8RankingService.getVoteHistory();
    const seriesStore = Task8RankingService.getSeriesStore();

    // CHÚ THÍCH ROLE: Phân chia phạm vi xem chính xác [cite: 162]
    if (role === 'Mangaka') {
        // Mangaka chỉ xem được series của mình [cite: 162]
        const mySeriesIds = seriesStore.filter(s => s.authorId === userId).map(s => s.id);
        records = records.filter(r => mySeriesIds.includes(r.seriesId));
    } else if (role === 'Editor') {
        // Editor chỉ xem được series mình phụ trách phụ trách [cite: 162]
        const managedSeriesIds = seriesStore.filter(s => s.editorId === userId).map(s => s.id);
        records = records.filter(r => managedSeriesIds.includes(r.seriesId));
    } // Board và Admin mặc định được quyền xem toàn bộ bảng xếp hạng [cite: 162]

    // Áp dụng bộ lọc (Lọc theo kỳ, thể loại, tác giả...) [cite: 159]
    if (issueId) records = records.filter(r => r.issueId === issueId);
    if (authorId) records = records.filter(r => {
        const series = seriesStore.find(s => s.id === r.seriesId);
        return series && series.authorId === authorId;
    });
    if (genre) records = records.filter(r => {
        const series = seriesStore.find(s => s.id === r.seriesId);
        return series && series.genre.toLowerCase() === genre.toLowerCase();
    });

    const detailedRecords = records.map(r => {
        const series = seriesStore.find(s => s.id === r.seriesId);
        return { ...r, seriesName: series ? series.name : "Truyện chưa rõ" };
    });

    res.json(detailedRecords);
};

// Trả về mảng dữ liệu lịch sử phục vụ vẽ biểu đồ tiến độ bên Frontend (Chart.js/Recharts) [cite: 58, 160]
const getPerformanceChartData = (req, res) => {
    const { seriesId } = req.params;
    const records = Task8RankingService.getVoteHistory();

    const chartData = records
        .filter(r => r.seriesId === seriesId)
        .map(r => ({
            issueId: r.issueId,
            rank: r.currentRank,
            totalScore: r.totalScore,
            votes: r.votes
        }))
        .sort((a, b) => a.issueId.localeCompare(b.issueId));

    res.json(chartData);
};

module.exports = { getLeaderboard, getPerformanceChartData };