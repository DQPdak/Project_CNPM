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

  // Hàm helper để render màu sắc và text cho đúng trạng thái
  const renderStatusBadge = (status) => {
    switch (status) {
      case "Draft":
        return (
          <div className="page-status-badge status-draft">📝 Bản nháp</div>
        );
      case "In Progress":
        return (
          <div className="page-status-badge status-progress">
            ⏳ Đang xử lý / Cần sửa
          </div>
        );
      case "Ready For Review":
        return (
          <div className="page-status-badge status-review">
            🔍 Chờ kiểm duyệt
          </div>
        );
      case "Approved":
        return (
          <div className="page-status-badge status-approved">✅ Đã duyệt</div>
        );
      default:
        return <div className="page-status-badge status-draft">{status}</div>;
    }
  };

  return (
    <div className="page-card">
      <div className="page-number-badge">Trang {page.page_number}</div>

      {/* Hiển thị Badge trạng thái */}
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
        {/* ==========================================
            QUYỀN MANGAKA (UPDATE_VERSION) 
            - Được tải file mới nếu đang là Draft hoặc In Progress
            - Được gửi đi Review
        ========================================== */}
        <RequirePermission required="CAN_UPDATE_VERSION">
          {(page.status === "Draft" || page.status === "In Progress") && (
            <>
              <div className="actions">
                <button
                  className="btn-action btn-reupload"
                  onClick={handleUpdateClick}
                >
                  Tải lên bản mới
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
                  Gửi đi Kiểm duyệt
                </button>
              </div>
            </>
          )}
        </RequirePermission>

        {/* ==========================================
            QUYỀN EDITOR (APPROVE_PAGE) 
            - Chỉ hiện nút thao tác khi bài đang ở trạng thái Ready For Review
        ========================================== */}
        <RequirePermission required="CAN_APPROVE_PAGE">
          {page.status === "Ready For Review" ? (
            <div className="editor-actions">
              <button
                className="btn-action btn-approve"
                onClick={() => onChangeStatus(page._id, "Approved")}
              >
                Duyệt đạt
              </button>
              <button
                className="btn-action btn-reject"
                onClick={() => onChangeStatus(page._id, "In Progress")} // Đẩy về cho Mangaka sửa
              >
                Yêu cầu sửa
              </button>
            </div>
          ) : (
            // Chỉ hiển thị text thông báo nếu không ở trạng thái cần duyệt
            <div className="action-note">
              {page.status === "Approved"
                ? "Trang này đã hoàn tất."
                : "Chưa sẵn sàng để duyệt."}
            </div>
          )}
        </RequirePermission>
      </div>
    </div>
  );
}
