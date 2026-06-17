import React from "react";
import { Link } from "react-router-dom";
import "./BoardDashboard.css";

const BoardDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Bàn làm việc Hội đồng Biên tập</h1>

      <div className="dashboard-grid">
        <div className="main-column">
          <div className="card">
            <h2 className="card-title">Hồ sơ Series chờ xét duyệt</h2>
            <p className="card-desc">
              Danh sách tác phẩm mới nộp lên cần bỏ phiếu Approve/Reject.
            </p>
            <div className="placeholder-box">
              [Danh sách Series đề xuất & Lịch phát hành]
            </div>
          </div>
        </div>

        <div>
          <div className="widget-board">
            <h2 className="widget-title-amber">Toàn cảnh Bảng xếp hạng</h2>
            <p className="widget-desc-amber">
              Dữ liệu tổng hợp để đưa ra quyết định tiếp tục hoặc hủy series.
            </p>

            <div className="ranking-list">
              <div className="ranking-item-amber">
                <span>🥇 Top 1: Tác phẩm X</span>
                <span className="text-amber-600">9.87 Điểm</span>
              </div>
              <div className="ranking-item-amber">
                <span>🥈 Top 2: Tác phẩm Y</span>
                <span>9.45 Điểm</span>
              </div>
            </div>

            <Link to="/board/ranking" className="btn-amber">
              Quản lý Kỳ & Xem Ranking →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardDashboard;
