import React from "react";
import { Link } from "react-router-dom";
import "./ChapterTable.css";

export default function ChapterTable({ chapters }) {
  if (!chapters || chapters.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">No data</span>
        <h3>Chua co chapter nao</h3>
        <p>Hay tao chapter dau tien de bat dau quy trinh san xuat.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="custom-table">
        <thead>
          <tr>
            <th width="15%">So chuong</th>
            <th width="35%">Tieu de chapter</th>
            <th width="15%">Trang thai</th>
            <th width="35%">Khu vuc lam viec</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map((chap) => (
            <tr key={chap._id} className="table-row">
              <td>
                <span className="chapter-number-badge">
                  Chuong {chap.chapter_number}
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
                  <Link to={`/page-management/${chap._id}`} className="link-mod4">
                    Quan ly ban thao
                  </Link>
                  <Link
                    to={`/publish-approval/${chap._id}`}
                    className="link-mod10"
                  >
                    Tram xuat ban
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
