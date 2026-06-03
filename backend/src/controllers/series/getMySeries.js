const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");

exports.getMySeries = async (req, res) => {
  try {
    const { author_id } = req.params;
    const seriesList = await Series.find({ author_id }).sort({ createdAt: -1 });

    const result = await Promise.all(
      seriesList.map(async (series) => {
        const proposal = await SeriesProposal.findOne({ series_id: series._id }).sort({
          createdAt: -1,
        });
        return { series, proposal };
      }),
    );

    res.status(200).json({ series: result });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
