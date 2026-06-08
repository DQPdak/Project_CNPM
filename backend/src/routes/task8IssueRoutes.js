const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  createReleaseIssue,
  importVoteData,
} = require("../controllers/task8IssueController");
const { checkTask8Role } = require("../middlewares/task8AuthMiddleware");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(requireAuth);

router.post("/", checkTask8Role(["Editorial Board", "Admin"]), createReleaseIssue);
router.post(
  "/:issueId/import-votes",
  checkTask8Role(["Editorial Board", "Admin"]),
  upload.single("file"),
  importVoteData,
);

module.exports = router;
