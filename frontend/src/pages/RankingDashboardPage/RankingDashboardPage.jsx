/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarPlus,
  FileSpreadsheet,
  Filter,
  LineChart,
  RefreshCcw,
  Trophy,
  Upload,
} from "lucide-react";
import RequirePermission from "../../components/security/RequirePermission";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";
import { useAuthStore } from "../../stores/authStore";
import createReleaseIssue from "../../services/issue/createReleaseIssueService";
import importVoteData from "../../services/issue/importVoteDataService";
import getLeaderboard from "../../services/ranking/getLeaderboardService";
import getPerformanceChartData from "../../services/ranking/getPerformanceChartDataService";
import "./RankingDashboardPage.css";

const SERIES_OPTIONS = [
  { id: "S1", name: "One Piece", genre: "Shonen", authorId: "A1" },
  { id: "S2", name: "Naruto", genre: "Shonen", authorId: "A2" },
  { id: "S3", name: "Bleach", genre: "Action", authorId: "A3" },
  { id: "S4", name: "Conan", genre: "Mystery", authorId: "A4" },
];

const ISSUE_TYPES = ["Weekly", "Monthly", "One-shot", "Online only"];
const MANAGE_ROLES = ["Editorial Board", "Admin"];

const initialIssueForm = {
  id: "",
  name: "",
  releaseDate: "",
  type: "Weekly",
  seriesList: SERIES_OPTIONS.map((series) => series.id),
};

const initialImportForm = {
  issueId: "",
  file: null,
};

const initialFilters = {
  issueId: "",
  genre: "",
  authorId: "",
};

const numberFormatter = new Intl.NumberFormat("vi-VN");

export default function RankingDashboardPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const [issueForm, setIssueForm] = useState(initialIssueForm);
  const [importForm, setImportForm] = useState(initialImportForm);
  const [filters, setFilters] = useState(initialFilters);
  const [leaderboard, setLeaderboard] = useState([]);
  const [chartSeriesId, setChartSeriesId] = useState("S1");
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const canManage = MANAGE_ROLES.includes(user?.role);

  const topSeries = leaderboard[0];
  const riskCount = leaderboard.filter((item) => item.cancellationWarning).length;
  const totalVotes = leaderboard.reduce(
    (sum, item) => sum + Number(item.votes || 0),
    0,
  );
  const averageScore = leaderboard.length
    ? leaderboard.reduce((sum, item) => sum + Number(item.totalScore || 0), 0) /
      leaderboard.length
    : 0;

  const selectedSeriesName = useMemo(() => {
    const match = SERIES_OPTIONS.find((series) => series.id === chartSeriesId);
    return match?.name || chartSeriesId;
  }, [chartSeriesId]);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    const result = await getLeaderboard(filters);
    if (result.success === false) {
      toast.error("Khong the tai bang xep hang: " + result.message);
      setLeaderboard([]);
    } else {
      setLeaderboard(Array.isArray(result) ? result : []);
    }
    setIsLoading(false);
  }, [filters, toast]);

  const fetchChartData = useCallback(async () => {
    if (!chartSeriesId) {
      setChartData([]);
      return;
    }

    const result = await getPerformanceChartData(chartSeriesId);
    if (result.success === false) {
      toast.error("Khong the tai bieu do: " + result.message);
      setChartData([]);
    } else {
      setChartData(Array.isArray(result) ? result : []);
    }
  }, [chartSeriesId, toast]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const updateIssueForm = (field, value) => {
    setIssueForm((current) => ({ ...current, [field]: value }));
  };

  const updateFilters = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const toggleSeries = (seriesId) => {
    setIssueForm((current) => {
      const exists = current.seriesList.includes(seriesId);
      const nextSeriesList = exists
        ? current.seriesList.filter((item) => item !== seriesId)
        : [...current.seriesList, seriesId];

      return { ...current, seriesList: nextSeriesList };
    });
  };

  const handleCreateIssue = async (event) => {
    event.preventDefault();
    if (!issueForm.seriesList.length) {
      toast.error("Can chon it nhat mot series cho ky phat hanh.");
      return;
    }

    setIsCreating(true);
    const result = await createReleaseIssue(issueForm);
    if (result.success === false) {
      toast.error("Khong the tao ky phat hanh: " + result.message);
    } else {
      toast.success("Da tao ky phat hanh moi.");
      setImportForm((current) => ({ ...current, issueId: issueForm.id }));
      setFilters((current) => ({ ...current, issueId: issueForm.id }));
      setIssueForm(initialIssueForm);
    }
    setIsCreating(false);
  };

  const handleImportVotes = async (event) => {
    event.preventDefault();
    if (!importForm.issueId || !importForm.file) {
      toast.error("Can nhap ma ky phat hanh va chon file vote.");
      return;
    }

    setIsImporting(true);
    const result = await importVoteData(importForm);
    if (result.success === false) {
      toast.error("Khong the import vote: " + result.message);
    } else {
      toast.success("Da import vote va cap nhat bang xep hang.");
      setLeaderboard(result.data || []);
      setFilters((current) => ({ ...current, issueId: importForm.issueId }));
      await fetchChartData();
    }
    setIsImporting(false);
  };

  return (
    <RequirePermission required="CAN_VIEW_RANKING">
      <div className="ranking-page">
        {isLoading && <Loading text="Dang tai bang xep hang..." />}

        <header className="ranking-page__header">
          <div>
            <p className="ranking-page__eyebrow">Module 11 & 12</p>
            <h1>Ky phat hanh, Vote & Bang xep hang</h1>
            <p>
              Nhap du lieu binh chon doc gia, tinh tong diem, theo doi xu huong
              va canh bao series co nguy co giam hang.
            </p>
          </div>
          <button
            className="ranking-page__refresh"
            type="button"
            onClick={fetchLeaderboard}
          >
            <RefreshCcw size={18} />
            Lam moi
          </button>
        </header>

        <section className="ranking-metrics" aria-label="Thong ke ranking">
          <MetricCard
            icon={<Trophy size={22} />}
            label="Top series"
            value={topSeries?.seriesName || "Chua co du lieu"}
            detail={topSeries ? `Rank #${topSeries.currentRank}` : "Import vote de bat dau"}
          />
          <MetricCard
            icon={<BarChart3 size={22} />}
            label="Tong vote"
            value={numberFormatter.format(totalVotes)}
            detail={`${leaderboard.length} series trong bang`}
          />
          <MetricCard
            icon={<LineChart size={22} />}
            label="Diem TB"
            value={averageScore ? averageScore.toFixed(2) : "0"}
            detail="Tinh theo totalScore"
          />
          <MetricCard
            icon={<AlertTriangle size={22} />}
            label="Canh bao"
            value={riskCount}
            detail="Series co nguy co huy/giam hang"
            tone={riskCount ? "danger" : "normal"}
          />
        </section>

        <div className="ranking-grid">
          {canManage ? (
            <section className="ranking-panel">
              <div className="ranking-panel__title">
                <CalendarPlus size={20} />
                <h2>Tao ky phat hanh</h2>
              </div>
              <form className="ranking-form" onSubmit={handleCreateIssue}>
                <Field label="Ma ky">
                  <input
                    value={issueForm.id}
                    onChange={(event) => updateIssueForm("id", event.target.value)}
                    placeholder="ISSUE-2026-01"
                    required
                  />
                </Field>
                <Field label="Ten ky">
                  <input
                    value={issueForm.name}
                    onChange={(event) =>
                      updateIssueForm("name", event.target.value)
                    }
                    placeholder="Weekly Jump 01"
                    required
                  />
                </Field>
                <div className="ranking-form__row">
                  <Field label="Ngay phat hanh">
                    <input
                      type="date"
                      value={issueForm.releaseDate}
                      onChange={(event) =>
                        updateIssueForm("releaseDate", event.target.value)
                      }
                      required
                    />
                  </Field>
                  <Field label="Loai ky">
                    <select
                      value={issueForm.type}
                      onChange={(event) =>
                        updateIssueForm("type", event.target.value)
                      }
                    >
                      {ISSUE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="ranking-form__series">
                  <span>Series trong ky</span>
                  <div>
                    {SERIES_OPTIONS.map((series) => (
                      <label key={series.id}>
                        <input
                          type="checkbox"
                          checked={issueForm.seriesList.includes(series.id)}
                          onChange={() => toggleSeries(series.id)}
                        />
                        {series.name}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={isCreating}>
                  <CalendarPlus size={18} />
                  {isCreating ? "Dang tao..." : "Tao ky phat hanh"}
                </button>
              </form>
            </section>
          ) : null}

          {canManage ? (
            <section className="ranking-panel">
              <div className="ranking-panel__title">
                <FileSpreadsheet size={20} />
                <h2>Import vote</h2>
              </div>
              <form className="ranking-form" onSubmit={handleImportVotes}>
                <Field label="Ma ky can import">
                  <input
                    value={importForm.issueId}
                    onChange={(event) =>
                      setImportForm((current) => ({
                        ...current,
                        issueId: event.target.value,
                      }))
                    }
                    placeholder="ISSUE-2026-01"
                    required
                  />
                </Field>
                <Field label="File Excel/CSV">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(event) =>
                      setImportForm((current) => ({
                        ...current,
                        file: event.target.files?.[0] || null,
                      }))
                    }
                    required
                  />
                </Field>
                <div className="ranking-sample">
                  <span>CSV mau:</span>
                  <code>seriesId,votes,avgScore,comments,views</code>
                </div>
                <button type="submit" disabled={isImporting}>
                  <Upload size={18} />
                  {isImporting ? "Dang import..." : "Import va tinh hang"}
                </button>
              </form>
            </section>
          ) : null}
        </div>

        <section className="ranking-panel ranking-panel--wide">
          <div className="ranking-toolbar">
            <div className="ranking-panel__title">
              <Filter size={20} />
              <h2>Bang xep hang Top Series</h2>
            </div>
            <div className="ranking-filters">
              <input
                value={filters.issueId}
                onChange={(event) => updateFilters("issueId", event.target.value)}
                placeholder="Loc theo ma ky"
              />
              <select
                value={filters.genre}
                onChange={(event) => updateFilters("genre", event.target.value)}
              >
                <option value="">Tat ca the loai</option>
                <option value="Shonen">Shonen</option>
                <option value="Action">Action</option>
                <option value="Mystery">Mystery</option>
              </select>
              <input
                value={filters.authorId}
                onChange={(event) => updateFilters("authorId", event.target.value)}
                placeholder="Author ID"
              />
              <button type="button" onClick={fetchLeaderboard}>
                Ap dung
              </button>
            </div>
          </div>

          <LeaderboardTable rows={leaderboard} />
        </section>

        <section className="ranking-panel ranking-panel--wide">
          <div className="ranking-toolbar">
            <div className="ranking-panel__title">
              <LineChart size={20} />
              <h2>Bieu do hieu suat</h2>
            </div>
            <select
              value={chartSeriesId}
              onChange={(event) => setChartSeriesId(event.target.value)}
            >
              {SERIES_OPTIONS.map((series) => (
                <option key={series.id} value={series.id}>
                  {series.name}
                </option>
              ))}
            </select>
          </div>
          <PerformanceChart data={chartData} seriesName={selectedSeriesName} />
        </section>
      </div>
    </RequirePermission>
  );
}

function MetricCard({ icon, label, value, detail, tone = "normal" }) {
  return (
    <article className={`ranking-metric ranking-metric--${tone}`}>
      <div className="ranking-metric__icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function Field({ label, children }) {
  return (
    <label className="ranking-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function LeaderboardTable({ rows }) {
  if (!rows.length) {
    return (
      <div className="ranking-empty">
        Chua co du lieu ranking. Hay tao ky phat hanh va import file vote.
      </div>
    );
  }

  return (
    <div className="ranking-table-wrap">
      <table className="ranking-table">
        <thead>
          <tr>
            <th>Hang</th>
            <th>Series</th>
            <th>Ky</th>
            <th>Vote</th>
            <th>Diem TB</th>
            <th>Tong diem</th>
            <th>Xu huong</th>
            <th>Canh bao</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.issueId}-${row.seriesId}`}>
              <td>
                <span className="ranking-rank">#{row.currentRank}</span>
              </td>
              <td>
                <strong>{row.seriesName}</strong>
                <small>{row.seriesId}</small>
              </td>
              <td>{row.issueId}</td>
              <td>{numberFormatter.format(Number(row.votes || 0))}</td>
              <td>{row.avgScore}</td>
              <td>{row.totalScore}</td>
              <td>
                <TrendBadge trend={row.trend} />
              </td>
              <td>
                {row.cancellationWarning ? (
                  <span className="ranking-warning">At risk</span>
                ) : (
                  <span className="ranking-safe">On track</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendBadge({ trend }) {
  const normalizedTrend = trend || "STABLE";
  return (
    <span className={`ranking-trend ranking-trend--${normalizedTrend.toLowerCase()}`}>
      {normalizedTrend}
    </span>
  );
}

function PerformanceChart({ data, seriesName }) {
  if (!data.length) {
    return (
      <div className="ranking-empty">
        Chua co lich su hieu suat cho {seriesName}. Import it nhat mot ky de xem
        bieu do.
      </div>
    );
  }

  const width = 720;
  const height = 260;
  const padding = 34;
  const maxScore = Math.max(...data.map((item) => Number(item.totalScore || 0)), 1);
  const xStep =
    data.length > 1 ? (width - padding * 2) / (data.length - 1) : width / 2;
  const points = data.map((item, index) => {
    const x = data.length > 1 ? padding + index * xStep : width / 2;
    const y =
      height - padding - (Number(item.totalScore || 0) / maxScore) * (height - padding * 2);
    return { ...item, x, y };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div className="ranking-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Bieu do ${seriesName}`}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
        <path d={path} />
        {points.map((point) => (
          <g key={point.issueId}>
            <circle cx={point.x} cy={point.y} r="5" />
            <text x={point.x} y={point.y - 12}>
              {point.totalScore}
            </text>
            <text x={point.x} y={height - 10} className="ranking-chart__label">
              {point.issueId}
            </text>
          </g>
        ))}
      </svg>
      <div className="ranking-chart__legend">
        <span>{seriesName}</span>
        <span>Duong bieu dien theo totalScore tung ky</span>
      </div>
    </div>
  );
}
