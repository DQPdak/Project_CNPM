const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const updatePageVersion = async (pageId, file) => {
  try {
    const formData = new FormData();
    formData.append("page", file); // "page" phải khớp với upload.single('page') ở Backend

    const res = await fetch(`${API_URL}/pages/update/${pageId}`, {
      method: "PUT",
      // Tương tự, KHÔNG truyền Content-Type cho FormData
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message:
          data.message || "Cập nhật Version thất bại, vui lòng kiểm tra lại",
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

export default updatePageVersion;
