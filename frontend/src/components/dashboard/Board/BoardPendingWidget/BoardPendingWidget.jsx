import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import getPendingSeriesService from "../../../../services/board/getPendingSeriesService";
import "./BoardPendingWidget.css";

const BoardPendingWidget = () => {
  const [pendingSeries, setPendingSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await getPendingSeriesService();
        // FIX: Xử lý mảng an toàn để chống crash khi .slice()
        const dataList = Array.isArray(res) ? res : res?.data || [];
        setPendingSeries(dataList.slice(0, 3));
      } catch (error) {
        console.error("Lỗi lấy danh sách chờ duyệt:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="widget-card-pending">
      <div className="widget-header">
        <h2 className="widget-title">Series Chờ Xét Duyệt</h2>
        <span className="badge-info">Cần Xử Lý</span>
      </div>

      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="empty-box">Đang tải dữ liệu...</div>
        ) : pendingSeries.length > 0 ? (
          pendingSeries.map((item) => (
            // FIX: Bắt trường hợp ID từ MongoDB (_id)
            <div key={item._id || item.id} className="list-item-pending group">
              <div className="truncate pr-4">
                <h3 className="font-black text-lg uppercase truncate">
                  {item.title || "Chưa có tên"}
                </h3>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-600 group-hover:text-gray-200">
                  Thể loại: {item.genre || "Chưa cập nhật"}
                </span>
              </div>
              <Link
                // FIX: Sửa lỗi đường dẫn link bị undefined
                to={`/board/series/${item._id || item.id}`}
                className="btn-action-primary group-hover:bg-white group-hover:text-black"
              >
                Review
              </Link>
            </div>
          ))
        ) : (
          <div className="empty-box">Không có series nào đang chờ</div>
        )}
      </div>

      <Link to="/board/reviews" className="btn-block-primary">
        Xem toàn bộ danh sách duyệt
      </Link>
    </div>
  );
};

export default BoardPendingWidget;
