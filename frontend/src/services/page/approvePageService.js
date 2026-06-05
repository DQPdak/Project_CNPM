const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const approvePage = async (pageId) => {
  try {
    const res = await fetch(`${API_URL}/pages/approve/${pageId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      // API này không cần body vì chỉ việc đổi trạng thái dựa theo pageId trên param
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message:
          data.message || "Duyệt trang truyện thất bại, vui lòng kiểm tra lại",
      };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      message: "Lỗi server khi duyệt trang",
      error: err,
    };
  }
};

export default approvePage;
