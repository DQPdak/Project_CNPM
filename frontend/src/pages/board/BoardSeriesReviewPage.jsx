import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import getBoardSeriesDetail from "../../services/board/getBoardSeriesDetailService";
import castVote from "../../services/board/castVoteService";
import finalizeSeries from "../../services/board/finalizeSeriesService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";

const SCHEDULE_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "one-shot", label: "One-shot" },
  { value: "online only", label: "Online only" },
];

export default function BoardSeriesReviewPage() {
  const { seriesId } = useParams();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [comment, setComment] = useState("");
  const [approvedSchedule, setApprovedSchedule] = useState("weekly");
  const [isVoting, setIsVoting] = useState(false);

  const loadDetail = useCallback(async () => {
    setIsLoading(true);
    const result = await getBoardSeriesDetail(seriesId);
    if (result.success === false) {
      toast.error(result.message);
      setData(null);
    } else {
      setData(result);
    }
    setIsLoading(false);
  }, [seriesId, toast]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleVote = async (vote) => {
    setIsVoting(true);
    const result = await castVote(seriesId, { vote, comment });
    if (result.success === false) {
      toast.error(result.message);
    } else {
      toast.success(result.message || "Bỏ phiếu thành công!");
      await loadDetail();
    }
    setIsVoting(false);
  };

  const handleFinalize = async () => {
    setIsVoting(true);
    const result = await finalizeSeries(seriesId, {
      approved_schedule: approvedSchedule,
    });
    if (result.success === false) {
      toast.error(result.message);
    } else {
      toast.success(`Kết quả: ${result.decision}`);
      await loadDetail();
    }
    setIsVoting(false);
  };

  if (isLoading) {
    return <Loading text="Đang tải hồ sơ series..." />;
  }

  if (!data?.series) {
    return <p>Không tìm thấy hồ sơ series.</p>;
  }

  const { series, proposal, votes } = data;
  const canVote = ["Submitted", "Under Review"].includes(proposal?.status);

  return (
    <div style={{ maxWidth: "800px" }}>
      <Link
        to="/board/reviews"
        style={{ color: "#0ea5e9", textDecoration: "none", fontSize: "0.9rem" }}
      >
        ← Quay lại danh sách chờ duyệt
      </Link>

      <h1 style={{ margin: "16px 0 8px" }}>{series.title}</h1>
      <p style={{ color: "#64748b" }}>
        Tác giả: {series.author_id?.name || "—"} · Proposal:{" "}
        <strong>{proposal?.status}</strong>
      </p>

      <section
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Hồ sơ đề xuất</h2>
        <p>
          <strong>Tóm tắt:</strong> {proposal?.summary || "—"}
        </p>
        <p>
          <strong>Nhân vật:</strong> {proposal?.characters || "—"}
        </p>
        <p>
          <strong>Phong cách:</strong> {proposal?.art_style || "—"}
        </p>
        {proposal?.cover_image && (
          <img
            src={proposal.cover_image}
            alt="Cover"
            style={{ maxWidth: "240px", borderRadius: "8px", marginTop: "8px" }}
          />
        )}
      </section>

      {votes?.length > 0 && (
        <section
          style={{
            background: "#f8fafc",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Phiếu bầu hiện có ({votes.length})</h3>
          {votes.map((v) => (
            <div key={v._id} style={{ marginBottom: "8px", fontSize: "0.9rem" }}>
              <strong>{v.vote}</strong> — {v.board_member_id?.name || "Board member"}
              {v.comment && `: ${v.comment}`}
            </div>
          ))}
        </section>
      )}

      {canVote && (
        <section
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Bỏ phiếu</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Góp ý (tuỳ chọn)"
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button
              type="button"
              disabled={isVoting}
              onClick={() => handleVote("Approve")}
              style={voteBtnStyle("#16a34a")}
            >
              Approve
            </button>
            <button
              type="button"
              disabled={isVoting}
              onClick={() => handleVote("Reject")}
              style={voteBtnStyle("#dc2626")}
            >
              Reject
            </button>
            <button
              type="button"
              disabled={isVoting}
              onClick={() => handleVote("Need Revision")}
              style={voteBtnStyle("#9333ea")}
            >
              Need Revision
            </button>
          </div>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "8px" }}>
              Lịch xuất bản (khi Approve)
            </label>
            <select
              value={approvedSchedule}
              onChange={(e) => setApprovedSchedule(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                marginBottom: "12px",
              }}
            >
              {SCHEDULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <br />
            <button
              type="button"
              disabled={isVoting || votes.length === 0}
              onClick={handleFinalize}
              style={voteBtnStyle("#0ea5e9")}
            >
              Tổng hợp kết quả (Finalize)
            </button>
            {votes.length === 0 && (
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "8px" }}>
                Cần bỏ phiếu trước khi finalize.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function voteBtnStyle(bg) {
  return {
    padding: "10px 18px",
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
  };
}
