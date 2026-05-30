const Page = require("../../models/PageModel");

// Cập nhật phiên bản của một trang (ghi đè lên phiên bản cũ)
exports.updatePageVersion = async (req, res) => {
  try {
    const { page_id } = req.params;

    // Kiểm tra xem file mới có tồn tại hay không
    if (!req.file) {
      return res.status(400).json({ message: "Không có file nào được upload" });
    }

    const updatedPage = await Page.findByIdAndUpdate(
      page_id,
      {
        file_url: req.file.path,
        $inc: { version: 1 },
      },
      { new: true },
    );

    res
      .status(200)
      .json({
        message: "Cập nhật phiên bản trang thành công",
        page: updatedPage,
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Lỗi server", detail: err.message });
  }
};
