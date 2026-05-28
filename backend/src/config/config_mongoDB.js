const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // 1. Lấy các biến từ file .env
    const username = process.env.DB_USERNAME;
    const password = process.env.DB_PASSWORD;
    const cluster = process.env.DB_CLUSTER;
    const dbName = process.env.DB_NAME;

    // 2. Lắp ráp lại thành chuỗi URI hoàn chỉnh sử dụng Template Literal (dấu backtick ` `)
    const MONGO_URI = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;

    // 3. Tiến hành kết nối
    const conn = await mongoose.connect(MONGO_URI);
    console.log("Đang kết nối tới MongoDB thành công! ");
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
