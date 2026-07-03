import { useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import importVoteData from "../../../services/issue/importVoteDataService";

export default function ImportVotesPanel({ onImportSuccess }) {
  const toast = useToast();
  const [issueId, setIssueId] = useState("");
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!issueId || !file) return;

    setIsImporting(true);
    const result = await importVoteData({ issueId, file });
    if (result.success === false) {
      toast.error("Không thể import vote: " + result.message);
    } else {
      toast.success("Đã import dữ liệu bình chọn thành công.");
      setIssueId("");
      setFile(null);
      if (onImportSuccess) onImportSuccess(); // Kích hoạt làm mới các bảng thống kê ngoài dashboard
    }
    setIsImporting(false);
  };

  return (
    <section className="neo-panel">
      <div className="panel-title">
        <FileSpreadsheet size={24} />
        <h2>Nhập bình chọn độc giả</h2>
      </div>
      <form className="neo-form" onSubmit={handleImport}>
        <div className="form-group">
          <label className="neo-label">Mã kỳ phát hành cần nhập</label>
          <input
            className="neo-input"
            value={issueId}
            onChange={(e) => setIssueId(e.target.value)}
            placeholder="VD: ISSUE-2026-01"
            required
          />
        </div>
        <div className="form-group">
          <label className="neo-label">Tập tin Excel/CSV</label>
          <input
            className="neo-input !p-2 cursor-pointer fallback-bg"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
          <p className="field-tooltip">
            💡 Cột yêu cầu: seriesId, votes, avgScore, comments, views
          </p>
        </div>
        <button
          className="btn-primary mt-4"
          type="submit"
          disabled={isImporting}
        >
          <Upload size={18} />{" "}
          {isImporting ? "Đang xử lý..." : "Tải lên & Xử lý"}
        </button>
      </form>
    </section>
  );
}
