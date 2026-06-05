const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const uploadPages = async (chapterId, files) => {
  try {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("pages", files[i]); 
    }

    const res = await fetch(`${API_URL}/pages/upload/${chapterId}/upload`, {
      method: "POST",
      body: formData, // FormData tự động set Content-Type
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data.message || "Tải lên bản thảo thất bại",
      };
    }
    return data; 
  } catch (err) {
    return { success: false, message: "Lỗi server", error: err };
  }
};

export default uploadPages;