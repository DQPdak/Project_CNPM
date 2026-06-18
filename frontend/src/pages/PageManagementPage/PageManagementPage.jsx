import React, { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import approvePage from "../../services/page/approvePageService";
import getPagesByChapter from "../../services/page/getPagesByChapterService";
import getChapterById from "../../services/chapter/getChapterByIdService";
import updatePageVersion from "../../services/page/updatePageVersionService";
import updateChapterStatus from "../../services/chapter/updateChapterStatusService";
import RequirePermission from "../../components/security/RequirePermission";
import UploadPagesDropzone from "../../components/page/UploadPagesDropzone/UploadPagesDropzone";
import PageGallery from "../../components/page/PageGallery/PageGallery";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import "./PageManagementPage.css";

const CHAPTER_STATUS_OPTIONS = [
  "Draft",
  "In Production",
  "Waiting Review",
  "Approved",
];

// Hàm phiên dịch trạng thái sang Tiếng Việt (Chỉ dùng để hiển thị giao diện)
const translateStatus = (status) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "draft") return "Bản nháp";
  if (s === "in production" || s === "in progress") return "Đang xử lý";
  if (s === "waiting review" || s === "ready for review") return "Chờ duyệt";
  if (s === "approved") return "Đã duyệt";
  if (s === "published") return "Đã xuất bản";
  return status;
};

// Hàm lấy class màu dựa trên trạng thái
const getStatusColorClass = (status) => {
  const s = (status || "").toLowerCase().replace(/\s+/g, "-");
  switch (s) {
    case "draft":
      return "status-bg-draft";
    case "in-production":
      return "status-bg-in-production";
    case "waiting-review":
      return "status-bg-waiting-review";
    case "approved":
      return "status-bg-approved";
    case "published":
      return "status-bg-published";
    default:
      return "status-bg-draft";
  }
};

export default function PageManagementPage() {
  const { chapterId } = useParams();
  const toast = useToast();
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chapterInfo, setChapterInfo] = useState({
    _id: chapterId,
    series_id: null,
    title: "Dang tai...",
    status: "Loading",
  });
  const [selectedChapterStatus, setSelectedChapterStatus] = useState("");
  const [isUpdatingChapter, setIsUpdatingChapter] = useState(false);

  const fetchPagesAndChapterInfo = useCallback(async () => {
    setIsLoading(true);
    const [chapterResult, pagesResult] = await Promise.all([
      getChapterById(chapterId),
      getPagesByChapter(chapterId),
    ]);
    if (chapterResult.success === false) {
      toast.error("Khong the tai chapter: " + chapterResult.message);
    } else {
      const chapter = chapterResult.chapter;
      setChapterInfo(chapter);
      setSelectedChapterStatus(chapter?.status || "");
    }
    if (pagesResult.success === false) {
      toast.error("Khong the tai danh sach trang: " + pagesResult.message);
      setPages([]);
    } else {
      setPages(pagesResult.pages || []);
    }
    setIsLoading(false);
  }, [chapterId, toast]);

  useEffect(() => {
    fetchPagesAndChapterInfo();
  }, [fetchPagesAndChapterInfo]);

  const handleUpdateChapterStatus = async () => {
    if (!selectedChapterStatus) {
      return;
    }
    setIsUpdatingChapter(true);
    const result = await updateChapterStatus(chapterId, selectedChapterStatus);
    if (result.success === false) {
      toast.error("Khong the cap nhat chapter: " + result.message);
    } else {
      setChapterInfo((prev) => ({
        ...prev,
        status: result.chapter?.status || selectedChapterStatus,
      }));
      toast.success(
        `Da cap nhat chapter thanh ${translateStatus(selectedChapterStatus)}.`,
      );
    }
    setIsUpdatingChapter(false);
  };

  const handleUploadSuccess = () => fetchPagesAndChapterInfo();

  const handleStatusChange = async (pageId, newStatus) => {
    setIsLoading(true);
    const result = await approvePage(pageId, newStatus);
    if (result.success === false) {
      toast.error("Khong the cap nhat trang: " + result.message);
    } else {
      toast.success(
        `Da cap nhat trang thai trang thanh ${translateStatus(newStatus)}.`,
      );
      await fetchPagesAndChapterInfo();
    }
    setIsLoading(false);
  };

  const handleUpdateVersion = async (pageId, file) => {
    setIsLoading(true);
    const result = await updatePageVersion(pageId, file);
    if (result.success === false) {
      toast.error("Khong the tai len phien ban moi: " + result.message);
    } else {
      toast.success("Da tai len phien ban moi.");
      await fetchPagesAndChapterInfo();
    }
    setIsLoading(false);
  };

  const backSeriesId = chapterInfo.series_id || "";

  return (
    <div className="pmp-wrapper">
      {isLoading && <Loading text="Dang xu ly..." />}

      <header className="pmp-header-area">
        <Link
          to={backSeriesId ? `/chapter-list/${backSeriesId}` : "/chapter-list"}
          className="pmp-back-btn"
        >
          ← Quay lai danh sach
        </Link>

        <div className="pmp-header-main">
          <div>
            <h1 className="pmp-title">{chapterInfo.title}</h1>
            <p className="pmp-subtitle">
              Trạng thái:
              <span
                className={`pmp-status-badge ${getStatusColorClass(chapterInfo.status)}`}
              >
                {translateStatus(chapterInfo.status)}
              </span>
            </p>
          </div>

          <RequirePermission required="CAN_APPROVE_PAGE">
            <div className="pmp-control-box">
              <span className="pmp-control-label">ĐIỀU CHỈNH CHAPTER</span>
              <div className="flex gap-2">
                <select
                  className={`pmp-select ${getStatusColorClass(selectedChapterStatus)}`}
                  value={selectedChapterStatus}
                  onChange={(e) => setSelectedChapterStatus(e.target.value)}
                  disabled={
                    isUpdatingChapter || chapterInfo.status === "Published"
                  }
                >
                  {CHAPTER_STATUS_OPTIONS.map((status) => (
                    /* Value tiếng Anh gửi BE, hiển thị tiếng Việt cho UI */
                    <option key={status} value={status}>
                      {translateStatus(status)}
                    </option>
                  ))}
                </select>
                <button
                  className="pmp-action-btn"
                  onClick={handleUpdateChapterStatus}
                  disabled={
                    isUpdatingChapter || chapterInfo.status === "Published"
                  }
                >
                  {isUpdatingChapter ? "..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </RequirePermission>
        </div>
      </header>

      <RequirePermission required="CAN_UPLOAD_PAGE">
        <UploadPagesDropzone
          chapterId={chapterId}
          onUploadSuccess={handleUploadSuccess}
        />
      </RequirePermission>

      <div className="pmp-gallery-container">
        <PageGallery
          pages={pages}
          onChangeStatus={handleStatusChange}
          onUpdateVersion={handleUpdateVersion}
        />
      </div>
    </div>
  );
}
