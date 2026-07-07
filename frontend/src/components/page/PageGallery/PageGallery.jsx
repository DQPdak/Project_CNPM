import React from "react";
import PageItemCard from "../PageItemCard/PageItemCard";
import "./PageGallery.css";

export default function PageGallery({
  pages,
  onChangeStatus,
  onUpdateVersion,
  onDeletePage,
}) {
  if (!pages || pages.length === 0) {
    return (
      <div className="gallery-empty">
        <span className="empty-icon">🖼️</span>
        <h3>Chưa có bản thảo nào</h3>
        <p>Tải lên trang truyện để bắt đầu quy trình duyệt.</p>
      </div>
    );
  }

  return (
    <div className="page-gallery-grid">
      {pages.map((page) => (
        <PageItemCard
          key={page._id}
          page={page}
          onChangeStatus={onChangeStatus}
          onUpdateVersion={onUpdateVersion}
          onDelete={onDeletePage}
        />
      ))}
    </div>
  );
}
