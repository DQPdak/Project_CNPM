const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const chapterRoutes = require("./routes/chapter.routes");
const pageRoutes = require("./routes/page.routes");
const publishRoutes = require("./routes/publish.routes");
const seriesRoutes = require("./routes/series.routes");
const task8IssueRoutes = require("./routes/task8IssueRoutes");
const task8RankingRoutes = require("./routes/task8RankingRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Manga Management API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/publish", publishRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/task8/issues", task8IssueRoutes);
app.use("/api/task8/rankings", task8RankingRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.status || 500).json({
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "An unexpected error occurred.",
    },
  });
});

module.exports = app;
