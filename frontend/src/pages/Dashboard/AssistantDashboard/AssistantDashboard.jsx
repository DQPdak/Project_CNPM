import React from "react";
import "./AssistantDashboard.css";

const AssistantDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">
        Không gian làm việc Trợ lý (Assistant)
      </h1>

      <div className="dashboard-grid-2">
        <div className="task-column">
          <h2 className="card-title">Nhiệm vụ vẽ kỹ thuật được giao</h2>
          <p className="card-desc">
            Tải tài nguyên, hoàn thiện phân vùng nền/hiệu ứng và nộp kết quả sản
            xuất.
          </p>
          <div className="placeholder-box">
            [Danh sách Task: Assigned, In Progress, Submitted]
          </div>
        </div>

        <div className="income-column">
          <h2 className="card-title">Thống kê thu nhập</h2>
          <p className="card-desc text-gray-500 mb-2">
            Theo dõi số lượng task được Mangaka duyệt và doanh thu.
          </p>
          <div className="income-amount">0 VND</div>
          <div className="income-status">
            Trạng thái thanh toán: Pending / Paid
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantDashboard;
