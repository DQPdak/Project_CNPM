import { useState, useEffect, useCallback } from "react";
import { Filter } from "lucide-react";
import getLeaderboard from "../../../services/ranking/getLeaderboardService";
import { getAllSeries } from "../../../services/series/getSeriesByRoleService";
import Loading from "../../../common/Loading/Loading";

const numberFormatter = new Intl.NumberFormat("vi-VN");

export default function LeaderboardPanel({ refreshTrigger }) {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    issueId: "",
    genre: "",
    authorId: "",
  });
  const [loading, setLoading] = useState(true);
  const [dynamicGenres, setDynamicGenres] = useState([]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const result = await getLeaderboard(filters);
    const dataList = Array.isArray(result) ? result : result?.data || [];

    // CHUẨN HÓA DỮ LIỆU TỪ DB TRƯỚC KHI RENDER
    const mappedRows = dataList.map((row) => {
      // Xác định trạng thái cảnh báo dựa trên Model
      const isAtRisk =
        row.cancellationWarning === true ||
        row.risk_status === "Critical" ||
        row.risk_status === "Warning" ||
        row.series?.risk_status === "Critical" ||
        row.series?.risk_status === "Warning";

      return {
        ...row,
        seriesName:
          row.seriesName || row.series?.title || row.title || "Chưa có tên",
        authorName: row.authorName || "Ẩn danh",
        cancellationWarning: isAtRisk,
      };
    });

    setRows(mappedRows);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    const loadDynamicGenres = async () => {
      try {
        const result = await getAllSeries();
        if (result && result.success !== false) {
          const dataList =
            result.series || (Array.isArray(result) ? result : []);

          // Lấy tất cả thể loại từ truyện, bỏ qua giá trị rỗng (null/undefined)
          const extractedGenres = dataList
            .map((s) => s.series?.genre || s.genre)
            .filter((g) => g && g.trim() !== "");

          // Dùng Set để loại bỏ các thể loại trùng lặp (ví dụ: 10 truyện Action thì chỉ lấy 1 chữ Action)
          const uniqueGenres = [...new Set(extractedGenres)];

          setDynamicGenres(uniqueGenres);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách thể loại động:", error);
      }
    };

    loadDynamicGenres();
  }, [refreshTrigger]);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  return (
    <section className="neo-panel">
      <div className="ranking-toolbar">
        <div className="panel-title border-b-0 mb-0">
          <Filter size={24} />
          <h2>Bảng xếp hạng Manga</h2>
        </div>
        <div className="ranking-filters">
          <input
            className="neo-input !py-2 !w-auto"
            value={filters.issueId}
            onChange={(e) =>
              setFilters({ ...filters, issueId: e.target.value })
            }
            placeholder="Mã kỳ..."
          />
          <select
            className="neo-select !py-2 !w-auto"
            value={filters.genre}
            onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
          >
            <option value="">Tất cả thể loại</option>
            {dynamicGenres.map((genre, index) => (
              <option key={`genre-${index}`} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <input
            className="neo-input !py-2 !w-auto"
            value={filters.authorId}
            onChange={(e) =>
              setFilters({ ...filters, authorId: e.target.value })
            }
            placeholder="Author ID..."
          />
          <button
            className="btn-primary !py-2 !px-4"
            type="button"
            onClick={fetchRows}
            disabled={loading}
          >
            Lọc
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="neo-table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Manga</th>
              <th>Kỳ phát hành</th>
              <th>Số phiếu</th>
              <th>Điểm TB</th>
              <th>Tổng điểm</th>
              <th>Xu hướng</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              /* DÙNG COMPONENT LOADING CỦA BẠN KHI ĐANG TẢI */
              <tr>
                <td
                  colSpan="8"
                  className="relative"
                  style={{ height: "200px" }}
                >
                  <Loading text="Đang tải dữ liệu bảng xếp hạng..." />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              /* KHI KHÔNG CÓ DỮ LIỆU */
              <tr>
                <td colSpan="8" className="text-center p-4">
                  Chưa có dữ liệu xếp hạng khớp điều kiện lọc.
                </td>
              </tr>
            ) : (
              /* KHI CÓ DỮ LIỆU THÌ RENDER BẢNG BÌNH THƯỜNG */
              rows.map((row, index) => (
                <tr key={`${row.issueId || index}-${row.seriesId}`}>
                  <td>
                    <span className="rank-number">#{row.currentRank}</span>
                  </td>
                  <td>
                    <strong className="series-name">{row.seriesName}</strong>
                    <span className="series-id">{row.authorName}</span>
                  </td>
                  <td>{row.issueId}</td>
                  <td>{numberFormatter.format(Number(row.votes || 0))}</td>
                  <td>{row.avgScore}</td>
                  <td>{row.totalScore}</td>
                  <td>
                    <span
                      className={`trend-badge trend-${(row.trend || "stable").toLowerCase()}`}
                    >
                      {row.trend || "STABLE"}
                    </span>
                  </td>
                  <td>
                    {row.cancellationWarning ? (
                      <span className="status-warning">Nguy cơ cao</span>
                    ) : (
                      <span className="status-safe">An toàn</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
