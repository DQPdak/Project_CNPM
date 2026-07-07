const Page = require("../../models/PageModel");

exports.getPagesByChapter = async (req, res) => {
  try {
    const { chapter_id } = req.params;
    const pages = await Page.find({
      chapter_id: chapter_id,
    }).sort({ page_number: 1 });

    return res.status(200).json({ pages });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
