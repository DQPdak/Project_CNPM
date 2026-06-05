const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const updateChapterStatus = async (chapterId, newStatus) => {
  try {
    const res = await fetch(`${API_URL}/chapters/update-status/${chapterId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data.message || "Cập nhật trạng thái Chapter thất bại",
      };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      message: "Lỗi server khi cập nhật trạng thái",
      error: err,
    };
  }
};

export default updateChapterStatus;
