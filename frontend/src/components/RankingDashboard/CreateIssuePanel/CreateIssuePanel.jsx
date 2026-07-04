import { useState, useEffect } from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { getAllSeries } from "../../../services/series/getSeriesByRoleService";
import createReleaseIssue from "../../../services/issue/createReleaseIssueService";

const ISSUE_TYPES = ["Weekly", "Monthly", "One-shot", "Online only"];

export default function CreateIssuePanel() {
  const toast = useToast();
  const [seriesOptions, setSeriesOptions] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    releaseDate: "",
    type: "Weekly",
    seriesList: [],
  });

  useEffect(() => {
    const fetchSeriesData = async () => {
      setIsFetching(true);
      const result = await getAllSeries();
      if (result.success === true) {
        const dataList = result.series || (Array.isArray(result) ? result : []);
        const formatted = dataList.map((s) => ({
          id: s.series._id,
          name: s.series.title || "Chưa có tên",
        }));
        setSeriesOptions(formatted);
        setForm((curr) => ({
          ...curr,
          seriesList: formatted.map((s) => s.id),
        }));
      }
      setIsFetching(false);
    };
    fetchSeriesData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.seriesList.length) {
      toast.error("Cần chọn ít nhất một series.");
      return;
    }
    setIsCreating(true);
    const result = await createReleaseIssue(form);
    if (result.success === false) {
      toast.error("Lỗi: " + result.message);
    } else {
      toast.success("Đã tạo kỳ phát hành mới thành công.");
      setForm({
        id: "",
        name: "",
        releaseDate: "",
        type: "Weekly",
        seriesList: [],
      });
      setIsDropdownOpen(false);
    }
    setIsCreating(false);
  };

  const toggleSeries = (id) => {
    setForm((curr) => ({
      ...curr,
      seriesList: curr.seriesList.includes(id)
        ? curr.seriesList.filter((item) => item !== id)
        : [...curr.seriesList, id],
    }));
  };

  // Hàm render giao diện các Thẻ (Tag) truyện đã chọn
  const renderSelectedPreview = () => {
    if (form.seriesList.length === 0) {
      return (
        <span className="text-gray-500 font-semibold">
          Chưa chọn truyện nào...
        </span>
      );
    }

    const selectedNames = seriesOptions
      .filter((s) => form.seriesList.includes(s.id))
      .map((s) => s.name);

    const DISPLAY_LIMIT = 2; // Số lượng hiển thị tối đa
    const displayed = selectedNames.slice(0, DISPLAY_LIMIT);
    const hiddenCount = selectedNames.length - DISPLAY_LIMIT;

    return (
      <div className="flex flex-wrap gap-2 items-center">
        {displayed.map((name, idx) => (
          <span
            key={idx}
            className="bg-yellow-200 border-2 border-black px-2 py-0.5 rounded text-xs font-bold truncate max-w-[120px]"
            title={name}
          >
            {name}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="bg-blue-200 border-2 border-black px-2 py-0.5 rounded text-xs font-black">
            +{hiddenCount} truyện khác
          </span>
        )}
      </div>
    );
  };

  return (
    <section className="neo-panel">
      <div className="panel-title">
        <CalendarPlus size={24} />
        <h2>Tạo kỳ phát hành mới</h2>
      </div>
      <form className="neo-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="neo-label">Mã kỳ phát hành</label>
          <input
            className="neo-input"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="VD: ISSUE-2026-01"
            required
          />
        </div>
        <div className="form-group">
          <label className="neo-label">Tên kỳ phát hành</label>
          <input
            className="neo-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Weekly Jump 01"
            required
          />
        </div>
        <div className="grid-2-cols">
          <div className="form-group">
            <label className="neo-label">Ngày phát hành</label>
            <input
              className="neo-input"
              type="date"
              value={form.releaseDate}
              onChange={(e) =>
                setForm({ ...form, releaseDate: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="neo-label">Loại</label>
            <select
              className="neo-select"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CUSTOM MULTI-SELECT DROPDOWN */}
        <div className="form-group relative mb-8">
          <label className="neo-label flex justify-between">
            <span>Danh sách Truyện (Manga)</span>
            <span className=" ml-1 text-sm font-black text-600">
              {form.seriesList.length}
            </span>
          </label>

          <div
            className="neo-select flex justify-between items-center cursor-pointer select-none min-h-[44px] h-auto py-2"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="flex-1 overflow-hidden pr-4 flex items-center">
              {renderSelectedPreview()}
            </div>
            <ChevronDown
              size={20}
              className={`transition-transform duration-200 shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>

          {isDropdownOpen && (
            <>
              {/* Overlay vô hình để đóng menu khi click ra ngoài */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute z-20 w-full mt-2 bg-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] max-h-60 overflow-y-auto rounded-lg">
                <div className="p-2 flex flex-col gap-1">
                  {seriesOptions.length === 0 && (
                    <div className="p-3 text-center text-gray-500 font-bold">
                      Không có dữ liệu truyện
                    </div>
                  )}
                  {seriesOptions.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 p-3 hover:bg-yellow-100 cursor-pointer rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 cursor-pointer accent-black shrink-0"
                        checked={form.seriesList.includes(s.id)}
                        onChange={() => toggleSeries(s.id)}
                      />
                      <span className="font-bold text-sm select-none break-words">
                        {s.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          className="btn-primary w-full mt-4"
          type="submit"
          disabled={isCreating || isFetching}
        >
          <CalendarPlus size={20} />{" "}
          {isCreating ? "Đang tạo..." : "Tạo kỳ phát hành"}
        </button>
      </form>
    </section>
  );
}
