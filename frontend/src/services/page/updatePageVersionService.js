import { apiFetch } from "../apiClient";

const updatePageVersion = async (pageId, file) => {
  try {
    const formData = new FormData();
    formData.append("page", file);

    return await apiFetch(`/pages/update/${pageId}`, {
      method: "PUT",
      body: formData,
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Cap nhat version that bai.",
    };
  }
};

export default updatePageVersion;
