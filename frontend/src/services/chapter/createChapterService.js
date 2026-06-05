const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const createChapter = async (chapterData) => {
  try {
    const res = await fetch(`${API_URL}/chapters/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chapterData), // Gồm: series_id, chapter_number, title, deadline...
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data.message || "Khởi tạo Chapter mới thất bại",
      };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      message: "Lỗi server khi tạo Chapter",
      error: err,
    };
  }
};

export default createChapter;
