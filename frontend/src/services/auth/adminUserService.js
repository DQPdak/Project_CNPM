import { apiFetch } from "../apiClient";

export const listUsers = async () => {
  try {
    return await apiFetch("/auth/users");
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tai danh sach user.",
    };
  }
};

export const createUser = async ({ name, email, password, role, status }) => {
  try {
    return await apiFetch("/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, status }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the tao tai khoan.",
    };
  }
};

export const resetUserPassword = async (userId, newPassword) => {
  try {
    return await apiFetch(`/auth/users/${userId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.message || "Khong the reset mat khau.",
    };
  }
};
