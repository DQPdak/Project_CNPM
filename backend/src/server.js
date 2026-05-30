if (process.env.NODE_ENV !== "production") {
  const dns = require("dns");
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  console.log(
    "🛠️ Đang chạy ở máy Local: Đã ép dùng Google DNS để chống lỗi mạng.",
  );
}

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/config_mongoDB");
const { connectCloudinary } = require("./config/config_cloudinary");

// Import các route
const chapterRoutes = require("./routes/chapter.routes");
const pageRoutes = require("./routes/page.routes");
const publishRoutes = require("./routes/publish.routes");

// Tải cấu hình từ file .env vào hệ thống
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

// Cấu hình Middlewares cơ bản
app.use(cors()); // Cho phép Frontend (port 5173/3000) gọi API sang đây
app.use(express.json()); // Cho phép server đọc và hiểu dữ liệu dạng JSON gửi lên

// Đường link chạy thử nghiệm (Route test)
app.get("/", (req, res) => {
  res.json({ message: "Chào mừng bạn đến với API Hệ thống Quản lý Manga!" });
});

// Khai báo các API routes
app.use("/api/chapters", chapterRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/publish", publishRoutes);

// Kết nối tới cơ sở dữ liệu MongoDB
connectDB();

// Kết nối tới Cloudinary
connectCloudinary();

// Khởi động server lắng nghe qua cổng được cấu hình
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=== Server đang chạy mượt mà tại cổng: ${PORT} ===`);
});
