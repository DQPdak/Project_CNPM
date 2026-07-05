import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getMySeries from "../../services/series/getMySeriesService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";
import "./MangakaSeriesListPage.css";

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

  // Hàm lấy màu sắc chuẩn cho badge trạng thái
  const getStatusClass = (status) => {
    const s = (status || "Draft").toLowerCase().replace(/\s+/g, "-");
    return `badge-status status-${s}`;
  };

  return (
    <div className="mangaka-list-wrapper">
      <header className="mangaka-list-header">
        <div>
          <h1 className="mangaka-list-title">Series của tôi</h1>
          <p className="mangaka-list-desc">
            Quản lý hồ sơ series và đề xuất xét duyệt
          </p>
        </div>
        <Link to="/mangaka/series/new" className="btn-create-series">
          + Tạo series mới
        </Link>
      </header>

      {isLoading && <Loading text="Đang tải danh sách series..." />}

      {!isLoading && items.length === 0 && (
        <div className="empty-series-box">
          Chưa có series nào. Bấm &quot;Tạo series mới&quot; để bắt đầu.
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="mangaka-series-grid">
          {items.map(({ series, proposal }) => (
            // Chuyển thẻ bọc ngoài cùng từ Link thành div
            <div key={series._id} className="series-card">
              <div className="series-card-header">
                <div>
                  <h2 className="series-card-title">{series.title}</h2>
                  <p className="series-card-meta">
                    {series.genre || "Chưa có thể loại"} · Trạng thái series:{" "}
                    {series.status}
                  </p>
                </div>
                {proposal && (
                  <span className={getStatusClass(proposal.status)}>
                    {proposal.status}
                  </span>
                )}
              </div>

              <div className="series-card-actions">
                <Link
                  to={`/mangaka/series/${series._id}`}
                  className="btn-action-secondary"
                >
                  Thông tin chi tiết
                </Link>
                <Link
                  to={`/chapter-list/${series._id}`}
                  className="btn-action-primary"
                >
                  Quản lý Chapter
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
