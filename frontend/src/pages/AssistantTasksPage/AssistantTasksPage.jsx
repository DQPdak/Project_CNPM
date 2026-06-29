import React, { useEffect, useState, useCallback } from "react";
import { getTasksApi, getTaskByIdApi, submitTaskApi } from "../../services/task/taskService";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import "./AssistantTasksPage.css";

export default function AssistantTasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states for submission
  const [submitFile, setSubmitFile] = useState(null);
  const [submitNote, setSubmitNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Helper functions for deadline checking
  const isOverdue = (task) => {
    const completedStatuses = ["Approved", "Paid"];
    if (completedStatuses.includes(task.status)) return false;
    if (!task.deadline) return false;
    return new Date() > new Date(task.deadline);
  };

  const isNearDeadline = (task) => {
    const completedStatuses = ["Approved", "Paid"];
    if (completedStatuses.includes(task.status)) return false;
    if (!task.deadline) return false;
    const timeDiff = new Date(task.deadline).getTime() - new Date().getTime();
    return timeDiff > 0 && timeDiff < 48 * 3600 * 1000; // Within 48 hours
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const filter = statusFilter ? { status: statusFilter } : {};
    const result = await getTasksApi(filter);
    if (result.success === false) {
      toast.error(result.message);
    } else {
      // Sort tasks: overdue first, then near deadline, then others
      const sortedTasks = [...(result.tasks || [])].sort((a, b) => {
        const aOver = isOverdue(a) ? 1 : 0;
        const bOver = isOverdue(b) ? 1 : 0;
        if (bOver !== aOver) return bOver - aOver;
        
        const aNear = isNearDeadline(a) ? 1 : 0;
        const bNear = isNearDeadline(b) ? 1 : 0;
        return bNear - aNear;
      });
      setTasks(sortedTasks);
    }
    setLoading(false);
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSelectTask = async (taskId) => {
    setDetailLoading(true);
    const result = await getTaskByIdApi(taskId);
    if (result.success === false) {
      toast.error(result.message);
    } else {
      setSelectedTask(result);
      // Reset submission form
      setSubmitFile(null);
      setSubmitNote("");
    }
    setDetailLoading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSubmitFile(e.target.files[0]);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!selectedTask || !submitFile) {
      toast.error("Vui lòng chọn file thành phẩm để nộp!");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("file", submitFile);
    formData.append("note", submitNote);

    const result = await submitTaskApi(selectedTask.task._id, formData);
    if (result.success === false) {
      toast.error(result.message);
    } else {
      toast.success(result.message || "Nộp bài thành công!");
      // Refresh task detail and list
      await handleSelectTask(selectedTask.task._id);
      fetchTasks();
    }
    setSubmitting(false);
  };

  const translateStatus = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "assigned") return "Mới phân công";
    if (s === "in progress") return "Đang vẽ";
    if (s === "submitted") return "Chờ duyệt";
    if (s === "approved") return "Đã duyệt";
    if (s === "revision requested") return "Cần sửa đổi";
    if (s === "rejected") return "Bị từ chối";
    if (s === "paid") return "Đã thanh toán";
    return status;
  };

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "assigned") return "bg-[#FFD000]";
    if (s === "in progress") return "bg-[#23A094] text-white";
    if (s === "submitted") return "bg-[#FF90E8]";
    if (s === "approved") return "bg-[#23A094] text-white";
    if (s === "revision requested") return "bg-[#FF5C00] text-white";
    if (s === "rejected") return "bg-red-500 text-white";
    if (s === "paid") return "bg-blue-600 text-white";
    return "bg-gray-300";
  };

  return (
    <div className="atp-container">
      {loading && <Loading text="Đang tải danh sách công việc..." />}

      <header className="atp-header">
        <h1 className="atp-title">Công việc của tôi</h1>
        <p className="atp-subtitle">Nhận task vẽ, nộp bản thảo và nhận thu nhập tương tác</p>
      </header>

      {/* FILTER BAR - NEO BRUTALISM */}
      <div className="atp-filter-bar">
        <span className="atp-filter-label">Trạng thái:</span>
        <div className="atp-filter-options">
          {["", "Assigned", "In Progress", "Submitted", "Approved", "Revision Requested", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`atp-filter-btn ${statusFilter === status ? "active" : ""}`}
            >
              {status === "" ? "Tất cả" : translateStatus(status)}
            </button>
          ))}
        </div>
      </div>

      <div className="atp-layout">
        {/* TASK LIST */}
        <section className="atp-list-section">
          {tasks.length === 0 ? (
            <div className="atp-empty-state">
              <h3>Không có công việc nào</h3>
              <p>Hiện tại bạn không có công việc nào ở trạng thái này.</p>
            </div>
          ) : (
            <div className="atp-list">
              {tasks.map((task) => {
                const pageNum = task.page_id?.page_number || "?";
                const seriesTitle = task.page_id?.chapter_id?.series_id?.title || "Không rõ";
                const chapterTitle = task.page_id?.chapter_id?.title || "Không rõ";
                const overdue = isOverdue(task);
                const nearDeadline = isNearDeadline(task);

                return (
                  <div
                    key={task._id}
                    className={`atp-card ${selectedTask?.task?._id === task._id ? "selected" : ""} ${overdue ? "overdue" : nearDeadline ? "near-deadline" : ""}`}
                    onClick={() => handleSelectTask(task._id)}
                  >
                    <div className="atp-card-header">
                      <span className={`atp-badge ${getStatusColor(task.status)}`}>
                        {translateStatus(task.status)}
                      </span>
                      {overdue && <span className="atp-warning-icon">⚠️</span>}
                      <span className="atp-card-price">💵 {task.price.toLocaleString()}đ</span>
                    </div>
                    <h3 className="atp-card-tasktype">{task.task_type}</h3>
                    <p className="atp-card-meta">
                      <strong>Series:</strong> {seriesTitle} <br />
                      <strong>Chương:</strong> {chapterTitle} - Trang {pageNum}
                    </p>
                    <div className="atp-card-footer">
                      <span className={overdue ? "text-red-600 font-bold" : nearDeadline ? "text-orange-600 font-bold" : ""}>
                        {overdue ? "⚠️ QUÁ HẠN: " : nearDeadline ? "⏰ SẮP HẠN: " : "Hạn chót: "}
                        {new Date(task.deadline).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* TASK DETAILS & ACTION */}
        <section className="atp-detail-section">
          {detailLoading && <Loading text="Đang tải chi tiết..." />}
          
          {!selectedTask ? (
            <div className="atp-detail-placeholder">
              <span className="placeholder-icon">👉</span>
              <h3>Chọn một công việc</h3>
              <p>Vui lòng click vào một công việc bên trái để xem tài nguyên và nộp bài vẽ thành phẩm.</p>
            </div>
          ) : (
            <div className="atp-detail-card">
              <div className="atp-detail-header">
                <h2>{selectedTask.task.task_type}</h2>
                <span className={`atp-badge ${getStatusColor(selectedTask.task.status)}`}>
                  {translateStatus(selectedTask.task.status)}
                </span>
              </div>

              <div className="atp-detail-info-grid">
                <div>
                  <strong>Truyện:</strong> {selectedTask.task.page_id?.chapter_id?.series_id?.title || "Không rõ"}
                </div>
                <div>
                  <strong>Chương:</strong> {selectedTask.task.page_id?.chapter_id?.title || "Không rõ"}
                </div>
                <div>
                  <strong>Số trang:</strong> Trang {selectedTask.task.page_id?.page_number || "?"}
                </div>
                <div>
                  <strong>Tiền công:</strong> <span className="text-teal-600 font-bold">{selectedTask.task.price.toLocaleString()}đ</span>
                </div>
                <div>
                  <strong>Người giao:</strong> {selectedTask.task.assigned_by?.name} ({selectedTask.task.assigned_by?.email})
                </div>
                <div>
                  <strong>Hạn chót:</strong> {new Date(selectedTask.task.deadline).toLocaleString("vi-VN")}
                </div>
              </div>

              {selectedTask.task.description && (
                <div className="atp-detail-desc">
                  <h3>Yêu cầu công việc:</h3>
                  <p>{selectedTask.task.description}</p>
                </div>
              )}

              {/* TẢI FILE GỐC VÀ TÀI NGUYÊN */}
              <div className="atp-detail-resources">
                <h3>Tài nguyên bản thảo:</h3>
                <div className="atp-resource-buttons">
                  <a
                    href={selectedTask.task.page_id?.current_source_file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="atp-download-btn"
                  >
                    💾 Tải File Gốc (.PSD)
                  </a>
                  {selectedTask.task.page_id?.attached_resource_url ? (
                    <a
                      href={selectedTask.task.page_id?.attached_resource_url}
                      target="_blank"
                      rel="noreferrer"
                      className="atp-download-btn resource"
                    >
                      📦 Tải Tài Nguyên (.ZIP)
                    </a>
                  ) : (
                    <span className="atp-no-resource">Không có tài nguyên đính kèm</span>
                  )}
                </div>
              </div>

              {/* ACTION: UPLOAD SUBMISSION */}
              {(selectedTask.task.status === "Assigned" ||
                selectedTask.task.status === "In Progress" ||
                selectedTask.task.status === "Revision Requested") && (
                <form onSubmit={handleSubmitWork} className="atp-submit-form">
                  <h3>Nộp sản phẩm hoàn thành</h3>
                  
                  <div className="form-group">
                    <label className="file-upload-label">
                      <span>Tải ảnh preview/file nộp (.PNG, .JPG, .ZIP)</span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        required
                        className="file-upload-input"
                      />
                    </label>
                    {submitFile && (
                      <p className="file-name-indicator">
                        📂 Đã chọn: <strong>{submitFile.name}</strong> ({(submitFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="submitNote">Ghi chú gửi Mangaka:</label>
                    <textarea
                      id="submitNote"
                      rows={3}
                      value={submitNote}
                      onChange={(e) => setSubmitNote(e.target.value)}
                      placeholder="Ghi chú chỉnh sửa, các layer lưu ý..."
                      className="form-textarea"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="atp-submit-btn"
                  >
                    {submitting ? "Đang tải lên và nộp bài..." : "Nộp bài thành phẩm 🚀"}
                  </button>
                </form>
              )}

              {/* LỊCH SỬ SUBMISSION */}
              {selectedTask.submissions && selectedTask.submissions.length > 0 && (
                <div className="atp-history-section">
                  <h3>Lịch sử nộp bài ({selectedTask.submissions.length})</h3>
                  <div className="atp-history-list">
                    {selectedTask.submissions.map((sub, idx) => (
                      <div key={sub._id} className="atp-history-item">
                        <div className="atp-history-header">
                          <span className="atp-history-date">
                            {new Date(sub.submitted_at).toLocaleString("vi-VN")}
                          </span>
                          <span className={`atp-badge-small ${getStatusColor(sub.status)}`}>
                            {translateStatus(sub.status)}
                          </span>
                        </div>
                        <p className="atp-history-note">
                          <strong>Ghi chú:</strong> {sub.note || "Không có ghi chú"}
                        </p>
                        <div className="atp-history-file-container">
                          <a
                            href={sub.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="atp-history-file-link"
                          >
                            🖼️ Xem file nộp (Nhấp để mở)
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
