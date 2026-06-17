import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

// Cấu hình menu động theo Role
const ROLE_MENUS = {
  Mangaka: [
    { name: "Series của tôi", path: "/mangaka/series", icon: "📚" },
    { name: "Tạo Chapter mới", path: "/mangaka/chapter/create", icon: "📝" },
    { name: "Quản lý Task Trợ lý", path: "/mangaka/tasks", icon: "📋" },
    { name: "Ranking Series", path: "/mangaka/ranking", icon: "🏆" },
  ],
  Assistant: [
    { name: "Công việc của tôi", path: "/assistant/tasks", icon: "🛠️" },
    { name: "Thu nhập hàng tháng", path: "/assistant/income", icon: "💰" },
  ],
  "Tantou Editor": [
    { name: "Series phụ trách", path: "/editor/series", icon: "📁" },
    { name: "Biên tập & Phản hồi", path: "/editor/feedbacks", icon: "🖍️" },
    { name: "Tiến độ Studio", path: "/editor/progress", icon: "📊" },
    { name: "Ranking Series", path: "/editor/ranking", icon: "📈" },
  ],
  "Editorial Board": [
    { name: "Duyệt Series Mới", path: "/board/reviews", icon: "⚖️" },
    { name: "Quản lý Phát hành", path: "/board/releases", icon: "📅" },
    { name: "Bảng xếp hạng (Ranking)", path: "/board/ranking", icon: "📈" },
  ],
  Admin: [
    { name: "Quản lý User", path: "/admin/users", icon: "👥" }, // Giữ lại route admin của bạn
    { name: "Ranking & Vote", path: "/admin/ranking", icon: "📈" },
    { name: "Hệ thống Series", path: "/admin/series", icon: "⚙️" },
    { name: "Cấu hình Hệ thống", path: "/admin/settings", icon: "🔧" },
    { name: "System Logs", path: "/admin/logs", icon: "🗄️" },
  ],
};

// Cấu hình menu chung cho mọi user
const COMMON_MENUS = [
  { name: "Tổng quan (Dashboard)", path: "/", icon: "🏠" },
  { name: "Danh sách Chapters", path: "/chapter-list", icon: "📖" }, // Giữ lại route chapter-list của bạn
  { name: "Thông báo", path: "/notifications", icon: "🔔" },
];

export default function ProtectedLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Lấy role hiện tại, mặc định nếu không có thì để trống
  const userRole = user?.role || "";
  const dynamicMenus = ROLE_MENUS[userRole] || [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* SIDEBAR BÊN TRÁI */}
      <aside
        style={{
          width: "260px",
          background: "#1e293b",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          zIndex: 1000,
        }}
      >
        {/* Logo Hệ thống */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid #334155",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#38bdf8",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            MangaSys
          </div>
          <span
            style={{
              fontSize: "0.7rem",
              backgroundColor: "#38bdf8",
              color: "#0f172a",
              padding: "4px 8px",
              borderRadius: "12px",
              fontWeight: "bold",
            }}
          >
            {userRole || "Unknown"}
          </span>
        </div>

        {/* Thông tin User */}
        <div
          style={{ padding: "16px 20px", borderBottom: "1px solid #334155" }}
        >
          <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>Xin chào,</div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "1rem",
              color: "#ffffff",
              marginTop: "4px",
            }}
          >
            {user?.name || "Authenticated User"}
          </div>
        </div>

        {/* Khu vực danh sách Menu */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "20px 12px" }}>
          {/* Menu Chung */}
          <div style={{ marginBottom: "24px" }}>
            <p
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#94a3b8",
                marginBottom: "8px",
                paddingLeft: "12px",
                fontWeight: 600,
              }}
            >
              Chung
            </p>
            {COMMON_MENUS.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px",
                  color: "#cbd5e1",
                  textDecoration: "none",
                  borderRadius: "8px",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                <span style={{ marginRight: "12px", fontSize: "1.2rem" }}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Menu Động Theo Role */}
          {dynamicMenus.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#94a3b8",
                  marginBottom: "8px",
                  paddingLeft: "12px",
                  fontWeight: 600,
                }}
              >
                Khu vực làm việc
              </p>
              {dynamicMenus.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px",
                    color: "#cbd5e1",
                    textDecoration: "none",
                    borderRadius: "8px",
                    marginBottom: "4px",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ marginRight: "12px", fontSize: "1.2rem" }}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Nút Đăng xuất ở cuối Sidebar */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid #334155" }}>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "12px",
              background: "none",
              border: "none",
              color: "#fca5a5",
              cursor: "pointer",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: 600,
              textAlign: "left",
            }}
          >
            <span style={{ marginRight: "12px", fontSize: "1.2rem" }}>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH (Đẩy sang phải 260px để không bị Sidebar đè) */}
      <main
        style={{
          flex: 1,
          marginLeft: "260px",
          padding: "32px",
          minHeight: "100vh",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
