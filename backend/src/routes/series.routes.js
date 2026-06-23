const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const { requireRole } = require("../modules/authorization/middlewares/requireRole");
const { requireSeriesScope } = require("../modules/authorization/middlewares/scope");
const createSeries = require("../controllers/series/createSeries");
const getMySeries = require("../controllers/series/getMySeries");
const getSeriesByRole = require("../controllers/series/getSeriesByRole");
const getSeriesById = require("../controllers/series/getSeriesById");
const upsertProposal = require("../controllers/series/upsertProposal");
const submitProposal = require("../controllers/series/submitProposal");
const uploadCover = require("../controllers/series/uploadCover");
const getAtRiskSeries = require("../controllers/series/getAtRiskSeries");
const updateSeriesStatus = require("../controllers/series/updateSeriesStatus");
const lifecycleVote = require("../controllers/series/lifecycleVote");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(requireAuth);

router.post("/", requireRole(ROLES.MANGAKA), createSeries.createSeries);
router.get("/mine", requireRole(ROLES.MANGAKA), getMySeries.getMySeries);
router.get(
  "/mine/:author_id",
  requireRole(ROLES.ADMIN),
  getMySeries.getSeriesByAuthor,
);
router.get(
  "/editor",
  requireRole(ROLES.TANTOU_EDITOR),
  getSeriesByRole.getEditorSeries,
);
router.get(
  "/all",
  requireRole(ROLES.EDITORIAL_BOARD),
  getSeriesByRole.getAllSeries,
);
router.get(
  "/assistant",
  requireRole(ROLES.ASSISTANT),
  getSeriesByRole.getAssistantSeries,
);
router.get(
  "/at-risk",
  requireRole(ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  getAtRiskSeries.getAtRiskSeries,
);
router.patch(
  "/:id/status",
  requireRole(ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  updateSeriesStatus.updateSeriesStatus,
);
router.get(
  "/:id/lifecycle-votes",
  requireRole(ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  lifecycleVote.getLifecycleVotes,
);
router.post(
  "/:id/lifecycle-vote",
  requireRole(ROLES.EDITORIAL_BOARD, ROLES.ADMIN),
  lifecycleVote.castLifecycleVote,
);
router.get(
  "/:id",
  requireRole(ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD),
  requireSeriesScope("id", "read"),
  getSeriesById.getSeriesById,
);
router.put(
  "/:id/proposal",
  requireRole(ROLES.MANGAKA),
  requireSeriesScope("id", "write"),
  upsertProposal.upsertProposal,
);
router.post(
  "/:id/proposal/submit",
  requireRole(ROLES.MANGAKA),
  requireSeriesScope("id", "write"),
  submitProposal.submitProposal,
);
router.post(
  "/:id/proposal/upload-cover",
  requireRole(ROLES.MANGAKA),
  requireSeriesScope("id", "write"),
  upload.single("cover"),
  uploadCover.uploadCover,
);

module.exports = router;
