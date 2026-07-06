const RankingService = require("../services/RankingService");
const ReleaseIssue = require("../models/ReleaseIssueModel");
const xlsx = require('xlsx');

const getReleaseIssues = async (req, res) => {
    try {
        const issues = await ReleaseIssue.find({}).populate("series_list");
        res.status(200).json({ success: true, data: issues });
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách kỳ phát hành: " + error.message });
    }
};

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
            if (!row.seriesId) continue;

            // Tìm kiếm linh hoạt theo ID, slug, hoặc title (không phân biệt hoa thường)
            const matchedSeries = seriesStore.find(s => 
                s.id === row.seriesId || 
                (s.slug && s.slug.toLowerCase() === row.seriesId.toString().toLowerCase()) ||
                (s.name && s.name.toLowerCase() === row.seriesId.toString().toLowerCase())
            );

            // Nếu không tìm thấy truyện, bỏ qua dòng này để import diễn ra mượt mà
            if (!matchedSeries) {
                console.warn(`Bỏ qua dòng import do không tìm thấy Series: ${row.seriesId}`);
                continue;
            }

            // Đảm bảo số phiếu bầu và điểm số hợp lệ, bỏ qua nếu âm
            const votes = parseInt(row.votes);
            const avgScore = parseFloat(row.avgScore);

            if (isNaN(votes) || votes < 0 || isNaN(avgScore) || avgScore < 0) {
                continue;
            }

            validVotes.push({
                seriesId: matchedSeries.id,
                votes: votes,
                avgScore: avgScore,
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

module.exports = { getReleaseIssues, createReleaseIssue, importVoteData };
