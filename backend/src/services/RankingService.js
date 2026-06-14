// Mock Data mô phỏng dữ liệu hệ thống để chạy độc lập không lo lỗi kết nối DB
let releaseIssues = []; 
let seriesDataStore = [
    { id: "S1", name: "One Piece", authorId: "A1", editorId: "E1", genre: "Shonen", status: "Ongoing" },
    { id: "S2", name: "Naruto", authorId: "A2", editorId: "E1", genre: "Shonen", status: "Ongoing" },
    { id: "S3", name: "Bleach", authorId: "A3", editorId: "E2", genre: "Action", status: "Ongoing" },
    { id: "S4", name: "Conan", authorId: "A4", editorId: "E2", genre: "Mystery", status: "Ongoing" }
];
let voteHistory = [];

class Task8RankingService {
    // Thuật toán tính điểm, xếp hạng, Trend & Cảnh báo hủy 
    static calculateRankingAndTrends(issueId, rawVotes) {
        let processedVotes = rawVotes.map(vote => {
            // Công thức tính tổng điểm dựa trên số phiếu và điểm trung bình [cite: 152]
            const totalScore = parseFloat((vote.votes * 0.6 + vote.avgScore * 0.4).toFixed(2));
            return {
                ...vote,
                issueId,
                totalScore,
                currentRank: 0,
                trend: "NEW",
                cancellationWarning: false
            };
        });

        // Sắp xếp thứ hạng giảm dần theo điểm [cite: 152, 158]
        processedVotes.sort((a, b) => b.totalScore - a.totalScore);
        processedVotes.forEach((item, index) => {
            item.currentRank = index + 1;
        });

        const previousIssueVotes = voteHistory.filter(h => h.issueId !== issueId);

        // So sánh với kỳ trước để tìm xu hướng (Trend) và cảnh báo hủy [cite: 57, 161]
        processedVotes = processedVotes.map(current => {
            const prevData = previousIssueVotes
                .filter(h => h.seriesId === current.seriesId)
                .sort((a, b) => b.issueId.localeCompare(a.issueId))[0];

            if (prevData) {
                if (current.currentRank < prevData.currentRank) {
                    current.trend = "UP"; // Tăng hạng [cite: 158]
                } else if (current.currentRank > prevData.currentRank) {
                    current.trend = "DOWN"; // Tụt hạng [cite: 158]
                } else {
                    current.trend = "STABLE";
                }

                // Cảnh báo hủy nếu xếp hạng thấp (ví dụ top dưới) hoặc tụt hạng [cite: 161]
                if (current.currentRank >= 4 || current.trend === "DOWN") {
                    current.cancellationWarning = true;
                }
            } else {
                current.trend = "STABLE";
            }

            return current;
        });

        voteHistory = [...voteHistory, ...processedVotes];
        return processedVotes;
    }

    static getVoteHistory() { return voteHistory; }
    static getSeriesStore() { return seriesDataStore; }
    static getReleaseIssues() { return releaseIssues; }
}

module.exports = Task8RankingService;