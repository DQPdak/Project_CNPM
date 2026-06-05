const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const getChaptersBySeries = async (seriesId) => {
  try {
    const res = await fetch(`${API_URL}/chapters/series/${seriesId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data.message || "Không thể tải danh sách Chapter",
      };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      message: "Lỗi server khi tải dữ liệu Chapter",
      error: err,
    };
  }
};

export default getChaptersBySeries;
