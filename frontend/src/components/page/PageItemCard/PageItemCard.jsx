import React, { useRef } from "react";
import RequirePermission from "../../security/RequirePermission";
import "./PageItemCard.css";

export default function PageItemCard({
  page,
  onChangeStatus,
  onUpdateVersion,
}) {
  const fileInputRef = useRef(null);

  const handleUpdateClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpdateVersion(page._id, file);
    }
    e.target.value = null;
  };

  // Đồng bộ Tiếng Việt hoàn toàn
  const renderStatusBadge = (status) => {
    switch (status) {
      case "Draft":
        return <div className="page-status-badge status-draft">Bản nháp</div>;
      case "In Progress":
        return (
          <div className="page-status-badge status-progress">Đang xử lý</div>
        );
      case "Ready For Review":
        return <div className="page-status-badge status-review">Chờ duyệt</div>;
      case "Approved":
        return (
          <div className="page-status-badge status-approved">Đã duyệt</div>
        );
      default:
        return <div className="page-status-badge status-draft">{status}</div>;
    }
  };

  return (
    <div className="page-card">
      <div className="page-number-badge">Trang {page.page_number}</div>

      {renderStatusBadge(page.status)}

      <div className="page-image-container">
        <img
          src={
            page.image_url ||
            `https://placehold.co/400x600/e2e8f0/64748b?text=Page+${page.page_number}`
          }
          alt="Page"
          loading="lazy"
        />
      </div>

      <div className="page-actions">
        <RequirePermission required="CAN_UPDATE_VERSION">
          {(page.status === "Draft" || page.status === "In Progress") && (
            <div className="actions-wrapper">
              <button
                className="btn-action btn-reupload"
                onClick={handleUpdateClick}
              >
                Tải bản mới
              </button>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                className="btn-action btn-submit-review"
                onClick={() => onChangeStatus(page._id, "Ready For Review")}
              >
                Gửi Kiểm duyệt
              </button>
            </div>
          )}
        </RequirePermission>

        <RequirePermission required="CAN_APPROVE_PAGE">
          {page.status === "Ready For Review" ? (
            <div className="editor-actions">
              <button
                className="btn-action btn-approve"
                onClick={() => onChangeStatus(page._id, "Approved")}
              >
                Duyệt
              </button>
              <button
                className="btn-action btn-reject"
                onClick={() => onChangeStatus(page._id, "In Progress")}
              >
                Yêu cầu sửa
              </button>
            </div>
          ) : (
            <div className="action-note">
              {page.status === "Approved"
                ? "Trang này đã duyệt"
                : "Chưa thể duyệt."}
            </div>
          )}
        </RequirePermission>
      </div>
    </div>
  );
}
