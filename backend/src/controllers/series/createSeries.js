const Series = require("../../models/SeriesModel");
const SeriesProposal = require("../../models/SeriesProposalModel");

exports.createSeries = async (req, res) => {
  try {
    const { title, description, genre, target_audience, author_id, summary, characters, art_style } =
      req.body;

    if (!title || !author_id) {
      return res.status(400).json({ message: "title và author_id là bắt buộc" });
    }

    const series = await Series.create({
      title,
      description,
      genre,
      target_audience,
      author_id,
      status: "Draft",
    });

    if (summary) {
      await SeriesProposal.create({
        series_id: series._id,
        summary,
        characters,
        art_style,
        status: "Draft",
      });
    }

    const proposal = await SeriesProposal.findOne({ series_id: series._id }).sort({
      createdAt: -1,
    });

    res.status(201).json({
      message: "Tạo series thành công",
      series,
      proposal,
    });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
