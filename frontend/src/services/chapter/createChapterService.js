const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const createChapter = async (chapterData) => {
  try {
    const res = await fetch(`${API_URL}/chapters/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chapterData),
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
    return { success: false, message: "Lỗi server", error: err };
  }
};

export default createChapter;
