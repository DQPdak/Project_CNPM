import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import getLeaderboardService from "../../../../services/ranking/getLeaderboardService";
import "./BoardLeaderboardWidget.css";

const BoardLeaderboardWidget = () => {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getLeaderboardService();
        if (res && res.data) {
          setLeaders(res.data.slice(0, 3));
        }
      } catch (error) {
        console.error("Lỗi lấy leaderboard:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="widget-card-leaderboard">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">Top Xếp Hạng Hiện Tại</h2>
        <Link
          to="/board/ranking"
          className="font-black uppercase text-sm border-b-2 border-black hover:text-white"
        >
          Xem Bảng Đầy Đủ &rarr;
        </Link>
      </div>

      <div className="leaderboard-grid">
        {leaders.length > 0 ? (
          leaders.map((item, index) => (
            <div key={item.series_id || index} className="leaderboard-item">
              <div className="rank-badge">#{index + 1}</div>
              <h3 className="font-black uppercase mb-1">
                {item.series_title || `Tác phẩm ${index + 1}`}
              </h3>
              <span className="text-[#23A094] font-black uppercase text-sm">
                {item.score || 0} Điểm
              </span>
            </div>
          ))
        ) : (
          <div className="md:col-span-3 bg-white border-4 border-dashed border-black p-6 font-black uppercase text-center">
            Chưa có dữ liệu xếp hạng
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardLeaderboardWidget;
