import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import getChaptersBySeries from "../../services/chapter/getChaptersBySeriesService";
import getMySeries from "../../services/series/getMySeriesService";
import getSeriesById from "../../services/series/getSeriesByIdService";
import RequirePermission from "../../components/security/RequirePermission";
import CreateChapterAction from "../../components/chapter/CreateChapterAction/CreateChapterAction";
import ChapterTable from "../../components/chapter/ChapterTable/ChapterTable";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import { useAuthStore } from "../../stores/authStore";
import "./ChapterListPage.css";

export default function ChapterListPage() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);

  const [resolvedSeriesId, setResolvedSeriesId] = useState(seriesId || null);
  const [resolvedSeriesName, setResolvedSeriesName] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm xử lý URL quay lại dựa trên Role của user
  const handleGoBack = () => {
    if (!user) {
      navigate("/");
      return;
    }
    switch (user.role) {
      case "Mangaka":
        navigate("/mangaka/series");
        break;
      case "Tantou Editor":
        navigate("/editor/series");
        break;
      case "Editorial Board":
      case "Admin":
        navigate("/board/all-series");
        break;
      default:
        navigate("/");
    }
  };

  const resolveSeriesInfo = useCallback(async () => {
    if (seriesId) {
      setResolvedSeriesId(seriesId);
      const seriesResult = await getSeriesById(seriesId);
      if (seriesResult.success !== false && seriesResult.series) {
        setResolvedSeriesName(seriesResult.series.title || seriesId);
      } else {
        setResolvedSeriesName(seriesId);
      }
      return seriesId;
    }

    const result = await getMySeries();
    if (result.success === false) {
      toast.error("Không thể tải danh sách series: " + result.message);
      setResolvedSeriesId(null);
      return null;
    }

    const firstSeries = result.series?.[0]?.series;
    if (!firstSeries?._id) {
      setResolvedSeriesId(null);
      return null;
    }

    setResolvedSeriesId(firstSeries._id);
    setResolvedSeriesName(firstSeries.title || firstSeries._id);
    navigate(`/chapter-list/${firstSeries._id}`, { replace: true });
    return firstSeries._id;
  }, [navigate, seriesId, toast]);

  const fetchChaptersList = useCallback(async () => {
    setIsLoading(true);
    const nextSeriesId = await resolveSeriesInfo();

    if (!nextSeriesId) {
      setChapters([]);
      setIsLoading(false);
      return;
    }

    const result = await getChaptersBySeries(nextSeriesId);
    if (result.success === false) {
      toast.error("Không thể tải danh sách chapter: " + result.message);
      setChapters([]);
    } else {
      setChapters(result.chapters || []);
    }

    setIsLoading(false);
  }, [resolveSeriesInfo, toast]);

  useEffect(() => {
    fetchChaptersList();
  }, [fetchChaptersList]);

  return (
    <div className="clp-wrapper">
      {isLoading && <Loading text="Đang tải danh sách chapter..." />}

      {/* SỬ DỤNG HÀM ĐIỀU HƯỚNG MỚI */}
      <div>
        <button onClick={handleGoBack} className="clp-back-btn">
          ← Quay lại danh sách
        </button>
      </div>

      <header className="clp-header">
        <div>
          <h1 className="clp-title">Quản lý chapter</h1>
          <p className="clp-subtitle">
            Series:{" "}
            <span className="clp-highlight">
              {resolvedSeriesName || "Chưa có series"}
            </span>
          </p>
        </div>

        {resolvedSeriesId ? (
          <RequirePermission required="CAN_CREATE_CHAPTER">
            <CreateChapterAction
              seriesId={resolvedSeriesId}
              currentCount={chapters.length}
              onCreatedSuccess={fetchChaptersList}
            />
          </RequirePermission>
        ) : null}
      </header>

      {!isLoading && !resolvedSeriesId ? (
        <div className="clp-empty-box">
          Tài khoản này chưa có series nào để quản lý.
        </div>
      ) : null}

      {!isLoading && resolvedSeriesId ? (
        <div className="clp-table-container">
          <ChapterTable chapters={chapters} />
        </div>
      ) : null}
    </div>
  );
}
