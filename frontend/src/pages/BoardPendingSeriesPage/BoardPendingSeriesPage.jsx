import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getPendingSeries from "../../services/board/getPendingSeriesService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";
import "./BoardPendingSeriesPage.css"; // Import file CSS mới

const PENDING_PROPOSAL_STATUSES = ["Submitted", "Under Review"];

export default function BoardPendingSeriesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    setIsLoading(true);
    const result = await getPendingSeries();
    if (result.success === false) {
      toast.error(result.message);
      setItems([]);
    } else {
      const pendingOnly = (result.pending || []).filter(({ proposal }) =>
        PENDING_PROPOSAL_STATUSES.includes(proposal?.status),
      );
      setItems(pendingOnly);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return (
    <div className="board-pending-wrapper">
      <header className="page-header">
        <h1 className="page-title">Duyệt Series Mới</h1>
        <p className="page-desc">
          Các series chưa được duyệt — chờ Hội đồng biên tập xem và bỏ phiếu
        </p>
      </header>

      {isLoading && <Loading text="Đang tải danh sách chờ duyệt..." />}

      {!isLoading && items.length === 0 && (
        <div className="empty-box">
          Không có series nào đang chờ duyệt. Series đã duyệt xem ở mục &quot;Danh sách Series&quot;.
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="board-pending-grid">
          {items.map(({ series, proposal }) => (
            <Link
              key={series?._id || proposal?._id}
              to={`/board/series/${series._id}`}
              className="neo-card"
            >
              <h2 className="card-title">{series?.title}</h2>
              <div className="card-info-group">
                <p className="card-author">
                  Tác giả:{" "}
                  {series?.author_id?.name || series?.author_id?.email || "—"}
                </p>
                <p className="card-meta">
                  Trạng thái: <strong>{proposal?.status}</strong>
                  {proposal?.submitted_at &&
                    ` · Nộp: ${new Date(proposal.submitted_at).toLocaleDateString("vi-VN")}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
