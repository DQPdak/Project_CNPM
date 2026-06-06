import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

// Import API Services
import approvePage from "../../services/page/approvePageService";
import updatePageVersion from "../../services/page/updatePageVersionService";
import updateChapterStatus from "../../services/chapter/updateChapterStatusService"; // <-- IMPORT API NÀY VÀO ĐÂY

// Import UI Components
import RequirePermission from "../../components/security/RequirePermission";
import UploadPagesDropzone from "../../components/page/UploadPagesDropzone/UploadPagesDropzone";
import PageGallery from "../../components/page/PageGallery/PageGallery";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";

export default function PageManagementPage() {
  const { chapterId } = useParams();
  const toast = useToast();

  // State quản lý danh sách trang
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // STATE MỚI: QUẢN LÝ THÔNG TIN CHAPTER
  // ==========================================
  const [chapterInfo, setChapterInfo] = useState({
    title: "Đang tải...",
    status: "Loading",
  });
  const [selectedChapterStatus, setSelectedChapterStatus] = useState("");
  const [isUpdatingChapter, setIsUpdatingChapter] = useState(false);

  // Hàm load dữ liệu ban đầu
  const fetchPagesAndChapterInfo = async () => {
    setIsLoading(true);

    // 1. Tạm mock data cho Danh sách Trang
    setPages([
      { _id: "p1", page_number: 1, status: "Draft", image_url: "" },
      { _id: "p2", page_number: 2, status: "In Progress", image_url: "" },
      { _id: "p3", page_number: 3, status: "Ready For Review", image_url: "" },
      { _id: "p4", page_number: 4, status: "Approved", image_url: "" },
    ]);

    // 2. Tạm mock data cho Thông tin Chapter (Sau này bạn gọi API getChapterById ở đây)
    setChapterInfo({ title: "Chương 1: Sự khởi đầu", status: "In Progress" });
    setSelectedChapterStatus("In Progress");

    setIsLoading(false);
  };

  useEffect(() => {
    fetchPagesAndChapterInfo();
  }, [chapterId]);

  // ==========================================
  // LOGIC MỚI: CẬP NHẬT TRẠNG THÁI CHAPTER
  // ==========================================
  const handleUpdateChapterStatus = async () => {
    setIsUpdatingChapter(true);

    // Gọi API thật của bạn (Đang comment để dùng Mock test UI trước)
    // const result = await updateChapterStatus(chapterId, selectedChapterStatus);

    // Mock API Delay 0.5s
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Giả lập thành công
    setChapterInfo((prev) => ({ ...prev, status: selectedChapterStatus }));
    toast.success(
      `Đã cập nhật trạng thái Chapter thành: ${selectedChapterStatus}`,
    );

    setIsUpdatingChapter(false);
  };

  // --- Các hàm cũ của Page ---
  const handleUploadSuccess = () => fetchPagesAndChapterInfo();

  const handleStatusChange = async (pageId, newStatus) => {
    setIsLoading(true);
    const result = await approvePage(pageId, newStatus);
    setIsLoading(false);
    if (result.success === false) toast.error(`Lỗi: ` + result.message);
    else {
      toast.success(`Đã cập nhật: ${newStatus}`);
      fetchPagesAndChapterInfo();
    }
  };

  const handleUpdateVersion = async (pageId, file) => {
    setIsLoading(true);
    const result = await updatePageVersion(pageId, file);
    setIsLoading(false);
    if (result.success === false) toast.error("Lỗi: " + result.message);
    else {
      toast.success("Đã tải lên phiên bản mới!");
      fetchPagesAndChapterInfo();
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {isLoading && <Loading text="Đang xử lý..." />}

      {/* ==========================================
          HEADER MỚI: HIỂN THỊ TIÊU ĐỀ & ĐỔI TRẠNG THÁI
      ========================================== */}
      <header style={{ marginBottom: "30px" }}>
        <Link
          to={`/series/1/chapters`}
          style={{
            textDecoration: "none",
            color: "#64748b",
            display: "inline-block",
            marginBottom: "12px",
          }}
        >
          ← Quay lại danh sách Chapter
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "16px",
          }}
        >
          {/* Bên trái: Tiêu đề và Trạng thái */}
          <div>
            <h1 style={{ margin: 0, fontSize: "28px", color: "#0f172a" }}>
              {chapterInfo.title}
            </h1>
            <p
              style={{
                margin: "8px 0 0 0",
                color: "#64748b",
                fontSize: "15px",
              }}
            >
              Trạng thái Chapter:{" "}
              <strong style={{ color: "#3b82f6" }}>{chapterInfo.status}</strong>
            </p>
          </div>

          {/* Bên phải: Nút đổi trạng thái (Chỉ dành cho Editor) */}
          <RequirePermission required="CAN_APPROVE_PAGE">
            <div
              style={{
                background: "#f8fafc",
                padding: "12px",
                borderRadius: "8px",
                border: "1px dashed #cbd5e1",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#475569",
                  marginBottom: "8px",
                }}
              >
                ĐIỀU CHỈNH CHAPTER
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    outline: "none",
                  }}
                  value={selectedChapterStatus}
                  onChange={(e) => setSelectedChapterStatus(e.target.value)}
                  disabled={
                    isUpdatingChapter || chapterInfo.status === "Published"
                  }
                >
                  <option value="Draft">Draft (Bản nháp)</option>
                  <option value="In Progress">In Progress (Đang làm)</option>
                  <option value="Ready For Review">
                    Ready For Review (Chờ duyệt)
                  </option>
                  <option value="Approved">Approved (Đã duyệt đạt)</option>
                </select>
                <button
                  style={{
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    cursor: isUpdatingChapter ? "not-allowed" : "pointer",
                  }}
                  onClick={handleUpdateChapterStatus}
                  disabled={
                    isUpdatingChapter || chapterInfo.status === "Published"
                  }
                >
                  {isUpdatingChapter ? "Đang lưu..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </RequirePermission>
        </div>
      </header>

      {/* Khu vực Upload (Mangaka) */}
      <RequirePermission required="CAN_UPLOAD_PAGE">
        <UploadPagesDropzone
          chapterId={chapterId}
          onUploadSuccess={handleUploadSuccess}
        />
      </RequirePermission>

      {/* Lưới ảnh */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
        }}
      >
        <PageGallery
          pages={pages}
          onChangeStatus={handleStatusChange}
          onUpdateVersion={handleUpdateVersion}
        />
      </div>
    </div>
  );
}
