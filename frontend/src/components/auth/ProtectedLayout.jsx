import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import NotificationBadge from "../../pages/NotificationPage/components/NotificationBadge";
import { getUnreadCountApi } from "../../services/notificationService";

// Cấu hình menu động theo Role (Giữ nguyên logic 100%)
const ROLE_MENUS = {
  Mangaka: [
    { name: "Series của tôi", path: "/mangaka/series" },
    { name: "Tạo Chapter mới", path: "/chapter-list" },
    { name: "Quản lý Task Trợ lý", path: "/mangaka/tasks" },
    { name: "Bảng xếp hạng", path: "/mangaka/ranking" },
  ],
  Assistant: [
    { name: "Công việc của tôi", path: "/assistant/tasks" },
    { name: "Thu nhập hàng tháng", path: "/assistant/income" },
  ],
  "Tantou Editor": [
    { name: "Series phụ trách", path: "/editor/series" },
    { name: "Biên tập & Phản hồi", path: "/editor/feedbacks" },
    { name: "Tiến độ Studio", path: "/editor/progress" },
    { name: "Bảng xếp hạng", path: "/editor/ranking" },
  ],
  "Editorial Board": [
    { name: "Danh sách Series", path: "/board/all-series" },
    { name: "Duyệt Series Mới", path: "/board/reviews" },
    { name: "Series có nguy cơ", path: "/board/at-risk" },
    { name: "Quản lý Phát hành", path: "/board/releases" },
    { name: "Bảng xếp hạng", path: "/board/ranking" },
  ],
  Admin: [
    { name: "Quản lý User", path: "/admin/users" },
    { name: "Quản lý Phát hành", path: "/admin/releases" },
    { name: "Bảng xếp hạng", path: "/admin/ranking" },
    { name: "Quản lý tiến độ", path: "/editor/progress" },
    { name: "Danh sách Series", path: "/board/all-series" },
    { name: "Duyệt Series Mới", path: "/board/reviews" },
    { name: "Series có nguy cơ", path: "/admin/series" },
  ],
};

// Cấu hình menu chung cho mọi user
const COMMON_MENUS = [
  { name: "Trang chủ", path: "/" },
  { name: "Thông báo", path: "/notifications" },
];

export default function ProtectedLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const result = await getUnreadCountApi();
      if (result.success !== false) {
        setUnreadCount(result.count || 0);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const userRole = user?.role || "";
  const dynamicMenus = ROLE_MENUS[userRole] || [];

  return (
    <div className="flex min-h-screen bg-[#F4F4F0] font-sans text-black selection:bg-[#FF90E8] selection:text-black">
      {/* SIDEBAR BÊN TRÁI - NEO BRUTALISM */}
      <aside className="w-[260px] bg-white border-r-4 border-black flex flex-col fixed top-0 left-0 h-screen z-50">
        {/* Logo Hệ thống */}
        <div className="p-5 border-b-4 border-black flex items-center justify-between bg-[#FFD000]">
          <div className="text-xl font-black uppercase tracking-widest text-black">
            MangaSys
          </div>
          <span className="text-[10px] bg-white border-2 border-black text-black px-2 py-0.5 font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {userRole || "Unknown"}
          </span>
        </div>

        {/* Thông tin User */}
        <div className="p-4 border-b-4 border-black bg-[#FF90E8]">
          <div className="text-[10px] font-black text-black uppercase tracking-widest">
            Xin chào,
          </div>
          <div className="font-black text-lg text-black mt-0.5 truncate">
            {user?.name || "Authenticated User"}
          </div>
        </div>

        {/* Khu vực danh sách Menu - Đã ẩn hoàn toàn thanh cuộn (Scrollbar) */}
        <nav className="flex-1 overflow-y-auto p-4 bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Menu Chung */}
          <div className="mb-6">
            <p className="text-[11px] font-black uppercase tracking-widest text-black mb-2 px-1">
              Chung
            </p>
            {COMMON_MENUS.map((item, idx) => {
              const isActive = location.pathname === item.path;
              const isNotif = item.path === "/notifications";
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`flex items-center p-2.5 text-black font-bold border-2 transition-all mb-1.5 ${
                    isActive
                      ? "border-black bg-[#23A094] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px]"
                      : "border-transparent hover:border-black hover:bg-[#23A094] hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px]"
                  }`}
                >
                  <span className="tracking-wide text-sm">{item.name}</span>
                  {isNotif && <NotificationBadge count={unreadCount} />}
                </Link>
              );
            })}
          </div>

          {/* Menu Động Theo Role */}
          {dynamicMenus.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-black mb-2 px-1">
                Khu vực làm việc
              </p>
              {dynamicMenus.map((item, idx) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={idx}
                    to={item.path}
                    className={`flex items-center p-2.5 text-black font-bold border-2 transition-all mb-1.5 ${
                      isActive
                        ? "border-black bg-[#23A094] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px]"
                        : "border-transparent hover:border-black hover:bg-[#23A094] hover:text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px]"
                    }`}
                  >
                    <span className="tracking-wide text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Nút Đăng xuất nhỏ gọn ở cuối Sidebar */}
        <div className="p-3 border-t-4 border-black bg-[#F4F4F0]">
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center justify-center w-full py-2 px-3 bg-[#FF5C00] border-2 border-black text-white font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all active:shadow-none"
          >
            Đăng xuất 🚪
          </button>
        </div>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <main className="flex-1 ml-[260px] p-8 lg:p-12 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
