const express = require("express");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  getLeaderboard,
  getPerformanceChartData,
} = require("../controllers/task8RankingController");
const { checkTask8Role } = require("../middlewares/task8AuthMiddleware");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  checkTask8Role(["Editorial Board", "Mangaka", "Tantou Editor", "Admin"]),
  getLeaderboard,
);
router.get(
  "/performance/:seriesId",
  checkTask8Role(["Editorial Board", "Mangaka", "Tantou Editor", "Admin"]),
  getPerformanceChartData,
);

module.exports = router;
