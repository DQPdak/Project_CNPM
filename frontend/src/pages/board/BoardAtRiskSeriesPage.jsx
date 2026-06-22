import React, { useCallback, useEffect, useState } from "react";
import getAtRiskSeries from "../../services/series/getAtRiskSeriesService";
import updateSeriesStatus from "../../services/series/updateSeriesStatusService";
import getLifecycleVotes from "../../services/series/getLifecycleVotesService";
import castLifecycleVote from "../../services/series/castLifecycleVoteService";
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

const STATUS_TRANSLATIONS = {
  "Active": "Hoạt động",
  "At Risk": "Có nguy cơ",
  "Hiatus": "Tạm ngưng",
  "Cancelled": "Bị hủy",
  "Completed": "Đã hoàn thành",
  "Changed Schedule": "Đổi lịch phát hành",
};

const RISK_OPTIONS = ["Safe", "Warning", "Critical"];

const RISK_TRANSLATIONS = {
  "Safe": "An toàn",
  "Warning": "Cảnh báo",
  "Critical": "Nguy cấp",
};

const SCHEDULE_OPTIONS = ["weekly", "monthly", "one-shot", "online only", "none"];

const SCHEDULE_TRANSLATIONS = {
  "weekly": "Hằng tuần",
  "monthly": "Hằng tháng",
  "one-shot": "Một tập (One-shot)",
  "online only": "Chỉ phát hành online",
  "none": "Chưa có",
};

const LIFECYCLE_OPTIONS = [
  "Continue",
  "Cancel",
  "Hiatus",
  "Change Schedule",
  "Online Only",
  "Need Improvement Plan",
];

const LIFECYCLE_TRANSLATIONS = {
  "Continue": "Tiếp tục phát hành",
  "Cancel": "Hủy bỏ bộ truyện",
  "Hiatus": "Tạm ngưng phát hành",
  "Change Schedule": "Thay đổi lịch phát hành",
  "Online Only": "Chuyển sang chỉ online",
  "Need Improvement Plan": "Yêu cầu kế hoạch cải thiện",
};

const RISK_COLOR = {
  Safe: "#16a34a",
  Warning: "#d97706",
  Critical: "#dc2626",
};

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

const ghostBtnStyle = {
  padding: "8px 16px",
  background: "#fff",
  color: "#0ea5e9",
  border: "1px solid #0ea5e9",
  borderRadius: "8px",
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: "8px",
};

export default function BoardAtRiskSeriesPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [forms, setForms] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [dossiers, setDossiers] = useState({});
  const [voteForms, setVoteForms] = useState({});
  const [votingId, setVotingId] = useState(null);

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
      toast.success("Đã cập nhật trạng thái series thành công.");
      await fetchList();
    }
    setSavingId(null);
  };

  const loadDossier = useCallback(async (seriesId) => {
    setDossiers((prev) => ({
      ...prev,
      [seriesId]: { ...prev[seriesId], loading: true },
    }));
    const result = await getLifecycleVotes(seriesId);
    setDossiers((prev) => ({
      ...prev,
      [seriesId]: {
        loading: false,
        votes: result.success === false ? [] : result.votes || [],
        tally: result.success === false ? {} : result.tally || {},
      },
    }));
  }, []);

  const toggleDossier = (seriesId) => {
    if (expandedId === seriesId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(seriesId);
    if (!dossiers[seriesId]) {
      loadDossier(seriesId);
    }
  };

  const updateVoteForm = (seriesId, field, value) => {
    setVoteForms((prev) => ({
      ...prev,
      [seriesId]: { ...prev[seriesId], [field]: value },
    }));
  };

  const handleLifecycleVote = async (seriesId) => {
    const form = voteForms[seriesId] || {};
    const vote = form.vote || LIFECYCLE_OPTIONS[0];
    setVotingId(seriesId);
    const result = await castLifecycleVote(seriesId, {
      vote,
      comment: form.comment || "",
    });
    if (result.success === false) {
      toast.error(result.message);
    } else {
      toast.success("Đã bỏ phiếu quyết định vòng đời thành công.");
      await loadDossier(seriesId);
    }
    setVotingId(null);
  };

  return (
    <div>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem" }}>Danh sách series có nguy cơ</h1>
        <p style={{ margin: "8px 0 0", color: "#64748b" }}>
          Module 13 — Quyết định tiếp tục, hủy hoặc đổi lịch xuất bản truyện.
        </p>
      </header>

      {isLoading && <Loading text="Đang tải danh sách series có nguy cơ..." />}

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
          Không có series nào đang có nguy cơ.
        </div>
      )}

      {!isLoading &&
        items.map((series) => {
          const dossier = dossiers[series._id];
          const isOpen = expandedId === series._id;
          return (
            <div key={series._id} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <div>
                  <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem" }}>
                    {series.title}
                  </h2>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                    Tác giả:{" "}
                    {series.author_id?.name || series.author_id?.email || "—"} ·
                    Thể loại: {series.genre || "—"}
                  </p>
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "#fff",
                    background: RISK_COLOR[series.risk_status] || "#64748b",
                    whiteSpace: "nowrap",
                  }}
                >
                  Mức độ nguy cơ: {RISK_TRANSLATIONS[series.risk_status] || series.risk_status || "—"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginTop: "12px",
                }}
              >
                <select
                  style={selectStyle}
                  value={forms[series._id]?.status || "At Risk"}
                  onChange={(e) => updateForm(series._id, "status", e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      Trạng thái: {STATUS_TRANSLATIONS[opt] || opt}
                    </option>
                  ))}
                </select>

                <select
                  style={selectStyle}
                  value={forms[series._id]?.risk_status || "Warning"}
                  onChange={(e) =>
                    updateForm(series._id, "risk_status", e.target.value)
                  }
                >
                  {RISK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      Mức độ: {RISK_TRANSLATIONS[opt] || opt}
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
                      Lịch phát hành: {SCHEDULE_TRANSLATIONS[opt] || opt}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  style={btnStyle}
                  disabled={savingId === series._id}
                  onClick={() => handleSave(series._id)}
                >
                  {savingId === series._id ? "Đang lưu..." : "Cập nhật trạng thái"}
                </button>
              </div>

              <div style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  style={ghostBtnStyle}
                  onClick={() => toggleDossier(series._id)}
                >
                  {isOpen ? "Ẩn hồ sơ quyết định" : "Hồ sơ quyết định & bỏ phiếu"}
                </button>
              </div>

              {isOpen && (
                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    marginTop: "8px",
                    paddingTop: "16px",
                  }}
                >
                  {dossier?.loading && <Loading text="Đang tải hồ sơ..." />}

                  {!dossier?.loading && (
                    <>
                      <h3 style={{ margin: "0 0 8px", fontSize: "1rem" }}>
                        Phiếu quyết định vòng đời ({dossier?.votes?.length || 0})
                      </h3>

                      {(!dossier?.votes || dossier.votes.length === 0) && (
                        <p
                          style={{
                            color: "#64748b",
                            fontSize: "0.9rem",
                            margin: "0 0 12px",
                          }}
                        >
                          Chưa có phiếu quyết định nào.
                        </p>
                      )}

                      {dossier?.votes?.map((v) => (
                        <div
                          key={v._id}
                          style={{
                            marginBottom: "8px",
                            fontSize: "0.9rem",
                            background: "#f8fafc",
                            borderRadius: "8px",
                            padding: "8px 12px",
                          }}
                        >
                          <strong>{LIFECYCLE_TRANSLATIONS[v.vote] || v.vote}</strong> —{" "}
                          {v.board_member_id?.name || "Thành viên ban biên tập"}
                          {v.comment && `: ${v.comment}`}
                        </div>
                      ))}

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          alignItems: "center",
                          marginTop: "12px",
                        }}
                      >
                        <select
                          style={selectStyle}
                          value={
                            voteForms[series._id]?.vote || LIFECYCLE_OPTIONS[0]
                          }
                          onChange={(e) =>
                            updateVoteForm(series._id, "vote", e.target.value)
                          }
                        >
                          {LIFECYCLE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {LIFECYCLE_TRANSLATIONS[opt] || opt}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          placeholder="Nhập nhận xét / lý do..."
                          value={voteForms[series._id]?.comment || ""}
                          onChange={(e) =>
                            updateVoteForm(series._id, "comment", e.target.value)
                          }
                          style={{
                            flex: "1 1 240px",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            marginBottom: "8px",
                          }}
                        />

                        <button
                          type="button"
                          style={btnStyle}
                          disabled={votingId === series._id}
                          onClick={() => handleLifecycleVote(series._id)}
                        >
                          {votingId === series._id ? "Đang gửi..." : "Bỏ phiếu"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
