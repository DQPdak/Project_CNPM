const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");
const BoardVote = require("../../models/BoardVoteModel");

const SCHEDULE_VALUES = ["weekly", "monthly", "one-shot", "online only"];

exports.finalizeSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_schedule } = req.body;

    const series = await Series.findById(id);
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    const proposal = await SeriesProposal.findOne({ series_id: id }).sort({
      createdAt: -1,
    });

    if (!proposal) {
      return res.status(404).json({ message: "Không tìm thấy proposal" });
    }

    const votes = await BoardVote.find({
      series_id: id,
      vote_context: "initial_review",
    }).sort({ createdAt: 1 });

    if (votes.length === 0) {
      return res.status(400).json({ message: "Chưa có phiếu bầu nào" });
    }

    const tally = { Approve: 0, Reject: 0, "Need Revision": 0 };
    votes.forEach((v) => {
      if (tally[v.vote] !== undefined) {
        tally[v.vote] += 1;
      }
    });

    let decision;
    if (tally.Approve > tally.Reject && tally.Approve > tally["Need Revision"]) {
      decision = "Approve";
    } else if (tally.Reject >= tally.Approve && tally.Reject >= tally["Need Revision"]) {
      decision = "Reject";
    } else {
      decision = "Need Revision";
    }

    if (decision === "Approve") {
      if (!approved_schedule || !SCHEDULE_VALUES.includes(approved_schedule)) {
        return res.status(400).json({
          message: `Approve cần approved_schedule: ${SCHEDULE_VALUES.join(", ")}`,
        });
      }
      proposal.status = "Approved";
      series.status = "Active";
      series.approved_schedule = approved_schedule;
    } else if (decision === "Reject") {
      proposal.status = "Rejected";
      series.status = "Draft";
    } else if (decision === "Need Revision") {
      proposal.status = "Need Revision";
    } else {
      return res.status(400).json({ message: "Quyết định vote không hợp lệ" });
    }

    await proposal.save();
    await series.save();

    return res.status(200).json({
      message: "Tổng hợp kết quả duyệt thành công",
      decision,
      tally,
      series,
      proposal,
      votes,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
