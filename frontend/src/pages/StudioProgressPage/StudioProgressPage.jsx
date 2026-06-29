import React, { useEffect, useState, useCallback } from "react";
import { getTasksApi, updateTaskStatusApi } from "../../services/task/taskService";
import getMySeries from "../../services/series/getMySeriesService";
import { getEditorSeries, getAllSeries, getAssistantSeries } from "../../services/series/getSeriesByRoleService";
import getChaptersBySeries from "../../services/chapter/getChaptersBySeriesService";
import getChapterProgressStats from "../../services/chapter/getChapterProgressStatsService";
import { useAuthStore } from "../../stores/authStore";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import { Calendar, DollarSign, User, AlertTriangle, RefreshCw, Layers, CheckCircle, ListTodo } from "lucide-react";
import "./StudioProgressPage.css";

const THREE_COLUMNS = [
  { id: "todo", title: "Viá»‡c cáº§n lÃ m", color: "border-t-[#FFD000]" },
  { id: "inprogress", title: "Äang thá»±c hiá»‡n", color: "border-t-[#23A094]" },
  { id: "done", title: "HoÃ n thÃ nh", color: "border-t-[#28a745]" }
];

export default function StudioProgressPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  
  const [allTasks, setAllTasks] = useState([]);
  const [progressStats, setProgressStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const isMangaka = user?.role === "Mangaka";
  const isEditor = user?.role === "Tantou Editor";
  const isBoard = user?.role === "Editorial Board";
  const isAdmin = user?.role === "Admin";
  const isAssistant = user?.role === "Assistant";

  // Check role permissions
  const isAllowedToEdit = isMangaka || isAdmin || isEditor;

  // 1. Fetch series list
  const fetchSeries = useCallback(async () => {
    setIsLoading(true);
    let res = { success: false, series: [] };
    
    try {
      if (isMangaka) {
        res = await getMySeries();
      } else if (isEditor) {
        res = await getEditorSeries();
      } else if (isBoard || isAdmin) {
        res = await getAllSeries();
      } else if (isAssistant) {
        res = await getAssistantSeries();
      }

      if (res.success) {
        const items = res.series || [];
        const formatted = items.map(item => item.series ? item.series : item);
        setSeriesList(formatted);
        if (formatted.length > 0) {
          setSelectedSeriesId(formatted[0]._id);
        }
      } else {
        toast.error("KhÃ´ng thá»ƒ táº£i danh sÃ¡ch series: " + res.message);
      }
    } catch (error) {
      toast.error("Lá»—i khi táº£i series: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [isMangaka, isEditor, isBoard, isAdmin, isAssistant, toast]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  // 2. Fetch chapters when series changes
  useEffect(() => {
    if (!selectedSeriesId) {
      setChapters([]);
      setSelectedChapterId("");
      return;
    }

    const fetchChapters = async () => {
      const res = await getChaptersBySeries(selectedSeriesId);
      if (res.success) {
        setChapters(res.chapters || []);
        if (res.chapters && res.chapters.length > 0) {
          setSelectedChapterId(res.chapters[0]._id);
        } else {
          setSelectedChapterId("");
        }
      } else {
        toast.error("KhÃ´ng thá»ƒ táº£i chÆ°Æ¡ng: " + res.message);
        setChapters([]);
        setSelectedChapterId("");
      }
    };

    fetchChapters();
  }, [selectedSeriesId, toast]);

  // 3. Fetch tasks and chapter progress stats
  const fetchTasksAndProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      const tasksRes = await getTasksApi({});
      if (tasksRes.success) {
        setAllTasks(tasksRes.tasks || []);
      } else {
        toast.error(tasksRes.message);
      }

      if (selectedChapterId) {
        const statsRes = await getChapterProgressStats(selectedChapterId);
        if (statsRes.success) {
          setProgressStats(statsRes);
        } else {
          setProgressStats(null);
          toast.error(statsRes.message);
        }
      } else {
        setProgressStats(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChapterId, toast]);

  useEffect(() => {
    fetchTasksAndProgress();
  }, [fetchTasksAndProgress]);

  // Helper check: Is task overdue?
  const isOverdue = (task) => {
    if (["Approved", "Paid", "Submitted"].includes(task.status)) return false;
    if (!task.deadline) return false;
    return new Date() > new Date(task.deadline);
  };

  // Helper check: Is task near deadline (within 48 hours)?
  const isNearDeadline = (task) => {
    if (["Approved", "Paid", "Submitted"].includes(task.status)) return false;
    if (!task.deadline) return false;
    const timeDiff = new Date(task.deadline).getTime() - new Date().getTime();
    return timeDiff > 0 && timeDiff < 48 * 3600 * 1000;
  };

  // Helper: map task state to one of the 3 Kanban columns
  const getColumnForTask = (task) => {
    const s = task.status;
    if (s === "Assigned" || s === "Rejected") return "todo";
    if (s === "In Progress" || s === "Revision Requested") return "inprogress";
    if (s === "Submitted" || s === "Approved" || s === "Paid") return "done";
    return "todo";
  };

  // 4. HTML5 Drag & Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = allTasks.find(t => t._id === taskId);
    if (!task) return;

    // Check permissions
    if (!isAllowedToEdit) {
      toast.error("Báº¡n khÃ´ng cÃ³ quyá»n cáº­p nháº­t tráº¡ng thÃ¡i tiáº¿n Ä‘á»™!");
      return;
    }

    // Determine new status based on target column
    let newStatus = "";
    if (columnId === "todo") {
      newStatus = "Assigned";
    } else if (columnId === "inprogress") {
      newStatus = "In Progress";
    } else if (columnId === "done") {
      newStatus = "Approved"; // Mangaka approves the work
    }

    if (task.status === newStatus || getColumnForTask(task) === columnId) return;

    setIsActionLoading(true);
    try {
      const res = await updateTaskStatusApi(taskId, newStatus);
      if (res.success) {
        toast.success(`ÄÃ£ chuyá»ƒn cÃ´ng viá»‡c sang cá»™t: ${columnId === "todo" ? "Viá»‡c cáº§n lÃ m" : columnId === "inprogress" ? "Äang thá»±c hiá»‡n" : "HoÃ n thÃ nh"}`);
        // Refresh local list
        setAllTasks(allTasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      } else {
        toast.error("Lá»—i cáº­p nháº­t tráº¡ng thÃ¡i: " + res.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 5. In-Memory Filtered Tasks
  const getFilteredTasks = () => {
    if (!selectedSeriesId) return [];
    return allTasks.filter(task => {
      const page = task.page_id || {};
      const chapter = page.chapter_id || {};
      const series = chapter.series_id || {};
      
      const taskSeriesId = series._id || series;
      const taskChapterId = chapter._id || chapter;
      
      if (String(taskSeriesId) !== String(selectedSeriesId)) return false;
      if (selectedChapterId && String(taskChapterId) !== String(selectedChapterId)) return false;
      
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  // 6. Dashboard metrics
  const totalAnnotations = progressStats?.annotations?.total ?? 0;
  const completedAnnotations = progressStats?.annotations?.resolved ?? 0;
  const pendingAnnotations = progressStats?.annotations?.unresolved ?? 0;
  const annotationProgress = totalAnnotations > 0 ? Math.round((completedAnnotations / totalAnnotations) * 100) : 0;
  const completionPercent = progressStats?.completionPercent ?? 0;
  const taskStatusCounts = progressStats?.taskStatusCounts || {};
  
  const totalChapters = chapters.length;

  // Deadline notifications lists
  const upcomingTasks = filteredTasks.filter(task => isNearDeadline(task));
  const overdueTasks = progressStats?.overdueTasks || filteredTasks.filter(task => isOverdue(task));

  const translateTaskStatus = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "assigned") return "Má»›i giao";
    if (s === "in progress") return "Äang váº½";
    if (s === "submitted") return "Chá» duyá»‡t";
    if (s === "approved") return "ÄÃ£ duyá»‡t";
    if (s === "revision requested") return "Cáº§n sá»­a";
    if (s === "rejected") return "Bá»‹ tá»« chá»‘i";
    if (s === "paid") return "ÄÃ£ tráº£ lÆ°Æ¡ng";
    return status;
  };

  return (
    <div className="kp-container">
      {isActionLoading && <Loading text="Äang xá»­ lÃ½ kÃ©o tháº£..." />}

      {/* WORKSPACE HEADER */}
      <header className="kp-header shadow-brutal">
        <div>
          <h1 className="kp-title">Báº¢NG TIáº¾N Äá»˜ & DASHBOARD GIÃM SÃT</h1>
          <p className="kp-subtitle">GiÃ¡m sÃ¡t tá»•ng quan Annotation biÃªn táº­p, quáº£n lÃ½ luá»“ng váº½ Kanban vÃ  rÃ  soÃ¡t deadline</p>
        </div>
        
        <button onClick={fetchTasksAndProgress} className="kp-refresh-btn font-bold">
          <RefreshCw size={16} /> Táº£i láº¡i dá»¯ liá»‡u
        </button>
      </header>

      {/* SELECTION CONTROL PANEL */}
      <section className="kp-filter-panel shadow-brutal bg-white border-4 border-black p-4 flex flex-wrap gap-6 items-center">
        <div className="kp-filter-group">
          <label htmlFor="seriesSelect" className="font-black text-xs uppercase block mb-1">Chá»n bá»™ truyá»‡n (Series)</label>
          <select
            id="seriesSelect"
            value={selectedSeriesId}
            onChange={(e) => setSelectedSeriesId(e.target.value)}
            className="kp-select"
            disabled={isLoading}
          >
            {seriesList.length === 0 ? (
              <option value="">-- KhÃ´ng tÃ¬m tháº¥y truyá»‡n --</option>
            ) : (
              seriesList.map(s => (
                <option key={s._id} value={s._id}>{s.title}</option>
              ))
            )}
          </select>
        </div>

        <div className="kp-filter-group">
          <label htmlFor="chapterSelect" className="font-black text-xs uppercase block mb-1">Chá»n chÆ°Æ¡ng (Chapter)</label>
          <select
            id="chapterSelect"
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="kp-select"
            disabled={isLoading || chapters.length === 0}
          >
            <option value="">Táº¥t cáº£ cÃ¡c chÆ°Æ¡ng</option>
            {chapters.map(c => (
              <option key={c._id} value={c._id}>ChÆ°Æ¡ng {c.chapter_number}: {c.title}</option>
            ))}
          </select>
        </div>
      </section>

      {/* DASHBOARD METRICS */}
      <section className="kp-dashboard-grid shadow-brutal bg-white border-4 border-black p-5">
        <h2 className="kp-dashboard-title">DASHBOARD GIÃM SÃT TIáº¾N Äá»˜</h2>
        
        <div className="kp-metrics-wrapper">
          {/* Card 1: Annotation Progress */}
          <div className="kp-metric-card">
            <span className="kp-card-label">BiÃªn táº­p Annotation</span>
            <div className="kp-card-numbers">
              <span className="kp-main-num">{totalAnnotations}</span>
              <span className="kp-sub-num">
                (ÄÃ£ xong: <strong className="text-green-600">{completedAnnotations}</strong> | Chá»: <strong className="text-red-500">{pendingAnnotations}</strong>)
              </span>
            </div>
            {/* Progress bar */}
            <div className="kp-progress-container mt-2">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Tá»· lá»‡ hoÃ n thÃ nh</span>
                <span>{annotationProgress}%</span>
              </div>
              <div className="kp-progress-bar bg-gray-200 h-3 border border-black rounded-full overflow-hidden">
                <div 
                  className="bg-[#23A094] h-full transition-all duration-500" 
                  style={{ width: `${annotationProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Chapter Progress Stats */}
          <div className="kp-metric-card center-card flex flex-col justify-between">
            <div>
              <span className="kp-card-label">Tiến độ chapter</span>
              <div className="kp-main-num mt-1">{completionPercent}%</div>
              <div className="kp-task-status-grid">
                <span>To Do: <strong>{taskStatusCounts.Assigned || 0}</strong></span>
                <span>Doing: <strong>{taskStatusCounts["In Progress"] || 0}</strong></span>
                <span>Done: <strong>{(taskStatusCounts.Submitted || 0) + (taskStatusCounts.Approved || 0) + (taskStatusCounts.Paid || 0)}</strong></span>
              </div>
            </div>
            <span className="text-xs text-gray-500">Series hiện có {totalChapters} chapter</span>
          </div>

          {/* Card 3: Deadline Alert box */}
          <div className="kp-metric-card alert-card">
            <span className="kp-card-label text-red-600 flex items-center gap-1">
              <AlertTriangle size={14} /> Cáº£nh bÃ¡o háº¡n chÃ³t
            </span>
            <div className="kp-alert-list mt-2">
              <div className="flex justify-between border-b border-gray-200 py-1 text-xs">
                <span>âš ï¸ QuÃ¡ háº¡n váº½:</span>
                <span className="font-black text-red-500">{overdueTasks.length} task</span>
              </div>
              <div className="flex justify-between py-1 text-xs">
                <span>â° Sáº¯p Ä‘áº¿n háº¡n:</span>
                <span className="font-black text-orange-500">{upcomingTasks.length} task</span>
              </div>
            </div>
          </div>
        </div>

        {/* DEADLINE ALERTS DETAIL LISTS */}
        <div className="kp-alert-sections mt-4 grid grid-cols-2 gap-4">
          <div className="kp-alert-subpanel border-2 border-black p-3 bg-red-50">
            <h3 className="font-black text-xs uppercase text-red-600 mb-2 border-b border-red-200 pb-1">ðŸ›‘ CÃ´ng viá»‡c quÃ¡ háº¡n</h3>
            {overdueTasks.length === 0 ? (
              <p className="text-xs italic text-gray-500">KhÃ´ng cÃ³ cÃ´ng viá»‡c nÃ o quÃ¡ háº¡n.</p>
            ) : (
              <div className="kp-mini-list max-h-24 overflow-y-auto">
                {overdueTasks.map(t => (
                  <div key={t._id} className="text-xs flex justify-between py-0.5 border-b border-red-100">
                    <span>Trang {t.page_id?.page_number}: <strong>{t.task_type}</strong></span>
                    <span className="text-red-600 font-bold">{new Date(t.deadline).toLocaleDateString("vi-VN")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="kp-alert-subpanel border-2 border-black p-3 bg-orange-50">
            <h3 className="font-black text-xs uppercase text-orange-600 mb-2 border-b border-orange-200 pb-1">â° CÃ´ng viá»‡c sáº¯p Ä‘áº¿n háº¡n</h3>
            {upcomingTasks.length === 0 ? (
              <p className="text-xs italic text-gray-500">KhÃ´ng cÃ³ cÃ´ng viá»‡c nÃ o cáº§n gáº¥p.</p>
            ) : (
              <div className="kp-mini-list max-h-24 overflow-y-auto">
                {upcomingTasks.map(t => (
                  <div key={t._id} className="text-xs flex justify-between py-0.5 border-b border-orange-100">
                    <span>Trang {t.page_id?.page_number}: <strong>{t.task_type}</strong></span>
                    <span className="text-orange-600 font-bold">{new Date(t.deadline).toLocaleDateString("vi-VN")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* KANBAN BOARD */}
      {isLoading && allTasks.length === 0 ? (
        <Loading text="Äang táº£i dá»¯ liá»‡u tiáº¿n Ä‘á»™..." />
      ) : (
        <div className="kp-board">
          {THREE_COLUMNS.map((column) => {
            // Get all tasks matching this column
            const columnTasks = filteredTasks.filter(task => getColumnForTask(task) === column.id);
            
            // Sort tasks to put OVERDUE tasks at the top
            const sortedTasks = [...columnTasks].sort((a, b) => {
              const aOver = isOverdue(a) ? 1 : 0;
              const bOver = isOverdue(b) ? 1 : 0;
              return bOver - aOver; // Putting 1 first
            });

            return (
              <div 
                key={column.id}
                className="kp-column shadow-brutal bg-white border-4 border-black"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className={`kp-column-header border-b-4 border-black p-3 font-black text-sm uppercase flex justify-between items-center bg-gray-50 border-t-8 ${column.color}`}>
                  <span>{column.title}</span>
                  <span className="bg-black text-white px-2 py-0.5 text-xs rounded-full">{columnTasks.length}</span>
                </div>

                {/* Column Body */}
                <div className="kp-column-cards p-3 flex flex-col gap-3 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                  {sortedTasks.length === 0 ? (
                    <div className="kp-empty-column text-center py-8 text-xs text-gray-400 border border-dashed border-gray-300">
                      KÃ©o tháº£ tháº» vÃ o Ä‘Ã¢y
                    </div>
                  ) : (
                    sortedTasks.map((task) => {
                      const pageNum = task.page_id?.page_number || "?";
                      const pageId = task.page_id?._id || task.page_id;
                      const overdue = isOverdue(task);
                      
                      return (
                        <div 
                          key={task._id}
                          className={`kp-card border-2 border-black p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all cursor-grab active:cursor-grabbing ${overdue ? "bg-red-50 border-red-500 shadow-[2px_2px_0px_#ef4444]" : "bg-white"}`}
                          draggable={isAllowedToEdit}
                          onDragStart={(e) => handleDragStart(e, task._id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-black text-[10px] tracking-tight bg-gray-100 border border-black px-1.5 py-0.5">
                              Trang {pageNum}
                            </span>
                            {overdue && (
                              <span className="kanban-badge overdue font-black uppercase text-[9px] bg-red-200 text-red-700 border-2 border-red-600 px-1 py-0.5 flex items-center gap-0.5 animation-pulse">
                                <AlertTriangle size={10} /> QuÃ¡ háº¡n
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-extrabold text-sm mb-2">{task.task_type}</h3>
                          
                          <div className="kp-card-meta flex flex-col gap-1 text-[11px] text-gray-600 border-t border-gray-200 pt-2">
                            <div className="flex items-center gap-1.5">
                              <User size={12} />
                              <span>Phá»¥ trÃ¡ch: <strong>{task.assigned_to?.name || "ChÆ°a rÃµ"}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign size={12} />
                              <span>ÄÆ¡n giÃ¡: <strong>{task.price.toLocaleString()}Ä‘</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} />
                              <span>Háº¡n chÃ³t: <strong className={overdue ? "text-red-600 font-bold" : ""}>{new Date(task.deadline).toLocaleDateString("vi-VN")}</strong></span>
                            </div>
                          </div>

                          <div className="kp-card-actions flex justify-between border-t border-gray-100 mt-2.5 pt-2">
                            <span className="text-[10px] uppercase font-bold text-gray-400">
                              {translateTaskStatus(task.status)}
                            </span>
                            <a 
                              href={`/workspace/${pageId}`} 
                              className="kp-card-btn font-bold text-[10px] text-teal-600 hover:underline flex items-center gap-0.5"
                            >
                              <Layers size={10} /> Workspace
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
