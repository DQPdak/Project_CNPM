import React from "react";
import { useParams } from "react-router-dom";

export default function PageManagementPage() {
  const { chapterId } = useParams(); // Lấy ID từ URL
  return (
    <div className="p-10 text-2xl font-bold text-blue-600">
      Trang 2: Quản lý bản thảo của Chapter: {chapterId}
    </div>
  );
}
