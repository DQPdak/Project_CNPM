const express = require("express");
const router = express.Router();

const createSeries = require("../controllers/series/createSeries");
const getMySeries = require("../controllers/series/getMySeries");
const getSeriesById = require("../controllers/series/getSeriesById");
const upsertProposal = require("../controllers/series/upsertProposal");

router.post("/", createSeries.createSeries);
router.get("/mine/:author_id", getMySeries.getMySeries);
router.get("/:id", getSeriesById.getSeriesById);
router.put("/:id/proposal", upsertProposal.upsertProposal);

module.exports = router;
