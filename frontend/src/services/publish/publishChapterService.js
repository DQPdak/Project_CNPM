const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const publishChapter = async (chapterId, releaseIssueId = null) => {
  try {
    const payload = releaseIssueId ? { release_issue_id: releaseIssueId } : {};

    const res = await fetch(`${API_URL}/publish/chapter/${chapterId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // API này chỉ gửi JSON nên CẦN truyền Content-Type
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        // Dùng data.message của Backend trả về (Vd: "Không thể xuất bản. Vẫn còn trang truyện chưa được phê duyệt")
        message:
          data.message || "Xuất bản Chapter thất bại, vui lòng kiểm tra lại",
        data: data, // Trả luôn toàn bộ cục data để Frontend biết có bao nhiêu trang/task bị lỗi
      };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      message: "Lỗi server",
      error: err,
    };
  }
};

export default publishChapter;
