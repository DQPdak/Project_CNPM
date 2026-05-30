// File cấu hình database cho các bài test, đảm bảo rằng chúng ta đang sử dụng một database riêng biệt để tránh ảnh hưởng đến dữ liệu thực tế của ứng dụng.
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

// Bật Server DB Ảo
const connectDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

// Tắt Server DB Ảo
const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
};

// Xóa sạch rác (data) sau mỗi hàm test
const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

module.exports = { connectDB, closeDB, clearDB };
