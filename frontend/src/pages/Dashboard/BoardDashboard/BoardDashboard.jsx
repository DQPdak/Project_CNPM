import React from "react";
import BoardAtRiskWidget from "../../../components/dashboard/Board/BoardAtRiskWidget/BoardAtRiskWidget";
import BoardLeaderboardWidget from "../../../components/dashboard/Board/BoardLeaderboardWidget/BoardLeaderboardWidget";
import BoardPendingWidget from "../../../components/dashboard/Board/BoardPendingWidget/BoardPendingWidget";
import SeriesProgressTable from "../../../components/dashboard/SeriesProgressTable/SeriesProgressTable";
import "./BoardDashboard.css";

const BoardDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Bảng Quyết Định Biên Tập</h1>

      <div className="dashboard-grid">
        <div className="col-span-2">
          <BoardPendingWidget />
        </div>

        <div>
          <BoardAtRiskWidget />
        </div>

        <div className="col-span-full">
          <SeriesProgressTable />
        </div>

        <div className="col-span-full">
          <BoardLeaderboardWidget />
        </div>
      </div>
    </div>
  );
};

export default BoardDashboard;
