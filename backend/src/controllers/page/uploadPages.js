const Page = require("../../models/PageModel");
const Chapter = require("../../models/ChapterModel");

// Upload nhiều trang chuyện cùng 1 lúc
exports.uploadPages = async (req, res) => {
  try {
    const { chapter_id } = req.params;

    // kiểm tra xem có file nào được upload hay không
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có file nào được upload" });
    }
    // Lấy số lượng trang đã tồn tại trong chapter để đánh số tiếp theo
    const existingPagesCount = await Page.countDocuments({ chapter_id });

    const page = [];

    // duyệt qua từng file được upload và tạo bản ghi Page mới
    for (let i = 0; i < req.files.length; i++) {
      const newPage = new Page({
        chapter_id,
        page_number: existingPagesCount + i + 1, // đánh số trang tiếp theo
        file_url: req.files[i].path, // lưu lại đường dẫn từ Cloudinary trả về
        version: 1,
      });
      await newPage.save();
      page.push(newPage);
    }
    await Chapter.findByIdAndUpdate(chapter_id, { status: "In Production" }); // cập nhật trạng thái chapter
    res
      .status(200)
      .json({ message: "Upload pages thành công", pages: page, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Lỗi server", detail: err.message });
  }
};
