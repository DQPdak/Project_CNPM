import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import getChaptersBySeries from "../../services/chapter/getChaptersBySeriesService";
import getMySeries from "../../services/series/getMySeriesService";
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
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const resolveSeriesId = useCallback(async () => {
    if (seriesId) {
      setResolvedSeriesId(seriesId);
      return seriesId;
    }
    const result = await getMySeries(user?.id);
    if (result.success === false) {
      toast.error("Khong the tai danh sach series: " + result.message);
      setResolvedSeriesId(null);
      return null;
    }
    const firstSeries = result.series?.[0]?.series;
    if (!firstSeries?._id) {
      setResolvedSeriesId(null);
      return null;
    }
    setResolvedSeriesId(firstSeries._id);
    navigate(`/chapter-list/${firstSeries._id}`, { replace: true });
    return firstSeries._id;
  }, [navigate, seriesId, user?.id]);

  const fetchChaptersList = useCallback(async () => {
    setIsLoading(true);
    const nextSeriesId = await resolveSeriesId();
    if (!nextSeriesId) {
      setChapters([]);
      setIsLoading(false);
      return;
    }
    const result = await getChaptersBySeries(nextSeriesId);
    if (result.success === false) {
      toast.error("Khong the tai danh sach chapter: " + result.message);
      setChapters([]);
    } else {
      setChapters(result.chapters || []);
    }
    setIsLoading(false);
  }, [resolveSeriesId]);

  useEffect(() => {
    fetchChaptersList();
  }, [fetchChaptersList]);

  return (
    <div className="clp-wrapper">
      {isLoading && <Loading text="Dang tai danh sach chapter..." />}

      <header className="clp-header">
        <div>
          <h1 className="clp-title">Quan ly chapter</h1>
          <p className="clp-subtitle">
            Series ID:{" "}
            <span className="clp-highlight">
              {resolvedSeriesId || "Chua co series"}
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
          Tai khoan nay chua co series nao de quan ly.
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
