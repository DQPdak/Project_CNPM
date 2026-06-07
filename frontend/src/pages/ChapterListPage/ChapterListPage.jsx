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
  }, [navigate, seriesId, toast, user?.id]);

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
  }, [resolveSeriesId, toast]);

  useEffect(() => {
    fetchChaptersList();
  }, [fetchChaptersList]);

  return (
    <div style={{ padding: "0 20px" }}>
      {isLoading && <Loading text="Dang tai danh sach chapter..." />}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px" }}>Quan ly chapter</h1>
          <p style={{ margin: 0, color: "#64748b" }}>
            Series ID: {resolvedSeriesId || "Chua co series"}
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
        <div
          style={{
            padding: "24px",
            borderRadius: "10px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            color: "#475569",
          }}
        >
          Tai khoan nay chua co series nao de quan ly.
        </div>
      ) : null}

      {!isLoading && resolvedSeriesId ? <ChapterTable chapters={chapters} /> : null}
    </div>
  );
}
