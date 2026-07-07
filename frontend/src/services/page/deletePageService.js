import { apiFetch } from "../apiClient";

const deletePage = async (pageId) => {
  try {
    return await apiFetch(`/pages/${pageId}`, {
      method: "DELETE",
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Xóa bản thảo thất bại.",
    };
  }
};

export default deletePage;
