import React from "react";
import { Link } from "react-router-dom";
import "./MangakaDashboard.css";

const MangakaDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Màn hình làm việc Mangaka</h1>

      <div className="dashboard-grid">
        <div className="main-column">
          <div className="card">
            <h2 className="card-title">Series của tôi</h2>
            <p className="card-desc">
              Danh sách các tác phẩm bạn đang sáng tác.
            </p>
            <div className="placeholder-box">
              [Danh sách Series / Nút tạo Chapter mới]
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="widget-mangaka">
            <h2 className="widget-title">Thứ hạng tác phẩm</h2>
            <p className="widget-desc">
              Cập nhật dựa trên lượt bình chọn từ kỳ phát hành mới nhất.
            </p>

            <div className="ranking-item">
              <span className="font-medium text-gray-700 text-sm">
                Series A
              </span>
              <span className="text-green-600 font-bold text-sm">
                Hạng 3 (↑2)
              </span>
            </div>

            <Link to="/mangaka/ranking" className="btn-indigo">
              Xem biểu đồ chi tiết →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangakaDashboard;
