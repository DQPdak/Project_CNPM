const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");

exports.getPendingSeries = async (req, res) => {
  try {
    const proposals = await SeriesProposal.find({
      status: { $in: ["Submitted", "Under Review"] },
    }).sort({ submitted_at: -1 });

    const result = await Promise.all(
      proposals.map(async (proposal) => {
        const series = await Series.findById(proposal.series_id).populate(
          "author_id",
          "name email",
        );
        return { series, proposal };
      }),
    );

    return res.status(200).json({ pending: result, count: result.length });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
