import React, { useEffect, useState, useCallback } from "react";
import { Eye, X, ZoomIn, ZoomOut, Download, FileText, FileArchive, FileImage, ExternalLink } from "lucide-react";
import getMySeries from "../../services/series/getMySeriesService";
import getChaptersBySeries from "../../services/chapter/getChaptersBySeriesService";
import getPagesByChapter from "../../services/page/getPagesByChapterService";
import {
  getTasksApi,
  getTaskByIdApi,
  createTaskApi,
  reviewTaskApi,
  getAssistantsApi,
  deleteTaskApi,
} from "../../services/task/taskService";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import "./MangakaTasksPage.css";

// ════════ HELPER: NHẬN DIỆN LOẠI FILE TỪ URL ════════
// Trả về: { kind: "image" | "pdf" | "unknown", extension: "png" | "pdf" | ... }
const detectFileKind = (url) => {
  if (!url) return { kind: "unknown", extension: "" };
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();

  const imageExts = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg", "avif"];
  for (const ext of imageExts) {
    if (cleanUrl.endsWith(`.${ext}`)) return { kind: "image", extension: ext };
  }
  if (cleanUrl.endsWith(".pdf")) return { kind: "pdf", extension: "pdf" };

  return { kind: "unknown", extension: cleanUrl.split(".").pop() || "" };
};

// ════════ HELPER: URL để HIỂN THỊ vs URL để TẢI VỀ ════════
// Cloudinary trả về URL có `?fl_attachment=true` cho file raw (zip/psd/...)
// để trình duyệt download thay vì render. Khi muốn XEM TRỰC TIẾP ảnh,
// ta cần bỏ cờ này đi (nhưng chỉ với ảnh).
const buildDisplayUrl = (url, kind) => {
  if (!url) return url;
  // Ảnh / PDF: strip fl_attachment để trình duyệt render nội dung
  if (kind === "image" || kind === "pdf") {
    try {
      const u = new URL(url);
      u.searchParams.delete("fl_attachment");
      return u.toString();
    } catch {
      // URL không parse được → trả về nguyên
      return url.replace(/[?&]fl_attachment=[^&]*/g, "").replace(/[?&]$/, "");
    }
  }
  // Unknown / raw: giữ nguyên (để tải về)
  return url;
};

const buildDownloadUrl = (url) => {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("fl_attachment")) {
      u.searchParams.set("fl_attachment", "true");
    }
    return u.toString();
  } catch {
    return url;
  }
};

// ════════ COMPONENT CON: KHUNG HIỂN THỊ TRỰC TIẾP THEO LOẠI FILE ════════
function InlineFilePreview({ url, alt, onPreviewClick, kind, displayUrl }) {
  const [imgError, setImgError] = useState(false);
  // displayUrl = url đã strip fl_attachment (để xem trực tiếp)
  // url gốc = để mở/tải
  const viewUrl = displayUrl || url;

  if (!url) {
    return (
      <div className="mtp-preview-empty">
        <span>📭</span>
        <p>Không có file</p>
      </div>
    );
  }

  // ẢNH — render <img>, nếu load lỗi thì fallback
  if (kind === "image" && !imgError) {
    return (
      <img
        src={viewUrl}
        alt={alt}
        className="mtp-preview-image"
        onClick={onPreviewClick}
        onError={() => setImgError(true)}
      />
    );
  }

  // ẢNH — load lỗi (URL không thực sự là ảnh dù tên giống)
  if (kind === "image" && imgError) {
    return (
      <div className="mtp-preview-file-card">
        <FileImage size={36} />
        <div className="mtp-preview-file-name">{alt}</div>
        <div className="mtp-preview-file-meta">Trình duyệt không thể hiển thị trực tiếp</div>
        <div className="mtp-preview-file-actions">
          <a href={url} target="_blank" rel="noreferrer" className="mtp-preview-file-btn primary">
            <ExternalLink size={14} /> Mở tab mới
          </a>
          <a href={buildDownloadUrl(url)} download className="mtp-preview-file-btn">
            <Download size={14} /> Tải về
          </a>
        </div>
      </div>
    );
  }

  // PDF — render <iframe> (Chrome/Edge/Firefox đều preview PDF)
  if (kind === "pdf") {
    return (
      <div className="mtp-preview-pdf-wrapper">
        <iframe
          src={viewUrl}
          title={alt}
          className="mtp-preview-pdf"
        />
      </div>
    );
  }

  // UNKNOWN (PSD/AI/ZIP/RAR/...) — hiển thị card thông tin + nút mở/tải
  return (
    <div className="mtp-preview-file-card">
      <FileArchive size={36} />
      <div className="mtp-preview-file-name">{alt}</div>
      <div className="mtp-preview-file-meta">
        Định dạng file này không xem trực tiếp được trên trình duyệt
      </div>
      <div className="mtp-preview-file-actions">
        <a href={url} target="_blank" rel="noreferrer" className="mtp-preview-file-btn primary">
          <ExternalLink size={14} /> Mở tab mới
        </a>
        <a href={buildDownloadUrl(url)} download className="mtp-preview-file-btn">
          <Download size={14} /> Tải về
        </a>
      </div>
    </div>
  );
}

export default function MangakaTasksPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("list"); // 'list' or 'create'
  const [tasks, setTasks] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Lightbox preview state (xem ảnh bài nộp full size)
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewZoom, setPreviewZoom] = useState(1);

  // Review states
  const [reviewStatus, setReviewStatus] = useState("Approved");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // Assign Form states
  const [seriesList, setSeriesList] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [pages, setPages] = useState([]);

  const [formData, setFormData] = useState({
    series_id: "",
    chapter_id: "",
    page_id: "",
    assigned_to: "",
    task_type: "Vẽ background",
    price: 200000,
    deadline: "",
    description: "",
  });
  const [assigning, setAssigning] = useState(false);

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
    const result = await getTasksApi();
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
  }, []);

  const loadInitialData = useCallback(async () => {
    // Load assistants
    const assistResult = await getAssistantsApi();
    if (assistResult.success !== false) {
      setAssistants(assistResult.assistants || []);
    }

    // Load series of this Mangaka
    const seriesResult = await getMySeries();
    if (seriesResult.success !== false) {
      setSeriesList(seriesResult.series || []);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    loadInitialData();
  }, [fetchTasks, loadInitialData]);

  // Load chapters when series changes
  useEffect(() => {
    if (!formData.series_id) {
      setChapters([]);
      return;
    }
    const fetchChapters = async () => {
      const result = await getChaptersBySeries(formData.series_id);
      if (result.success !== false) {
        setChapters(result.chapters || []);
      }
    };
    fetchChapters();
    setFormData((prev) => ({ ...prev, chapter_id: "", page_id: "" }));
  }, [formData.series_id]);

  // Load pages when chapter changes
  useEffect(() => {
    if (!formData.chapter_id) {
      setPages([]);
      return;
    }
    const fetchPages = async () => {
      const result = await getPagesByChapter(formData.chapter_id);
      if (result.success !== false) {
        setPages(result.pages || []);
      }
    };
    fetchPages();
    setFormData((prev) => ({ ...prev, page_id: "" }));
  }, [formData.chapter_id]);

  const handleSelectTask = async (taskId) => {
    setDetailLoading(true);
    const result = await getTaskByIdApi(taskId);
    if (result.success === false) {
      toast.error(result.message);
    } else {
      setSelectedTask(result);
      setReviewStatus("Approved");
      setReviewNote("");
    }
    setDetailLoading(false);
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!formData.page_id || !formData.assigned_to || !formData.deadline) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    setAssigning(true);
    const result = await createTaskApi({
      page_id: formData.page_id,
      assigned_to: formData.assigned_to,
      task_type: formData.task_type,
      price: Number(formData.price),
      deadline: formData.deadline,
      description: formData.description,
    });

    if (result.success === false) {
      toast.error(result.message);
    } else {
      toast.success("Đã phân công việc cho trợ lý thành công!");
      setFormData({
        series_id: "",
        chapter_id: "",
        page_id: "",
        assigned_to: "",
        task_type: "Vẽ background",
        price: 200000,
        deadline: "",
        description: "",
      });
      setActiveTab("list");
      fetchTasks();
    }
    setAssigning(false);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setReviewing(true);
    const result = await reviewTaskApi(selectedTask.task._id, {
      status: reviewStatus,
      note: reviewNote,
    });

    if (result.success === false) {
      toast.error(result.message);
    } else {
      toast.success(`Đã nghiệm thu & duyệt trạng thái: ${reviewStatus}`);
      await handleSelectTask(selectedTask.task._id);
      fetchTasks();
    }
    setReviewing(false);
  };

  const handleDeleteTask = async (taskId) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy nhiệm vụ này không? Phân vùng liên quan cũng sẽ bị xóa.",
      )
    )
      return;
    setLoading(true);
    try {
      const result = await deleteTaskApi(taskId);
      if (result.success === false) {
        toast.error(result.message || "Không thể hủy nhiệm vụ");
      } else {
        toast.success("Đã hủy nhiệm vụ thành công!");
        setSelectedTask(null);
        fetchTasks();
      }
    } catch (err) {
      toast.error("Lỗi khi hủy nhiệm vụ: " + err.message);
    } finally {
      setLoading(false);
    }
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

  // Lightbox helpers (xem ảnh bài nộp full size)
  const openPreview = (url, title) => {
    if (!url) return;
    setPreviewImage(url);
    setPreviewTitle(title || "Bản vẽ");
    setPreviewZoom(1);
  };
  const closePreview = () => {
    setPreviewImage(null);
    setPreviewTitle("");
    setPreviewZoom(1);
  };

  // Đóng lightbox khi bấm ESC
  useEffect(() => {
    if (!previewImage) return;
    const onKey = (e) => {
      if (e.key === "Escape") closePreview();
      if (e.key === "+" || e.key === "=") setPreviewZoom((z) => Math.min(z + 0.25, 4));
      if (e.key === "-") setPreviewZoom((z) => Math.max(z - 0.25, 0.5));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewImage]);

  return (
    <div className="mtp-container">
      {loading && <Loading text="Đang tải danh sách công việc..." />}

      <header className="mtp-header">
        <h1 className="mtp-title">Quản lý Task Trợ lý</h1>
        <p className="mtp-subtitle">
          Giao việc cho trợ lý vẽ kỹ thuật và nghiệm thu bản thảo qua tính năng
          so sánh trước/sau
        </p>
      </header>

      <div className="mtp-layout">
        {/* LEFT COLUMN */}
        <section className="mtp-left-section">
          {tasks.length === 0 ? (
            <div className="mtp-empty-state">
              <h3>Chưa giao việc cho trợ lý</h3>
              <p>Bạn chưa tạo task phân công nào.</p>
            </div>
          ) : (
            <div className="mtp-list">
              {tasks.map((task) => {
                const pageNum = task.page_id?.page_number || "?";
                const seriesTitle =
                  task.page_id?.chapter_id?.series_id?.title || "Không rõ";
                const chapterTitle =
                  task.page_id?.chapter_id?.title || "Không rõ";
                const assistantName = task.assigned_to?.name || "Chưa có";
                const overdue = isOverdue(task);
                const nearDeadline = isNearDeadline(task);

                return (
                  <div
                    key={task._id}
                    className={`mtp-card ${selectedTask?.task?._id === task._id ? "selected" : ""} ${overdue ? "overdue" : nearDeadline ? "near-deadline" : ""}`}
                    onClick={() => handleSelectTask(task._id)}
                  >
                    <div className="mtp-card-header">
                      <span
                        className={`mtp-badge ${getStatusColor(task.status)}`}
                      >
                        {translateStatus(task.status)}
                      </span>
                      {overdue && <span className="mtp-warning-icon">⚠️</span>}
                      <span className="mtp-card-price">
                        💵 {task.price.toLocaleString()}đ
                      </span>
                    </div>
                    <h3 className="mtp-card-tasktype">{task.task_type}</h3>
                    <p className="mtp-card-meta">
                      <strong>Trợ lý:</strong> {assistantName} <br />
                      <strong>Series:</strong> {seriesTitle} <br />
                      <strong>Chương:</strong> {chapterTitle} - Trang {pageNum}
                    </p>
                    <div className="mtp-card-footer">
                      <span
                        className={
                          overdue
                            ? "text-red-600 font-bold"
                            : nearDeadline
                              ? "text-orange-600 font-bold"
                              : ""
                        }
                      >
                        {overdue
                          ? "⚠️ QUÁ HẠN: "
                          : nearDeadline
                            ? "⏰ SẮP HẠN: "
                            : "Hạn chót: "}
                        {new Date(task.deadline).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN - REVIEW PANEL */}
        <section className="mtp-right-section">
          {detailLoading && <Loading text="Đang tải chi tiết..." />}

          {!selectedTask ? (
            <div className="mtp-detail-placeholder">
              <span className="placeholder-icon">🔍</span>
              <h3>Chọn một Task để nghiệm thu</h3>
              <p>
                Chọn task có trạng thái "Chờ duyệt" từ danh sách bên trái để so
                sánh ảnh bản thảo Before/After và quyết định duyệt bài hoặc yêu
                cầu sửa đổi.
              </p>
            </div>
          ) : (
            <div className="mtp-detail-card">
              <div className="mtp-detail-header">
                <h2>{selectedTask.task.task_type}</h2>
                <span
                  className={`mtp-badge ${getStatusColor(selectedTask.task.status)}`}
                >
                  {translateStatus(selectedTask.task.status)}
                </span>
              </div>

              <div className="mtp-detail-info-grid">
                <div>
                  <strong>Trợ lý nhận:</strong>{" "}
                  {selectedTask.task.assigned_to?.name}
                </div>
                <div>
                  <strong>Lương giao:</strong>{" "}
                  {selectedTask.task.price.toLocaleString()}đ
                </div>
                <div>
                  <strong>Trang:</strong> Trang{" "}
                  {selectedTask.task.page_id?.page_number}
                </div>
                <div>
                  <strong>Hạn chót:</strong>{" "}
                  {new Date(selectedTask.task.deadline).toLocaleDateString(
                    "vi-VN",
                  )}
                </div>
              </div>

              {selectedTask.task.status !== "Approved" &&
                selectedTask.task.status !== "Paid" && (
                  <div className="mtp-cancel-task-area">
                    <button
                      onClick={() => handleDeleteTask(selectedTask.task._id)}
                      className="mtp-cancel-task-btn"
                    >
                      Hủy nhiệm vụ 🗑️
                    </button>
                  </div>
                )}

              {/* IMAGE COMPARISON (BEFORE / AFTER) — 2 KHUNG ẢNH TRỰC TIẾP */}
              {selectedTask.submissions && selectedTask.submissions.length > 0 ? (
                (() => {
                  const latestSub = selectedTask.submissions[0];
                  const beforeUrl = selectedTask.task.page_id?.current_preview_url;
                  const afterUrl = latestSub.file_url;
                  const beforeKind = detectFileKind(beforeUrl);
                  const afterKind = detectFileKind(afterUrl);
                  const beforeDisplayUrl = buildDisplayUrl(beforeUrl, beforeKind.kind);
                  const afterDisplayUrl = buildDisplayUrl(afterUrl, afterKind.kind);

                  return (
                    <div className="mtp-comparison-container">
                      <h3>Nghiệm thu bản vẽ (Bản gốc vs Bài nộp)</h3>

                      <div className="mtp-preview-grid">
                        {/* KHUNG 1 — BẢN GỐC */}
                        <div className="mtp-preview-card">
                          <div className="mtp-preview-card-header">
                            <span className="mtp-preview-label before">Before · Bản thảo gốc</span>
                          </div>
                          <div className="mtp-preview-frame">
                            <InlineFilePreview
                              url={beforeUrl}
                              displayUrl={beforeDisplayUrl}
                              alt="Bản thảo gốc"
                              kind={beforeKind.kind}
                              onPreviewClick={() => openPreview(beforeDisplayUrl, "Before · Bản thảo gốc")}
                            />
                          </div>
                          <div className="mtp-preview-actions">
                            {beforeKind.kind === "image" && (
                              <button
                                type="button"
                                className="mtp-preview-btn"
                                onClick={() => openPreview(beforeDisplayUrl, "Before · Bản thảo gốc")}
                                disabled={!beforeUrl}
                              >
                                <Eye size={14} /> Xem ảnh lớn
                              </button>
                            )}
                            {beforeUrl && (
                              <a href={beforeUrl} target="_blank" rel="noreferrer" className="mtp-preview-link">
                                Mở tab mới ↗
                              </a>
                            )}
                          </div>
                        </div>

                        {/* KHUNG 2 — BÀI NỘP CỦA TRỢ LÝ */}
                        <div className="mtp-preview-card highlighted">
                          <div className="mtp-preview-card-header">
                            <span className="mtp-preview-label after">After · Bài nộp của trợ lý</span>
                          </div>
                          <div className="mtp-preview-frame">
                            <InlineFilePreview
                              url={afterUrl}
                              displayUrl={afterDisplayUrl}
                              alt={`Bài nộp của trợ lý${afterKind.extension ? ` (.${afterKind.extension})` : ""}`}
                              kind={afterKind.kind}
                              onPreviewClick={() => openPreview(afterDisplayUrl, "After · Bài nộp của trợ lý")}
                            />
                          </div>
                          <div className="mtp-preview-actions">
                            {afterKind.kind === "image" && (
                              <button
                                type="button"
                                className="mtp-preview-btn primary"
                                onClick={() => openPreview(afterDisplayUrl, "After · Bài nộp của trợ lý")}
                                disabled={!afterUrl}
                              >
                                <Eye size={14} /> Xem ảnh lớn
                              </button>
                            )}
                            {afterUrl && (
                              <a href={buildDownloadUrl(afterUrl)} download className="mtp-preview-link">
                                Tải về ↓
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="latest-note-box">
                        <strong>Lời nhắn của trợ lý:</strong>
                        <p>{latestSub.note || "Không có ghi chú"}</p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="mtp-no-submission">
                  <p>Trợ lý chưa nộp bất kỳ file sản phẩm nào cho task này.</p>
                </div>
              )}

              {/* REVIEW FORM ACTION */}
              {selectedTask.task.status === "Submitted" && (
                <form onSubmit={handleReviewSubmit} className="mtp-review-form">
                  <h3>Đánh giá và Duyệt sản phẩm</h3>

                  <div className="form-group">
                    <label>Quyết định kết quả:</label>
                    <div className="radio-group">
                      <label
                        className="radio-label approve"
                        style={{ paddingTop: '14px', paddingBottom: '14px', paddingLeft: '16px', paddingRight: '16px' }}
                      >
                        <input
                          type="radio"
                          name="reviewStatus"
                          value="Approved"
                          checked={reviewStatus === "Approved"}
                          onChange={() => setReviewStatus("Approved")}
                          className="radio-dot"
                        />
                        <span> Duyệt & Cộng tiền 💸</span>
                      </label>
                      <label
                        className="radio-label revision"
                        style={{ paddingTop: '14px', paddingBottom: '14px', paddingLeft: '16px', paddingRight: '16px' }}
                      >
                        <input
                          type="radio"
                          name="reviewStatus"
                          value="Revision Requested"
                          checked={reviewStatus === "Revision Requested"}
                          onChange={() => setReviewStatus("Revision Requested")}
                          className="radio-dot"
                        />
                        <span> Yêu cầu sửa lại ✏️</span>
                      </label>
                      <label
                        className="radio-label reject"
                        style={{ paddingTop: '14px', paddingBottom: '14px', paddingLeft: '16px', paddingRight: '16px' }}
                      >
                        <input
                          type="radio"
                          name="reviewStatus"
                          value="Rejected"
                          checked={reviewStatus === "Rejected"}
                          onChange={() => setReviewStatus("Rejected")}
                          className="radio-dot"
                        />
                        <span> Từ chối thẳng ❌</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reviewNote">
                      Lời nhắn nhận xét / Yêu cầu chi tiết:
                    </label>
                    <textarea
                      id="reviewNote"
                      rows={3}
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Nét vẽ background cần đậm hơn, khớp lại bóng thoại..."
                      required={reviewStatus !== "Approved"}
                      className="form-textarea"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewing}
                    className={`mtp-review-btn ${reviewStatus.toLowerCase().replace(" ", "-")}`}
                    style={{
                      boxShadow: 'none',
                      paddingTop: '20px',
                      paddingBottom: '20px',
                      paddingLeft: '32px',
                      paddingRight: '32px',
                      letterSpacing: '0.2em'
                    }}
                  >
                    {reviewing
                      ? "Đang gửi đánh giá..."
                      : "Xác nhận gửi Nghiệm thu ✔"}
                  </button>
                </form>
              )}

              {/* SUBMISSIONS HISTORY */}
              {selectedTask.submissions &&
                selectedTask.submissions.length > 0 && (
                  <div className="mtp-history-section">
                    <h3>Lịch sử tất cả lần nộp bài</h3>
                    <div className="mtp-history-list">
                      {selectedTask.submissions.map((sub) => (
                        <div key={sub._id} className="mtp-history-item">
                          <div className="mtp-history-header">
                            <span className="mtp-history-date">
                              {new Date(sub.submitted_at).toLocaleString(
                                "vi-VN",
                              )}
                            </span>
                            <span
                              className={`mtp-badge-small ${getStatusColor(sub.status)}`}
                            >
                              {translateStatus(sub.status)}
                            </span>
                          </div>
                          <p className="mtp-history-note">
                            <strong>Nhắn gửi:</strong> {sub.note || "Không"}
                          </p>
                          <a
                            href={sub.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mtp-history-link"
                          >
                            🔗 Mở liên kết file bài nộp
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </section>
      </div>

      {/* ══ LIGHTBOX XEM ẢNH BÀI NỘP FULL SIZE ══ */}
      {previewImage && (
        <div
          className="mtp-lightbox-overlay"
          onClick={closePreview}
          role="dialog"
          aria-modal="true"
          aria-label={previewTitle}
        >
          <div
            className="mtp-lightbox-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mtp-lightbox-header">
              <div className="mtp-lightbox-title">{previewTitle}</div>
              <div className="mtp-lightbox-toolbar">
                <button
                  type="button"
                  className="mtp-lightbox-iconbtn"
                  onClick={() => setPreviewZoom((z) => Math.max(z - 0.25, 0.5))}
                  title="Thu nhỏ (-)"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="mtp-lightbox-zoom-label">{Math.round(previewZoom * 100)}%</span>
                <button
                  type="button"
                  className="mtp-lightbox-iconbtn"
                  onClick={() => setPreviewZoom((z) => Math.min(z + 0.25, 4))}
                  title="Phóng to (+)"
                >
                  <ZoomIn size={18} />
                </button>
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="mtp-lightbox-iconbtn"
                  title="Mở tab mới"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={18} />
                </a>
                <button
                  type="button"
                  className="mtp-lightbox-iconbtn close"
                  onClick={closePreview}
                  title="Đóng (ESC)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="mtp-lightbox-viewer">
              <img
                src={previewImage}
                alt={previewTitle}
                className="mtp-lightbox-image"
                style={{ transform: `scale(${previewZoom})` }}
                draggable={false}
              />
            </div>
            <div className="mtp-lightbox-hint">
              Phím tắt: <strong>+</strong> / <strong>-</strong> để zoom, <strong>ESC</strong> để đóng, click bên ngoài để thoát.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
