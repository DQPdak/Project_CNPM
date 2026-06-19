const Chapter = require("../../models/ChapterModel");
const Series = require("../../models/SeriesModel");
const {
  canAccessSeries,
} = require("../../modules/authorization/middlewares/scope");

exports.Chapter = async (req, res) => {
  try {
    const { series_id, chapter_number, title, deadline } = req.body;
    const series = await Series.findById(series_id);

    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    if (!canAccessSeries(req.user, series, "write")) {
      return res.status(403).json({
        error: {
          code: "AUTHZ_SCOPE_DENIED",
          message: "You do not have access to this series.",
        },
      });
    }

    const newChapter = new Chapter({
      series_id,
      chapter_number,
      title,
      deadline,
    });

    await newChapter.save();

    return res.status(201).json({
      message: "Tạo chapter thành công",
      chapter: newChapter,
      success: true,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
