const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const {
  requireRole,
} = require("../modules/authorization/middlewares/requireRole");
const {
  requireChapterScope,
  requireSeriesScope,
} = require("../modules/authorization/middlewares/scope");
const createChapter = require("../controllers/chapter/createChapter");
const getChapterById = require("../controllers/chapter/getChapterById");
const getChaptersBySeries = require("../controllers/chapter/getChaptersBySeries");
const updateChapterStatus = require("../controllers/chapter/updateChapterStatus");

const router = express.Router();

router.use(requireAuth);

router.put(
  "/update-status/:chapter_id",
  requireRole(ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.ADMIN),
  requireChapterScope("chapter_id", "write"),
  updateChapterStatus.updateChapterStatus,
);

router.post(
  "/create",
  requireRole(ROLES.MANGAKA, ROLES.ADMIN),
  createChapter.Chapter,
);

router.get(
  "/series/:series_id",
  requireRole(
    ROLES.MANGAKA,
    ROLES.ASSISTANT,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
  ),
  requireSeriesScope("series_id", "read"),
  getChaptersBySeries.getChaptersBySeries,
);

router.get(
  "/:chapter_id",
  requireRole(
    ROLES.MANGAKA,
    ROLES.ASSISTANT,
    ROLES.TANTOU_EDITOR,
    ROLES.EDITORIAL_BOARD,
    ROLES.ADMIN,
  ),
  requireChapterScope("chapter_id", "read"),
  getChapterById.getChapterById,
);

module.exports = router;
