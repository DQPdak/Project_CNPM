import React, { useCallback, useEffect, useState } from "react";
import getAtRiskSeries from "../../services/series/getAtRiskSeriesService";
import updateSeriesStatus from "../../services/series/updateSeriesStatusService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";

const STATUS_OPTIONS = [
  "Active",
  "At Risk",
  "Hiatus",
  "Cancelled",
  "Completed",
  "Changed Schedule",
];

const RISK_OPTIONS = ["Safe", "Warning", "Critical"];

const SCHEDULE_OPTIONS = ["weekly", "monthly", "one-shot", "online only", "none"];

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "16px",
};

const selectStyle = {
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  marginRight: "8px",
  marginBottom: "8px",
};

const btnStyle = {
  padding: "8px 16px",
  background: "#0ea5e9",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontWeight: 600,
  cursor: "pointer",
};

export default function BoardAtRiskSeriesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [forms, setForms] = useState({});

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    const result = await getAtRiskSeries();
    if (result.success === false) {
      toast.error(result.message);
      setItems([]);
    } else {
      const series = result.series || [];
      setItems(series);
      setForms(
        Object.fromEntries(
          series.map((item) => [
            item._id,
            {
              status: item.status || "At Risk",
              risk_status: item.risk_status || "Warning",
              approved_schedule: item.approved_schedule || "none",
            },
          ]),
        ),
      );
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const updateForm = (seriesId, field, value) => {
    setForms((prev) => ({
      ...prev,
      [seriesId]: { ...prev[seriesId], [field]: value },
    }));
  };

  const handleSave = async (seriesId) => {
    setSavingId(seriesId);
    const payload = forms[seriesId];
    const result = await updateSeriesStatus(seriesId, payload);
    if (result.success === false) {
      toast.error(result.message);
    } else {
      toast.success("Da cap nhat trang thai series.");
      await fetchList();
    }
    setSavingId(null);
  };

  return (
    <div>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Series co nguy co</h1>
        <p style={{ margin: "8px 0 0", color: "#64748b" }}>
          Module 13 — quyet dinh tiep tuc, huy hoac doi lich xuat ban
        </p>
      </header>

      {isLoading && <Loading text="Dang tai danh sach series co nguy co..." />}

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
          Khong co series nao dang co nguy co.
        </div>
      )}

      {!isLoading &&
        items.map((series) => (
          <div key={series._id} style={cardStyle}>
            <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem" }}>{series.title}</h2>
            <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: "0.9rem" }}>
              Tac gia: {series.author_id?.name || series.author_id?.email || "—"} ·
              Genre: {series.genre || "—"}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
              <select
                style={selectStyle}
                value={forms[series._id]?.status || "At Risk"}
                onChange={(e) => updateForm(series._id, "status", e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              <select
                style={selectStyle}
                value={forms[series._id]?.risk_status || "Warning"}
                onChange={(e) => updateForm(series._id, "risk_status", e.target.value)}
              >
                {RISK_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    Risk: {opt}
                  </option>
                ))}
              </select>

              <select
                style={selectStyle}
                value={forms[series._id]?.approved_schedule || "none"}
                onChange={(e) =>
                  updateForm(series._id, "approved_schedule", e.target.value)
                }
              >
                {SCHEDULE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    Schedule: {opt}
                  </option>
                ))}
              </select>

              <button
                type="button"
                style={btnStyle}
                disabled={savingId === series._id}
                onClick={() => handleSave(series._id)}
              >
                {savingId === series._id ? "Dang luu..." : "Cap nhat"}
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
