const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const approvePage = async (pageId) => {
  try {
    const res = await fetch(`${API_URL}/pages/approve/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data.message || "Duyệt trang truyện thất bại",
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: "Lỗi server", error: err };
  }
};

export default approvePage;
