const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");
const BoardVote = require("../../models/BoardVoteModel");

exports.getBoardSeriesDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const series = await Series.findById(id).populate("author_id", "name email role");
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    const proposal = await SeriesProposal.findOne({ series_id: id }).sort({
      createdAt: -1,
    });

    const votes = await BoardVote.find({
      series_id: id,
      vote_context: "initial_review",
    }).populate("board_member_id", "name email");

    return res.status(200).json({ series, proposal, votes });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
