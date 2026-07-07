const Chapter = require("../../models/ChapterModel");
const Page = require("../../models/PageModel");
const PageRegion = require("../../models/PageRegionModel");
const Annotation = require("../../models/AnnotationModel");
const Task = require("../../models/TaskModel");

exports.deleteChapter = async (req, res) => {
  try {
    const { chapter_id } = req.params;

    const chapter = await Chapter.findById(chapter_id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chương truyện",
      });
    }

    // Chỉ cho phép hủy/xóa nếu trạng thái là Draft (Bản nháp)
    if (chapter.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Chỉ được phép hủy chương truyện ở trạng thái Bản nháp",
      });
    }

    // Tìm các trang thuộc chapter để xóa tài liệu con liên quan
    const pages = await Page.find({ chapter_id });
    const pageIds = pages.map(p => p._id);

    await Promise.all([
      // Xóa chapter
      Chapter.findByIdAndDelete(chapter_id),
      // Xóa các trang thuộc chapter
      Page.deleteMany({ chapter_id }),
      // Xóa các phân vùng, góp ý và task trợ lý thuộc các trang của chapter
      PageRegion.deleteMany({ page_id: { $in: pageIds } }),
      Annotation.deleteMany({ page_id: { $in: pageIds } }),
      Task.deleteMany({ page_id: { $in: pageIds } }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Đã hủy chương truyện thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy chương truyện",
      error: error.message,
    });
  }
};
