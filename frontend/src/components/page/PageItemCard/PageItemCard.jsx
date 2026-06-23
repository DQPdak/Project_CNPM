import React from "react";
import { useNavigate } from "react-router-dom";
import RequirePermission from "../../security/RequirePermission";
import "./PageItemCard.css";

export default function PageItemCard({ page, onChangeStatus }) {
  const navigate = useNavigate();

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
            page.current_preview_url ||
            `https://placehold.co/400x600/F4F4F0/000000?text=Page+${page.page_number}`
          }
          alt={`Trang ${page.page_number}`}
          loading="lazy"
        />
        {page.current_version && (
          <div className="page-version-badge">V{page.current_version}</div>
        )}
      </div>

      <div className="page-actions">
        {/* LOGIC 1: DÀNH CHO MANGAKA (Khi trang đang vẽ) */}
        {/* Chỉ hiển thị nút "Gửi Kiểm duyệt" nếu có quyền CAN_UPDATE_PAGE_STATUS và trang chưa gửi đi */}
        <RequirePermission required="CAN_UPDATE_PAGE_STATUS">
          {(page.status === "Draft" || page.status === "In Progress") && (
            <div className="actions-wrapper">
              <button
                className="btn-action btn-submit-review"
                onClick={() => onChangeStatus(page._id, "Ready For Review")}
              >
                Gửi Kiểm duyệt
              </button>
            </div>
          )}
        </RequirePermission>

        {/* LOGIC 2: DÀNH CHO EDITOR (Khi Mangaka đã gửi lên) */}
        {/* Chỉ hiển thị cặp nút "Duyệt / Yêu cầu sửa" nếu có quyền CAN_APPROVE_PAGE và trang đang chờ duyệt */}
        {/* Đã TIÊU DIỆT hoàn toàn khối else chứa nút "Chưa thể duyệt" vô dụng */}
        <RequirePermission required="CAN_APPROVE_PAGE">
          {page.status === "Ready For Review" && (
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
          )}
        </RequirePermission>

        {/* CỤM NÚT ĐIỀU HƯỚNG CỐ ĐỊNH CHO TẤT CẢ MỌI NGƯỜI */}
        {/* Ai cũng có quyền vào Workspace (Mangaka để giao task, Assistant để nộp bài, Editor để soi) */}
        {/* Ai cũng có quyền xem lịch sử (Để tra cứu xem ai phá game) */}
        <div className="card-nav-actions">
          <button
            className="btn-nav-workspace"
            onClick={() => navigate(`/workspace/${page._id}`)}
          >
            Workspace
          </button>

          <button
            className="btn-nav-history"
            onClick={() => navigate(`/page-history/${page._id}`)}
          >
            Version History
          </button>
        </div>
      </div>
    </div>
  );
}
