const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");
const { ROLES } = require("../../constants/roles");

exports.getMySeries = async (req, res) => {
  try {
    const { author_id } = req.params;
    const resolvedAuthorId =
      req.user.role === ROLES.ADMIN ? author_id || req.user.id : req.user.id;

    const seriesList = await Series.find({ author_id: resolvedAuthorId }).sort({
      createdAt: -1,
    });

    const result = await Promise.all(
      seriesList.map(async (series) => {
        const proposal = await SeriesProposal.findOne({ series_id: series._id }).sort({
          createdAt: -1,
        });
        return { series, proposal };
      }),
    );

    return res.status(200).json({ series: result });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
