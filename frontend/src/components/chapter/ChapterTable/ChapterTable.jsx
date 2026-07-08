import React from "react";
import { Link } from "react-router-dom";
import RequirePermission from "../../security/RequirePermission";
import "./ChapterTable.css";

// Dịch tiếng Anh sang tiếng Việt hiển thị
const translateStatus = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "draft") return "Bản nháp";
  if (s === "in production" || s === "in progress") return "Đang xử lý";
  if (s === "waiting review" || s === "ready for review") return "Chờ duyệt";
  if (s === "approved") return "Đã duyệt";
  if (s === "published") return "Đã xuất bản";
  return status;
};

export default function ChapterTable({ chapters }) {
  if (!chapters || chapters.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📂</span>
        <h3>Chưa có chapter nào</h3>
        <p>Hãy tạo chapter đầu tiên để bắt đầu quy trình sản xuất.</p>
      </div>
    );
  }
  return (
    <div className="table-wrapper">
      <table className="custom-table">
        <thead>
          <tr>
            <th width="15%">Số chương</th>
            <th width="35%">Tiêu đề chapter</th>
            <th width="15%">Trạng thái</th>
            <th width="35%">Khu vực làm việc</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map((chap) => (
            <tr key={chap._id} className="table-row">
              <td>
                <span className="chapter-number-badge">
                  Chương {chap.chapter_number}
                </span>
              </td>
              <td className="chapter-title">{chap.title}</td>
              <td>
                <span
                  className={`status-badge status-${chap.status?.toLowerCase().replace(/\s+/g, "-") || "draft"}`}
                >
                  {translateStatus(chap.status || "Draft")}
                </span>
              </td>
              <td>
                <div className="action-links">
                  <Link
                    to={`/page-management/${chap._id}`}
                    className="link-mod4"
                  >
                    Quản lý bản thảo
                  </Link>
                  <RequirePermission required="CAN_PUBLISH_CHAPTER">
                    <Link
                      to={`/publish-approval/${chap._id}`}
                      className="link-mod10"
                    >
                      Trạm xuất bản
                    </Link>
                  </RequirePermission>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
