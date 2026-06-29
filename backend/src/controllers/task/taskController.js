const Task = require("../../models/TaskModel");
const TaskSubmission = require("../../models/TaskSubmissionModel");
const AssistantIncome = require("../../models/AssistantIncomeModel");
const Page = require("../../models/PageModel");
const PageVersionHistory = require("../../models/PageVersionHistoryModel");
const PageRegion = require("../../models/PageRegionModel");

// Get list of tasks
exports.getTasks = async (req, res) => {
  try {
    const { status, page_id } = req.query;
    const filter = {};

    // Filter by role
    if (req.user.role === "Assistant") {
      filter.assigned_to = req.user.id;
    } else if (req.user.role === "Mangaka") {
      filter.assigned_by = req.user.id;
    }

    if (status) {
      filter.status = status;
    }
    if (page_id) {
      filter.page_id = page_id;
    }

    const tasks = await Task.find(filter)
      .populate({
        path: "page_id",
        select: "page_number current_preview_url current_source_file_url attached_resource_url chapter_id",
        populate: {
          path: "chapter_id",
          select: "title series_id",
          populate: {
            path: "series_id",
            select: "title"
          }
        }
      })
      .populate("region_id", "coordinates region_type")
      .populate("assigned_to", "name email")
      .populate("assigned_by", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Get single task details
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate({
        path: "page_id",
        select: "page_number current_preview_url current_source_file_url attached_resource_url chapter_id",
        populate: {
          path: "chapter_id",
          select: "title series_id",
          populate: {
            path: "series_id",
            select: "title"
          }
        }
      })
      .populate("region_id", "coordinates region_type")
      .populate("assigned_to", "name email")
      .populate("assigned_by", "name email");

    if (!task) {
      return res.status(404).json({ success: false, message: "Không tìm thấy task" });
    }

    // Security check
    if (req.user.role === "Assistant" && String(task.assigned_to._id) !== req.user.id) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem task này" });
    }
    if (req.user.role === "Mangaka" && String(task.assigned_by._id) !== req.user.id) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem task này" });
    }

    // Get submissions
    const submissions = await TaskSubmission.find({ task_id: task._id })
      .populate("submitted_by", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, task, submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Create task (Mangaka only)
exports.createTask = async (req, res) => {
  try {
    const { page_id, region_id, assigned_to, task_type, description, deadline, price } = req.body;

    if (!page_id || !assigned_to || !task_type || !deadline) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ các thông tin bắt buộc" });
    }

    // Check if page exists
    const page = await Page.findById(page_id);
    if (!page) {
      return res.status(404).json({ success: false, message: "Không tìm thấy trang truyện" });
    }

    // If region_id is provided, check if region exists; else create a default region
    let finalRegionId = region_id;
    if (region_id) {
      const region = await PageRegion.findById(region_id);
      if (!region) {
        return res.status(404).json({ success: false, message: "Không tìm thấy vùng phân công" });
      }
    } else {
      // Auto-create default region for page
      const defaultRegion = new PageRegion({
        page_id,
        coordinates: JSON.stringify({ x: 0, y: 0, width: 600, height: 800 }),
        region_type: "panel",
        created_by: req.user.id
      });
      await defaultRegion.save();
      finalRegionId = defaultRegion._id;
    }

    const newTask = new Task({
      page_id,
      region_id: finalRegionId,
      assigned_to,
      assigned_by: req.user.id,
      task_type,
      description: description || "",
      deadline: new Date(deadline),
      price: price || 0,
      status: "Assigned"
    });

    await newTask.save();

    return res.status(201).json({ success: true, message: "Phân công công việc thành công", task: newTask });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Submit task (Assistant only)
exports.submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Không tìm thấy task" });
    }

    // Security check
    if (String(task.assigned_to) !== req.user.id) {
      return res.status(403).json({ success: false, message: "Bạn không được giao task này" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Vui lòng tải lên file thành phẩm" });
    }

    const fileUrl = req.file.path || req.file.url;

    // Create TaskSubmission
    const submission = new TaskSubmission({
      task_id: task._id,
      submitted_by: req.user.id,
      file_url: fileUrl,
      note: note || "",
      status: "Submitted"
    });

    await submission.save();

    // Update Task status
    task.status = "Submitted";
    await task.save();

    return res.status(200).json({
      success: true,
      message: "Nộp file thành phẩm thành công!",
      submission
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Review task (Mangaka only)
exports.reviewTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body; // status should be: Approved, Revision Requested, Rejected

    if (!["Approved", "Revision Requested", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái đánh giá không hợp lệ" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Không tìm thấy task" });
    }

    // Security check
    if (String(task.assigned_by) !== req.user.id && req.user.role !== "Admin") {
      return res.status(403).json({ success: false, message: "Bạn không có quyền duyệt task này" });
    }

    // Update Task status
    task.status = status;
    await task.save();

    // Update latest submission status
    const latestSubmission = await TaskSubmission.findOne({ task_id: task._id }).sort({ createdAt: -1 });
    if (latestSubmission) {
      latestSubmission.status = status;
      await latestSubmission.save();
    }

    // If approved, trigger page version updates and income logic
    if (status === "Approved") {
      // 1. Update Page Version if submission exists
      if (latestSubmission && latestSubmission.file_url) {
        const page = await Page.findById(task.page_id);
        if (page) {
          const newVersion = page.current_version + 1;
          const originalUrl = latestSubmission.file_url;
          
          // Detect file type to update fields
          const isZip = originalUrl.toLowerCase().endsWith(".zip");
          if (isZip) {
            page.attached_resource_url = originalUrl;
          } else {
            page.current_preview_url = originalUrl;
            page.current_source_file_url = originalUrl; // update manuscript
          }
          
          page.current_version = newVersion;
          page.status = "Ready For Review"; // Set page status to ready for review by editor
          await page.save();

          // Save page version history
          const versionHistory = new PageVersionHistory({
            page_id: page._id,
            version_number: newVersion,
            preview_url: page.current_preview_url,
            source_file_url: page.current_source_file_url,
            attached_resource_url: page.attached_resource_url,
            submitted_by: task.assigned_to,
            commit_note: note || `Approved Assistant Task: ${task.task_type}`
          });
          await versionHistory.save();
        }
      }

      // 2. Automated Income Generation logic
      const date = new Date();
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // e.g. 2026-06

      // Check if income entry already exists for this task (to avoid duplicates)
      const existingIncome = await AssistantIncome.findOne({ task_id: task._id });
      if (!existingIncome) {
        const income = new AssistantIncome({
          assistant_id: task.assigned_to,
          task_id: task._id,
          amount: task.price,
          month: monthStr,
          status: "Approved" // Status is Approved, waiting for Admin to pay
        });
        await income.save();
      } else {
        existingIncome.status = "Approved";
        existingIncome.amount = task.price;
        await existingIncome.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Đã đánh giá task thành công: ${status}`,
      task
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Get list of all assistants
exports.getAssistants = async (req, res) => {
  try {
    const User = require("../../models/UserModel");
    const assistants = await User.find({ role: "Assistant", status: "Active" }).select("name email");
    return res.status(200).json({ success: true, assistants });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Cập nhật trạng thái Task trực tiếp (Kanban Drag and Drop)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "Assigned",
      "In Progress",
      "Submitted",
      "Approved",
      "Revision Requested",
      "Rejected",
      "Paid"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Không tìm thấy task" });
    }

    // Kiểm tra phân quyền: Chỉ Mangaka hoặc Admin hoặc chính Assistant đó (nếu chuyển sang In Progress) được phép
    const isOwner = String(task.assigned_to) === req.user.id;
    const isCreator = String(task.assigned_by) === req.user.id;
    const isAdmin = req.user.role === "Admin";
    const isEditor = req.user.role === "Tantou Editor";

    if (!isCreator && !isAdmin && !isEditor && !(isOwner && status === "In Progress")) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền chuyển trạng thái nhiệm vụ này" });
    }

    task.status = status;
    await task.save();

    return res.status(200).json({ success: true, message: `Đã cập nhật trạng thái nhiệm vụ thành ${status}`, task });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};
