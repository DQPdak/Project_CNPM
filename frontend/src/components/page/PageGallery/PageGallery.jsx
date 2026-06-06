import React from "react";
import PageItemCard from "../PageItemCard/PageItemCard";
import "./PageGallery.css";

export default function PageGallery({
  pages,
  onApprove,
  onReject,
  onReupload,
}) {
  if (!pages || pages.length === 0) {
    return (
      <div className="gallery-empty">
        <span className="empty-icon">🖼️</span>
        <h3>Chưa có bản thảo nào</h3>
        <p>Hãy tải lên các trang truyện để bắt đầu quá trình kiểm duyệt nhé!</p>
      </div>
    );
  }

  return (
    <div className="page-gallery-grid">
      {pages.map((page) => (
        <PageItemCard
          key={page._id}
          page={page}
          onApprove={onApprove}
          onReject={onReject}
          onReupload={onReupload}
        />
      ))}
    </div>
  );
}
