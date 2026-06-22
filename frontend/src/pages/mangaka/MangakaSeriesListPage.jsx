import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getMySeries from "../../services/series/getMySeriesService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";

const statusColor = {
  Draft: "#64748b",
  Submitted: "#2563eb",
  "Under Review": "#d97706",
  Approved: "#16a34a",
  Rejected: "#dc2626",
  "Need Revision": "#9333ea",
};

export default function MangakaSeriesListPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    const result = await getMySeries();
    if (result.success === false) {
      toast.error(result.message);
      setItems([]);
    } else {
      setItems(result.series || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Series của tôi</h1>
          <p style={{ margin: "8px 0 0", color: "#64748b" }}>
            Quản lý hồ sơ series và đề xuất xét duyệt
          </p>
        </div>
        <Link
          to="/mangaka/series/new"
          style={{
            padding: "10px 18px",
            background: "#0ea5e9",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          + Tạo series mới
        </Link>
      </header>

      {isLoading && <Loading text="Đang tải danh sách series..." />}

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
          Chưa có series nào. Bấm &quot;Tạo series mới&quot; để bắt đầu.
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div style={{ display: "grid", gap: "16px" }}>
          {items.map(({ series, proposal }) => (
            <Link
              key={series._id}
              to={`/mangaka/series/${series._id}`}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem" }}>
                    {series.title}
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                    {series.genre || "Chưa có thể loại"} · Trạng thái series:{" "}
                    {series.status}
                  </p>
                </div>
                {proposal && (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#fff",
                      background: statusColor[proposal.status] || "#64748b",
                    }}
                  >
                    {proposal.status}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
