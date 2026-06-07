import React from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function ProtectedLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#a16207",
              fontWeight: 700,
            }}
          >
            Manga Editorial System
          </div>
          <div style={{ color: "#0f172a", fontWeight: 700 }}>
            {user?.name || "Authenticated User"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: "999px",
              background: "#e2e8f0",
              color: "#334155",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {user?.role || "Unknown role"}
          </span>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              border: "none",
              borderRadius: "8px",
              background: "#111827",
              color: "#ffffff",
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Dang xuat
          </button>
        </div>
      </header>

      <main style={{ padding: "24px" }}>
        <Outlet />
      </main>
    </div>
  );
}
