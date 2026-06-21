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
import MangakaSeriesListPage from "../pages/mangaka/MangakaSeriesListPage";
import MangakaSeriesFormPage from "../pages/mangaka/MangakaSeriesFormPage";
import BoardPendingSeriesPage from "../pages/board/BoardPendingSeriesPage";
import BoardSeriesReviewPage from "../pages/board/BoardSeriesReviewPage";
import RequireRole from "../components/security/RequireRole";

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
          <Route path="/admin/releases" element={<RankingDashboardPage />} />
          <Route path="/admin/ranking" element={<RankingDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route
            path="/mangaka/series"
            element={
              <RequireRole allowedRoles={["Mangaka", "Admin"]}>
                <MangakaSeriesListPage />
              </RequireRole>
            }
          />
          <Route
            path="/mangaka/series/new"
            element={
              <RequireRole allowedRoles={["Mangaka", "Admin"]}>
                <MangakaSeriesFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/mangaka/series/:seriesId"
            element={
              <RequireRole allowedRoles={["Mangaka", "Admin"]}>
                <MangakaSeriesFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/board/reviews"
            element={
              <RequireRole allowedRoles={["Editorial Board", "Admin"]}>
                <BoardPendingSeriesPage />
              </RequireRole>
            }
          />
          <Route
            path="/board/series/:seriesId"
            element={
              <RequireRole allowedRoles={["Editorial Board", "Admin"]}>
                <BoardSeriesReviewPage />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
