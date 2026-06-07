const express = require("express");
const { ROLES } = require("../constants/roles");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");
const { requireRole } = require("../modules/authorization/middlewares/requireRole");
const { requireSeriesScope } = require("../modules/authorization/middlewares/scope");
const createSeries = require("../controllers/series/createSeries");
const getMySeries = require("../controllers/series/getMySeries");
const getSeriesById = require("../controllers/series/getSeriesById");
const upsertProposal = require("../controllers/series/upsertProposal");

const router = express.Router();

router.use(requireAuth);

router.post("/", requireRole(ROLES.MANGAKA), createSeries.createSeries);
router.get("/mine", requireRole(ROLES.MANGAKA), getMySeries.getMySeries);
router.get("/mine/:author_id", requireRole(ROLES.MANGAKA), getMySeries.getMySeries);
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

module.exports = router;
