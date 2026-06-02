const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createReleaseIssue, importVoteData } = require('../controllers/task8IssueController');
const { checkTask8Role } = require('../middlewares/task8AuthMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Chỉ Hội đồng biên tập (Editorial Board) hoặc Admin mới được tạo kỳ và nhập/import dữ liệu [cite: 155]
router.post('/', checkTask8Role(['Editorial Board', 'Admin']), createReleaseIssue);
router.post('/:issueId/import-votes', checkTask8Role(['Editorial Board', 'Admin']), upload.single('file'), importVoteData);

module.exports = router;