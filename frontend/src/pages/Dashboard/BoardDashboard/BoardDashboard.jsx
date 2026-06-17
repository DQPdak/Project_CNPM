import React from "react";
import { Link } from "react-router-dom";
import "./BoardDashboard.css";

const BoardDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Bảng làm việc Ban Biên tập</h1>
      <div className="dashboard-grid">
        <div className="main-column">
          <div className="card">
            <h2 className="card-title">Hồ sơ Series chờ xét duyệt</h2>
            <p className="card-desc">
              Danh sách tác phẩm chờ bỏ phiếu Approve/Reject.
            </p>
            <div className="placeholder-box">
              [Danh sách Series xét duyệt & Lịch phát hành]
            </div>
          </div>
        </div>
        <div>
          <div className="widget-board">
            <h2 className="widget-title-amber">Toàn cảnh Bảng xếp hạng</h2>
            <p className="widget-desc-amber">
              Dùng để ra quyết định tiếp tục hoặc hủy series.
            </p>
            <div className="ranking-list">
              <div className="ranking-item-amber">
                <span>Top 1: Tác phẩm X</span>
                <span className="text-score">9.87 điểm</span>
              </div>
              <div className="ranking-item-amber">
                <span>Top 2: Tác phẩm Y</span>
                <span className="text-score">9.45 điểm</span>
              </div>
            </div>
            <Link to="/board/ranking" className="btn-amber">
              Quản lý & Xem Ranking đầy đủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BoardDashboard;
