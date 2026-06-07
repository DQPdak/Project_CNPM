import React from "react";
import { useAuthStore } from "../../stores/authStore";

const PERMISSION_ROLE_MAP = {
  CAN_CREATE_CHAPTER: ["Mangaka", "Tantou Editor", "Admin"],
  CAN_UPLOAD_PAGE: ["Mangaka", "Tantou Editor", "Admin"],
  CAN_UPDATE_VERSION: ["Mangaka", "Tantou Editor", "Admin"],
  CAN_APPROVE_PAGE: ["Mangaka", "Tantou Editor", "Admin"],
  CAN_PUBLISH_CHAPTER: ["Editorial Board", "Tantou Editor", "Admin"],
};

export default function RequirePermission({ required, children }) {
  const user = useAuthStore((state) => state.user);
  const allowedRoles = PERMISSION_ROLE_MAP[required] || [];
  const hasPermission = user && allowedRoles.includes(user.role);

  return hasPermission ? <>{children}</> : null;
}
