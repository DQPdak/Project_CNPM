const RankingService = require("../services/RankingService");
const xlsx = require('xlsx');

// Tạo Kỳ phát hành mới kèm Validate đầu vào [cite: 151, 154]
const createReleaseIssue = (req, res) => {
    const { id, name, releaseDate, seriesList, type } = req.body;
    const issues = RankingService.getReleaseIssues();

    // Kiểm tra dữ liệu: Không trùng kỳ [cite: 154]
    const isDuplicate = issues.some(issue => issue.id === id || issue.name === name);
    if (isDuplicate) {
        return res.status(400).json({ error: "Kỳ phát hành hoặc tên kỳ này đã tồn tại!" });
    }

    const newIssue = { id, name, releaseDate, seriesList, type };
    issues.push(newIssue);
    res.status(201).json({ message: "Tạo kỳ phát hành thành công!", data: newIssue });
};

// Xử lý Import dữ liệu bình chọn từ Excel/CSV [cite: 56, 153]
const importVoteData = (req, res) => {
    const { issueId } = req.params;
    if (!req.file) {
        return res.status(400).json({ error: "Vui lòng đính kèm file Excel hoặc CSV mẫu." });
    }

    try {
        // Đọc dữ liệu từ luồng buffer của file tải lên
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(sheet);

        const validVotes = [];
        const seriesStore = RankingService.getSeriesStore();

        for (const row of rawData) {
            // Kiểm tra series hợp lệ và số phiếu hợp lệ [cite: 154]
            const seriesExists = seriesStore.some(s => s.id === row.seriesId);
            if (!seriesExists) {
                return res.status(400).json({ error: `Mã truyện (Series ID) ${row.seriesId} không tồn tại trên hệ thống.` });
            }
            if (row.votes < 0 || row.avgScore < 0) {
                return res.status(400).json({ error: "Số phiếu bầu và điểm số phải là số dương hợp lệ." });
            }
            validVotes.push({
                seriesId: row.seriesId,
                votes: parseInt(row.votes),
                avgScore: parseFloat(row.avgScore),
                comments: parseInt(row.comments || 0),
                views: parseInt(row.views || 0)
            });
        }

        // Thực thi thuật toán xếp hạng [cite: 57]
        const result = RankingService.calculateRankingAndTrends(issueId, validVotes);
        res.status(200).json({ message: "Import dữ liệu độc giả và xử lý xếp hạng thành công!", data: result });
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống khi đọc cấu trúc file: " + error.message });
    }
};

module.exports = { createReleaseIssue, importVoteData };
