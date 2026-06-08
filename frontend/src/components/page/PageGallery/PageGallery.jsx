import React from "react";
import PageItemCard from "../PageItemCard/PageItemCard";
import "./PageGallery.css";

export default function PageGallery({
  pages,
  onChangeStatus,
  onUpdateVersion,
}) {
  if (!pages || pages.length === 0) {
    return (
      <div className="gallery-empty">
        <span className="empty-icon">No pages</span>
        <h3>Chua co ban thao nao</h3>
        <p>Tai len trang truyện de bat dau quy trinh duyet.</p>
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
        />
      ))}
    </div>
  );
}
