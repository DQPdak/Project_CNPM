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

const CHAPTER_STATUS_OPTIONS = [
  "Draft",
  "In Production",
  "Waiting Review",
  "Approved",
];

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
      setChapterInfo((prev) => ({ ...prev, status: result.chapter?.status || selectedChapterStatus }));
      toast.success(`Da cap nhat chapter thanh ${selectedChapterStatus}.`);
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
      toast.success(`Da cap nhat trang thai trang thanh ${newStatus}.`);
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
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {isLoading && <Loading text="Dang xu ly..." />}

      <header style={{ marginBottom: "30px" }}>
        <Link
          to={backSeriesId ? `/chapter-list/${backSeriesId}` : "/chapter-list"}
          style={{
            textDecoration: "none",
            color: "#64748b",
            display: "inline-block",
            marginBottom: "12px",
          }}
        >
          Quay lai danh sach chapter
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "16px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
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
              Trang thai chapter:{" "}
              <strong style={{ color: "#3b82f6" }}>{chapterInfo.status}</strong>
            </p>
          </div>

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
                DIEU CHINH CHAPTER
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
                  disabled={isUpdatingChapter || chapterInfo.status === "Published"}
                >
                  {CHAPTER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
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
                  disabled={isUpdatingChapter || chapterInfo.status === "Published"}
                >
                  {isUpdatingChapter ? "Dang luu..." : "Cap nhat"}
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
