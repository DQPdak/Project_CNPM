import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "../contexts/ToastContext";

import ChapterListPage from "../pages/ChapterListPage/ChapterListPage";
import PageManagementPage from "../pages/PageManagementPage/PageManagementPage";
import PublishApprovalPage from "../pages/PublishApprovalPage/PublishApprovalPage";

export default function AppRoutes() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/chapter-list" />} />
        <Route path="/chapter-list" element={<ChapterListPage />} />
        <Route
          path="/page-management/:chapterId"
            element={<PageManagementPage />}
          />
          <Route
            path="/publish-approval/:chapterId"
            element={<PublishApprovalPage />}
          />
        </Routes>
    </ToastProvider>
  );
}
