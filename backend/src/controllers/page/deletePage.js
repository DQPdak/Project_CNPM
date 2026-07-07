const Page = require("../../models/PageModel");
const PageRegion = require("../../models/PageRegionModel");
const Annotation = require("../../models/AnnotationModel");
const Task = require("../../models/TaskModel");

exports.deletePage = async (req, res) => {
  try {
    const { page_id } = req.params;

    const page = await Page.findById(page_id);
    if (!page) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy trang bản thảo",
      });
    }

    // Chỉ cho phép xóa nếu trạng thái là Draft
    if (page.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Chỉ được phép xóa bản thảo ở trạng thái Bản nháp",
      });
    }

    // Xóa tất cả các dữ liệu liên quan
    await Promise.all([
      Page.findByIdAndDelete(page_id),
      PageRegion.deleteMany({ page_id }),
      Annotation.deleteMany({ page_id }),
      Task.deleteMany({ page_id }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Đã xóa bản thảo thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa bản thảo",
      error: error.message,
    });
  }
};
