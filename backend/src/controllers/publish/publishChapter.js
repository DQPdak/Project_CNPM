const Chapter = require("../../models/ChapterModel");
const Page = require("../../models/PageModel");

exports.publishChapter = async (req, res) => {
  try {
    const { chapter_id } = req.params;
    const { release_issue_id } = req.body;

    const chapter = await Chapter.findById(chapter_id);

    // kiểm tra xem chapter có tồn tại không
    if (!chapter) {
      return res.status(404).json({ message: "Không tìm thấy chapter" });
    }
    // kiểm tra xem chapter đã có trang nào hay chưa
    const pages = await Page.find({ chapter_id });
    if (pages.length === 0) {
      return res.status(400).json({ message: "Chapter chưa có trang nào" });
    }

    // Lọc ra các trang chưa được phê duyệt
    const unapprovedPages = pages.filter((page) => page.status !== "Approved");
    // kiểm tra xem có trang nào chưa được phê duyệt không vì các trang phải được duyệt thì mới đủ điều kiện xuất bản
    if (unapprovedPages.length > 0) {
      return res.status(400).json({
        message: "Không thể xuất bản. Vẫn còn trang truyện chưa được phê duyệt",
        unapprovedPages_count: unapprovedPages.length,
      });
    }

    // Nếu tất cả các trang đã được phê duyệt, cập nhật trạng thái của chapter thành "Published"
    chapter.status = "Published";
    chapter.published_at = new Date();
    if (release_issue_id) {
      chapter.release_issue_id = release_issue_id;
    }
    await chapter.save();

    res.status(200).json({ message: "Xuất bản chapter thành công", chapter });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};
