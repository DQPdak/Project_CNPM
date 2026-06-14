const RankingService = require("../services/RankingService");
const ReleaseIssue = require("../models/ReleaseIssueModel");
const xlsx = require('xlsx');

// Tạo Kỳ phát hành mới kèm Validate đầu vào
const createReleaseIssue = async (req, res) => {
    try {
        const { id, name, releaseDate, seriesList, type } = req.body;

        // Kiểm tra dữ liệu: Không trùng kỳ
        const isDuplicate = await ReleaseIssue.findOne({
            $or: [{ custom_id: id }, { title: name }]
        });
        if (isDuplicate) {
            return res.status(400).json({ error: "Kỳ phát hành hoặc tên kỳ này đã tồn tại!" });
        }

        // Giải quyết seriesList thành ObjectIds
        const resolvedSeriesIds = [];
        for (const sId of (seriesList || [])) {
            const objId = await RankingService.resolveSeriesId(sId);
            if (objId) {
                resolvedSeriesIds.push(objId);
            }
        }

        const newIssue = await ReleaseIssue.create({
            custom_id: id,
            title: name,
            release_date: new Date(releaseDate),
            type,
            series_list: resolvedSeriesIds,
            status: "Planned"
        });

        res.status(201).json({
            message: "Tạo kỳ phát hành thành công!",
            data: {
                id: newIssue.custom_id,
                name: newIssue.title,
                releaseDate: newIssue.release_date,
                type: newIssue.type,
                status: newIssue.status
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống khi tạo kỳ phát hành: " + error.message });
    }
};

// Xử lý Import dữ liệu bình chọn từ Excel/CSV
const importVoteData = async (req, res) => {
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
        const seriesStore = await RankingService.getSeriesStore();

        for (const row of rawData) {
            // Kiểm tra series hợp lệ và số phiếu hợp lệ
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

        // Thực thi thuật toán xếp hạng và lưu DB
        const result = await RankingService.calculateRankingAndTrends(issueId, validVotes);
        
        // Trả về kết quả sau cùng
        res.status(200).json({ message: "Import dữ liệu độc giả và xử lý xếp hạng thành công!", data: result });
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống khi đọc cấu trúc file hoặc xử lý xếp hạng: " + error.message });
    }
};

module.exports = { createReleaseIssue, importVoteData };
