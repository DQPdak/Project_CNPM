const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/config_mongoDB");
// const connectDB = require("./config/db");

// Tải cấu hình từ file .env vào hệ thống
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

// Kết nối tới cơ sở dữ liệu MongoDB

connectDB();

// Cấu hình Middlewares cơ bản
app.use(cors()); // Cho phép Frontend (port 5173/3000) gọi API sang đây
app.use(express.json()); // Cho phép server đọc và hiểu dữ liệu dạng JSON gửi lên

// Đường link chạy thử nghiệm (Route test)
app.get("/", (req, res) => {
  res.json({ message: "Chào mừng bạn đến với API Hệ thống Quản lý Manga!" });
});

// Khởi động server lắng nghe qua cổng được cấu hình
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=== Server đang chạy mượt mà tại cổng: ${PORT} ===`);
});
