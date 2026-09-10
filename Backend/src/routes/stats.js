const express = require("express");
const Feedback = require("../models/Feedback");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [total, pending, draft, resolved] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ status: "pending" }),
      Feedback.countDocuments({ status: "draft" }),
      Feedback.countDocuments({ status: "resolved" }),
    ]);

    const recent = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignedTo", "fullName")
      .lean();

    const days = [],
      counts = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const count = await Feedback.countDocuments({
        createdAt: { $gte: start, $lt: end },
      });
      days.push(`${start.getDate()}/${start.getMonth() + 1}`);
      counts.push(count);
    }

    res.json({
      stats: { total, pending, processing: draft, done: resolved },
      recent,
      chartDays: days,
      chartCounts: counts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
