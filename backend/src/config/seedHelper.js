const User = require("../models/UserModel");
const Series = require("../models/SeriesModel");
const Chapter = require("../models/ChapterModel");
const Page = require("../models/PageModel");
const PageRegion = require("../models/PageRegionModel");
const Task = require("../models/TaskModel");
const TaskSubmission = require("../models/TaskSubmissionModel");
const AssistantIncome = require("../models/AssistantIncomeModel");
const Annotation = require("../models/AnnotationModel");
const { hashPassword } = require("../modules/auth/utils/password");

const runSeed = async () => {
  try {
    console.log("🌱 Auto-seeding database for development...");
    
    // Clear existing task-related tables
    await Task.deleteMany({});
    await TaskSubmission.deleteMany({});
    await AssistantIncome.deleteMany({});
    await PageRegion.deleteMany({});
    await Annotation.deleteMany({});

    // Hash password
    const hashedPass = await hashPassword("password123");

    // 1. Seed Users
    const mangaka = await User.findOneAndUpdate(
      { email: "mangaka@example.com" },
      {
        name: "Nguyễn Mangaka",
        email: "mangaka@example.com",
        password: hashedPass,
        role: "Mangaka",
        status: "Active"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const assistant = await User.findOneAndUpdate(
      { email: "assistant@example.com" },
      {
        name: "Lê Trợ Lý",
        email: "assistant@example.com",
        password: hashedPass,
        role: "Assistant",
        status: "Active"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const admin = await User.findOneAndUpdate(
      { email: "admin@example.com" },
      {
        name: "Hệ Thống Admin",
        email: "admin@example.com",
        password: hashedPass,
        role: "Admin",
        status: "Active"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const editor = await User.findOneAndUpdate(
      { email: "editor@example.com" },
      {
        name: "Trần Biên Tập",
        email: "editor@example.com",
        password: hashedPass,
        role: "Tantou Editor",
        status: "Active"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`- Seeded Mangaka: ${mangaka.email}`);
    console.log(`- Seeded Assistant: ${assistant.email}`);
    console.log(`- Seeded Admin: ${admin.email}`);
    console.log(`- Seeded Editor: ${editor.email}`);

    // 2. Seed Series, Chapter, Page
    const series = await Series.findOneAndUpdate(
      { title: "Kiếm Sĩ Huyền Thoại" },
      {
        title: "Kiếm Sĩ Huyền Thoại",
        description: "Hành trình của kiếm sĩ cuối cùng bảo vệ thế giới.",
        genre: "Action",
        target_audience: "Teen",
        author_id: mangaka._id,
        editor_id: editor._id,
        status: "Active"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const chapter = await Chapter.findOneAndUpdate(
      { series_id: series._id, chapter_number: 1 },
      {
        series_id: series._id,
        chapter_number: 1,
        title: "Chương 1: Lời Nguyền Trỗi Dậy",
        deadline: new Date("2026-12-31"),
        status: "In Production"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const page1 = await Page.findOneAndUpdate(
      { chapter_id: chapter._id, page_number: 1 },
      {
        chapter_id: chapter._id,
        page_number: 1,
        current_preview_url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
        current_source_file_url: "https://manga-resources.s3.amazonaws.com/raw/chapter1_page1.psd",
        attached_resource_url: "https://manga-resources.s3.amazonaws.com/assets/chapter1_page1_assets.zip",
        current_version: 1,
        status: "In Progress"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const page2 = await Page.findOneAndUpdate(
      { chapter_id: chapter._id, page_number: 2 },
      {
        chapter_id: chapter._id,
        page_number: 2,
        current_preview_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        current_source_file_url: "https://manga-resources.s3.amazonaws.com/raw/chapter1_page2.psd",
        attached_resource_url: null,
        current_version: 1,
        status: "In Progress"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`- Seeded Series & Chapter: ${series.title}`);
    console.log(`- Seeded Pages (1 & 2)`);

    // 3. Seed Page Regions
    const region1 = new PageRegion({
      page_id: page1._id,
      coordinates: JSON.stringify({ x: 50, y: 120, width: 250, height: 180 }),
      region_type: "panel",
      created_by: mangaka._id
    });
    await region1.save();

    const region2 = new PageRegion({
      page_id: page1._id,
      coordinates: JSON.stringify({ x: 320, y: 400, width: 180, height: 150 }),
      region_type: "speech_bubble",
      created_by: mangaka._id
    });
    await region2.save();

    console.log(`- Seeded Page Regions`);

    // 4. Seed Tasks
    const task1 = new Task({
      page_id: page1._id,
      region_id: region1._id,
      assigned_to: assistant._id,
      assigned_by: mangaka._id,
      task_type: "Vẽ background",
      description: "Thêm cảnh lâu đài cổ kính phía sau nhân vật chính. Sử dụng nét mảnh.",
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
      status: "Assigned",
      price: 250000
    });
    await task1.save();

    const task2 = new Task({
      page_id: page1._id,
      region_id: region2._id,
      assigned_to: assistant._id,
      assigned_by: mangaka._id,
      task_type: "Tô bóng",
      description: "Tô bóng và tạo hiệu ứng chiều sâu cho nhân vật trong panel chính.",
      deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day later
      status: "Submitted",
      price: 400000
    });
    await task2.save();

    const submission2 = new TaskSubmission({
      task_id: task2._id,
      submitted_by: assistant._id,
      file_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      note: "Em đã hoàn thành tô bóng và vẽ lại bóng đổ. Anh xem thử được chưa nhé.",
      status: "Submitted",
      submitted_at: new Date()
    });
    await submission2.save();

    const task3 = new Task({
      page_id: page2._id,
      region_id: region1._id,
      assigned_to: assistant._id,
      assigned_by: mangaka._id,
      task_type: "Đi nét",
      description: "Đi lại nét viền nhân vật chính ở trang 2.",
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: "Approved",
      price: 350000
    });
    await task3.save();

    const submission3 = new TaskSubmission({
      task_id: task3._id,
      submitted_by: assistant._id,
      file_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      note: "Nét vẽ sạch sẽ ở chapter 2.",
      status: "Approved",
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });
    await submission3.save();

    // Seed Income for Task 3
    const date = new Date();
    const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const income = new AssistantIncome({
      assistant_id: assistant._id,
      task_id: task3._id,
      amount: task3.price,
      month: currentMonth,
      status: "Approved"
    });
    await income.save();

    // 5. Seed Annotations (Góp ý biên tập)
    // Lưu ý: chapter_id là bắt buộc kể từ schema v2
    const ann1 = new Annotation({
      chapter_id: chapter._id,          // Bắt buộc
      page_id: page1._id,               // Bắt buộc
      x: 30,                            // Tọa độ ngang
      y: 40,                            // Tọa độ dọc
      content: "Lời thoại nhân vật chính sai chính tả, cần sửa lại",
      status: "Open",
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 ngày sau
      created_by: editor._id,
      role: "Tantou Editor",
      category: "dialogue",
    });
    await ann1.save();

    const ann2 = new Annotation({
      chapter_id: chapter._id,
      page_id: page1._id,
      x: 60,
      y: 70,
      content: "Nét vẽ viền ngoài bị lem màu, cần tô lại",
      status: "Resolved",
      deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 ngày trước
      created_by: editor._id,
      role: "Tantou Editor",
      category: "drawing",
    });
    await ann2.save();

    const ann3 = new Annotation({
      chapter_id: chapter._id,
      page_id: page2._id,
      x: 150,
      y: 200,
      content: "Bố cục panel bị lệch sang trái so với storyboard",
      status: "In Progress",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 ngày sau
      created_by: editor._id,
      role: "Tantou Editor",
      category: "layout",
    });
    await ann3.save();

    console.log(`- Seeded Annotations (3 records)`);
    console.log("✅ Auto-seeding completed successfully!");
  } catch (err) {
    console.error("❌ Auto-seeding error:", err);
  }
};

module.exports = { runSeed };
