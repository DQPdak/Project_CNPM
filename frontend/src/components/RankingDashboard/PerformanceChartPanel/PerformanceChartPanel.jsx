import { useState, useEffect, useMemo } from "react";
// Đổi tên icon để không bị trùng với component Line của recharts
import { LineChart as LineChartIcon } from "lucide-react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getAllSeries } from "../../../services/series/getSeriesByRoleService";
import getPerformanceChartData from "../../../services/ranking/getPerformanceChartDataService";

export default function PerformanceChartPanel({ refreshTrigger }) {
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const loadSeriesList = async () => {
      const result = await getAllSeries();
      if (result && result.success !== false) {
        const dataList = result.series || (Array.isArray(result) ? result : []);
        const formatted = dataList.map((s) => ({
          id: s.series._id || s.id,
          name: s.series.title || s.name || "Chưa có tên",
        }));
        setSeriesOptions(formatted);
        if (formatted.length > 0) setSelectedId(formatted[0].id);
      }
    };
    loadSeriesList();
  }, [refreshTrigger]);

  useEffect(() => {
    if (!selectedId) return;
    const loadChart = async () => {
      const result = await getPerformanceChartData(selectedId);
      setChartData(Array.isArray(result) ? result : []);
    };
    loadChart();
  }, [selectedId, refreshTrigger]);

  const activeName = useMemo(() => {
    return seriesOptions.find((s) => s.id === selectedId)?.name || "Manga";
  }, [selectedId, seriesOptions]);

  return (
    <section className="neo-panel mt-8">
      <div className="ranking-toolbar">
        <div className="panel-title border-b-0 mb-0">
          <LineChartIcon size={24} />
          <h2>Biểu đồ hiệu suất (10 kỳ gần nhất)</h2>
        </div>
        <select
          className="neo-select !w-auto max-w-xs"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {seriesOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ width: "100%", height: 400, marginTop: "24px" }}>
        {!chartData.length ? (
          <div className="ranking-empty">
            Chưa có lịch sử hiệu suất cho truyện này.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e0e0e0"
              />

              <XAxis
                dataKey="issueId"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#666", fontSize: 12 }}
                dy={10}
              />

              {/* TRỤC Y BÊN TRÁI: Thể hiện Điểm Trung Bình */}
              <YAxis
                yAxisId="left"
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#4f46e5", fontWeight: 600 }}
                label={{
                  value: "Điểm TB",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#4f46e5",
                  dx: -10,
                }}
              />

              {/* TRỤC Y BÊN PHẢI: Thể hiện Thứ hạng (Reversed để hạng 1 lên đỉnh) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                reversed={true} // Đỉnh cao UX: Đảo ngược trục để Hạng 1 nằm trên cùng!
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#f59e0b", fontWeight: 600 }}
                domain={[1, "dataMax"]}
                allowDecimals={false}
                label={{
                  value: "Hạng",
                  angle: 90,
                  position: "insideRight",
                  fill: "#f59e0b",
                  dx: 10,
                }}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend verticalAlign="top" height={40} />

              {/* KHỐI CỘT: Điểm Trung Bình */}
              <Bar
                yAxisId="left"
                dataKey="avgScore"
                name="Điểm Trung Bình"
                barSize={32}
                fill="#4f46e5"
                radius={[4, 4, 0, 0]} // Bo tròn góc trên của cột
                animationDuration={1500}
              />

              {/* KHỐI ĐƯỜNG: Thứ hạng */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rank"
                name="Thứ hạng"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 8 }}
                animationDuration={1500}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
