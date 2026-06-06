import React, { useState } from "react";

export default function RequirePermission({ required, children }) {
  // ----------------------------------------------------------------------
  // ⚠️ KHU VỰC MOCK DATA (GIẢ LẬP QUYỀN HẠN)
  // Hiện tại đang mở TOÀN BỘ QUYỀN để bạn code và test UI.
  // ----------------------------------------------------------------------
  const [mockUserPermissions] = useState([
    "CAN_CREATE_CHAPTER", // Quyền tạo Chapter mới (Mangaka)
    "CAN_UPLOAD_PAGE", // Quyền tải lên 50 file (Mangaka)
    "CAN_UPDATE_VERSION", // Quyền sửa trang lỗi (Mangaka)
    "CAN_APPROVE_PAGE", // Quyền duyệt trang (Editor/Mangaka)
    "CAN_PUBLISH_CHAPTER", // Quyền chốt xuất bản (Board/Editor)
  ]);

  // Kiểm tra xem user có quyền yêu cầu không
  const hasPermission = mockUserPermissions.includes(required);

  // Nếu có quyền -> Hiển thị Component bên trong. Nếu không -> Tàng hình.
  return hasPermission ? <>{children}</> : null;
}
