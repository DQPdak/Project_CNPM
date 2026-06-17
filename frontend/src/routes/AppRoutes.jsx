import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "../contexts/ToastContext";
import ProtectedLayout from "../components/auth/ProtectedLayout";
import RequireAuth from "../components/security/RequireAuth";
import ChapterListPage from "../pages/ChapterListPage/ChapterListPage";
import AdminUsersPage from "../pages/AdminUsersPage/AdminUsersPage";
import LoginPage from "../pages/LoginPage/LoginPage";
import PageManagementPage from "../pages/PageManagementPage/PageManagementPage";
import PublishApprovalPage from "../pages/PublishApprovalPage/PublishApprovalPage";
import RankingDashboardPage from "../pages/RankingDashboardPage/RankingDashboardPage";
import DashboardIndex from "../pages/Dashboard/DashboardIndex";
export default function AppRoutes() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <ProtectedLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardIndex />} />
          <Route path="/chapter-list" element={<ChapterListPage />} />
          <Route path="/chapter-list/:seriesId" element={<ChapterListPage />} />
          <Route
            path="/page-management/:chapterId"
            element={<PageManagementPage />}
          />
          <Route
            path="/publish-approval/:chapterId"
            element={<PublishApprovalPage />}
          />
          <Route path="/board/releases" element={<RankingDashboardPage />} />
          <Route path="/board/ranking" element={<RankingDashboardPage />} />
          <Route path="/mangaka/ranking" element={<RankingDashboardPage />} />
          <Route path="/editor/ranking" element={<RankingDashboardPage />} />
          <Route path="/admin/ranking" element={<RankingDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
