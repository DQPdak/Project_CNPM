import React from "react";
import { Link } from "react-router-dom";
import "./EditorDashboard.css";

const EditorDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Không gian làm việc Biên tập viên</h1>
      <div className="dashboard-grid">
        <div className="main-column">
          <div className="card">
            <h2 className="card-title">Theo dõi tiến độ Studio</h2>
            <p className="card-desc">
              Tổng quan các chapter đang trong quá trình sản xuất & review.
            </p>
            <div className="placeholder-box">
              [Bảng Kanban tiến độ sản xuất]
            </div>
          </div>
        </div>
        <div>
          <div className="widget-editor">
            <h2 className="widget-title-blue">Hiệu suất Series phụ trách</h2>
            <p className="widget-desc-blue">
              Cảnh báo & theo dõi xu hướng tăng giảm của studio.
            </p>
            <div className="ranking-item-blue">
              <span>Series B</span>
              <span className="text-risk">At Risk (Hạng 18)</span>
            </div>
            <Link to="/editor/ranking" className="btn-blue">
              Phân tích bảng xếp hạng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EditorDashboard;
