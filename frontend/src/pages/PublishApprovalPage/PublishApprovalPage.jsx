import React from "react";
import { useParams } from "react-router-dom";

export default function PublishApprovalPage() {
  const { chapterId } = useParams();
  return (
    <div className="p-10 text-2xl font-bold text-purple-600">
      Trang 3: Trạm kiểm duyệt xuất bản Chapter: {chapterId}
    </div>
  );
}
