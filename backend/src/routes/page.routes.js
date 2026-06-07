const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const { requireRole } = require("../modules/authorization/middlewares/requireRole");
const {
  requireChapterScope,
  requirePageScope,
} = require("../modules/authorization/middlewares/scope");
const uploadPages = require("../controllers/page/uploadPages");
const updatePageVersion = require("../controllers/page/updatePageVersion");
const approvePage = require("../controllers/page/approvedPage");
const getPagesByChapter = require("../controllers/page/getPagesByChapter");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/chapter/:chapter_id",
  requireRole(ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD),
  requireChapterScope("chapter_id", "read"),
  getPagesByChapter.getPagesByChapter,
);
router.post(
  "/upload/:chapter_id/upload",
  requireRole(ROLES.MANGAKA, ROLES.TANTOU_EDITOR),
  requireChapterScope("chapter_id", "write"),
  upload.array("pages", 50),
  uploadPages.uploadPages,
);
router.put(
  "/update/:page_id",
  requireRole(ROLES.MANGAKA, ROLES.TANTOU_EDITOR),
  requirePageScope("page_id", "write"),
  upload.single("page"),
  updatePageVersion.updatePageVersion,
);
router.put(
  "/approve/:page_id",
  requireRole(ROLES.MANGAKA, ROLES.TANTOU_EDITOR),
  requirePageScope("page_id", "write"),
  approvePage.approvePage,
);

module.exports = router;
