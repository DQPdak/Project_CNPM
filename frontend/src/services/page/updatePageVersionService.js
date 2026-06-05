const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const updatePageVersion = async (pageId, file) => {
  try {
    const formData = new FormData();
    formData.append("page", file);

    const res = await fetch(`${API_URL}/pages/update/${pageId}`, {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data.message || "Cập nhật Version thất bại",
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: "Lỗi server", error: err };
  }
};

export default updatePageVersion;
