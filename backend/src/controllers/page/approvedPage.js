const Page = require("../../models/PageModel");

exports.approvePage = async (req, res) => {
  try {
    const { page_id } = req.params;
    const { status } = req.body;

    // Kiểm tra status có nằm trong enum của PageModel không
    const validStatuses = [
      "Draft",
      "In Progress",
      "Ready For Review",
      "Approved",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái trang không hợp lệ" });
    }

    const updatedPage = await Page.findByIdAndUpdate(
      page_id,
      { status: status },
      { new: true }, // Trả về data mới nhất sau khi cập nhật
    );

    if (!updatedPage) {
      return res.status(404).json({ message: "Không tìm thấy trang truyện" });
    }

    res.status(200).json({
      message:
        status === "Approved"
          ? "Đã chốt bản Final cho trang này"
          : "Cập nhật trạng thái trang thành công",
      page: updatedPage,
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
