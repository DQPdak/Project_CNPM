const express = require('express');
const router = express.Router();
const { getLeaderboard, getPerformanceChartData } = require('../controllers/task8RankingController');
const { checkTask8Role } = require('../middlewares/task8AuthMiddleware');

// Tất cả các role đều có quyền gọi endpoint xem, quyền hạn chi tiết được bóc tách ở Controller [cite: 162]
router.get('/', checkTask8Role(['Editorial Board', 'Mangaka', 'Editor', 'Admin']), getLeaderboard);
router.get('/performance/:seriesId', checkTask8Role(['Editorial Board', 'Mangaka', 'Editor', 'Admin']), getPerformanceChartData);

module.exports = router;