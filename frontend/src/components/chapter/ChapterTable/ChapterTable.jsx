import React from "react";
import { Link } from "react-router-dom";
import "./ChapterTable.css";

export default function ChapterTable({ chapters }) {
  // Trạng thái trống (Empty State) cực kỳ quan trọng cho UX
  if (!chapters || chapters.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📁</span>
        <h3>Chưa có Chapter nào</h3>
        <p>Mangaka hãy bấm nút "Tạo Chapter Mới" ở góc trên để bắt đầu nhé!</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="custom-table">
        <thead>
          <tr>
            <th width="15%">Số Chương</th>
            <th width="35%">Tiêu đề Chapter</th>
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
                  {chap.status || "Draft"}
                </span>
              </td>
              <td>
                <div className="action-links">
                  {/* Link đi đến Module 4 */}
                  <Link to={`/chapter/${chap._id}/pages`} className="link-mod4">
                    Quản lý Bản thảo
                  </Link>
                  {/* Link đi đến Module 10 */}
                  <Link
                    to={`/chapter/${chap._id}/publish`}
                    className="link-mod10"
                  >
                    Trạm Xuất bản
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
