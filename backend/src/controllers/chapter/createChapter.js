const Chapter = require("../../models/ChapterModel");

// Tạo chapter mới
exports.Chapter = async (req, res) => {
  try {
    const { series_id, chapter_number, title, deadline } = req.body;

    const newChapter = new Chapter({
      series_id,
      chapter_number,
      title,
      deadline,
    });

    await newChapter.save();

    res
      .status(201)
      .json({ message: "Tạo chapter thành công", chapter: newChapter });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
