import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getPendingSeries from "../../services/board/getPendingSeriesService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";

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
      setItems(result.pending || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return (
    <div>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Series chờ duyệt</h1>
        <p style={{ margin: "8px 0 0", color: "#64748b" }}>
          Hội đồng biên tập xem và bỏ phiếu quyết định series mới
        </p>
      </header>

      {isLoading && <Loading text="Đang tải danh sách chờ duyệt..." />}

      {!isLoading && items.length === 0 && (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            background: "#fff",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
          }}
        >
          Không có series nào đang chờ duyệt.
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div style={{ display: "grid", gap: "16px" }}>
          {items.map(({ series, proposal }) => (
            <Link
              key={series?._id || proposal?._id}
              to={`/board/series/${series._id}`}
              style={{
                display: "block",
                padding: "20px",
                background: "#fff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem" }}>
                {series?.title}
              </h2>
              <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: "0.9rem" }}>
                Tác giả: {series?.author_id?.name || series?.author_id?.email || "—"}
              </p>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>
                Trạng thái: <strong>{proposal?.status}</strong>
                {proposal?.submitted_at &&
                  ` · Nộp: ${new Date(proposal.submitted_at).toLocaleDateString("vi-VN")}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
