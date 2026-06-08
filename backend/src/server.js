if (process.env.NODE_ENV !== "production") {
  const dns = require("dns");
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/config_mongoDB");
const { connectCloudinary } = require("./config/config_cloudinary");

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB();
connectCloudinary();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
