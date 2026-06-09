const SeriesProposal = require("../../models/SeriesProposalModel");

const SUBMITTABLE_STATUSES = ["Draft", "Need Revision"];

exports.submitProposal = async (req, res) => {
  try {
    const series = req.authz?.series;
    if (!series) {
      return res.status(404).json({ message: "Không tìm thấy series" });
    }

    const proposal = await SeriesProposal.findOne({ series_id: series._id }).sort({
      createdAt: -1,
    });

    if (!proposal) {
      return res.status(400).json({ message: "Chưa có proposal để nộp" });
    }

    if (!SUBMITTABLE_STATUSES.includes(proposal.status)) {
      return res.status(400).json({
        message: `Không thể nộp proposal ở trạng thái ${proposal.status}`,
      });
    }

    proposal.status = "Submitted";
    proposal.submitted_at = new Date();
    await proposal.save();

    return res.status(200).json({
      message: "Nộp hồ sơ xét duyệt thành công",
      proposal,
    });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
