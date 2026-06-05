const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const uploadPages = async (chapterId, files) => {
  try {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("pages", files[i]); // "pages" phải khớp với upload.array('pages') ở Backend
    }

    const res = await fetch(`${API_URL}/pages//upload/${chapterId}/upload`, {
      method: "POST",
      // KHÔNG truyền Content-Type ở đây. Trình duyệt sẽ tự động xử lý FormData!
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message:
          data.message || "Tải lên bản thảo thất bại, vui lòng kiểm tra lại",
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

export default uploadPages;
