import { apiFetch } from "../apiClient";

const uploadPages = async (chapterId, files) => {
  try {
    const formData = new FormData();
    for (let i = 0; i < files.length; i += 1) {
      formData.append("pages", files[i]);
    }

    return await apiFetch(`/pages/upload/${chapterId}/upload`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Tai len ban thao that bai.",
    };
  }
};

export default uploadPages;
