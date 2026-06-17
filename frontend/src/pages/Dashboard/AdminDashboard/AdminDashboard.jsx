import React from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Bảng điều khiển Quản trị viên (Admin)</h1>
      <div className="dashboard-grid">
        <div className="main-column">
          <div className="card">
            <h2 className="card-title">Hệ thống & Người dùng</h2>
            <p className="card-desc">
              Quản lý phân quyền tài khoản, cấu hình hệ thống và xem log.
            </p>
            <div className="flex gap-4 mt-6">
              <Link to="/admin/users" className="btn-gray">
                Quản lý User Accounts
              </Link>
            </div>
          </div>
        </div>
        <div>
          <div className="widget-admin">
            <h2 className="widget-title-emerald">Ban giám khảo</h2>
            <p className="widget-desc-emerald">
              Xem log nhập liệu CSV, đồng bộ bảng xếp hạng.
            </p>
            <Link to="/admin/ranking" className="btn-emerald">
              Xem báo cáo Ranking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
