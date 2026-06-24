import React from "react";
import "./BoardDashboard.css";
import BoardPendingWidget from "../../../components/dashboard/Board/BoardPendingWidget/BoardPendingWidget";
import BoardAtRiskWidget from "../../../components/dashboard/Board/BoardAtRiskWidget/BoardAtRiskWidget";
import BoardLeaderboardWidget from "../../../components/dashboard/Board/BoardLeaderboardWidget/BoardLeaderboardWidget";

const BoardDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Bảng Quyết Định Biên Tập</h1>

      <div className="dashboard-grid">
        {/* Cột 1 & 2: Danh sách chờ duyệt (chiếm 2/3 không gian) */}
        <div className="col-span-2">
          <BoardPendingWidget />
        </div>

        {/* Cột 3: Cảnh báo At-Risk (chiếm 1/3 không gian) */}
        <div>
          <BoardAtRiskWidget />
        </div>

        {/* Hàng dưới cùng: Bảng xếp hạng trải dài toàn màn hình */}
        <div className="col-span-full">
          <BoardLeaderboardWidget />
        </div>
      </div>
    </div>
  );
};

export default BoardDashboard;
