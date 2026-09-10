const express = require("express");
const Feedback = require("../models/Feedback");
const AdminUser = require("../models/AdminUser");
const Category = require("../models/Category");
const { requireRole } = require("../middleware/auth");
const { sendZaloText } = require("../utils/zaloApi");
const { feedbackCode } = require("../services/feedbackNotifyService");

const router = express.Router();

const LEADER_ROLES = ["superadmin", "dept_leader"];
const OFFICER_ROLES = ["officer", "staff"];

router.get("/", async (req, res) => {
  const { status, assignedTo, categoryId, q, page = 1 } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (categoryId) filter.categoryId = categoryId;

  if (OFFICER_ROLES.includes(req.user.role)) {
    filter.assignedTo = req.user.id;
  } else if (req.user.role === "dept_leader") {
    filter.categoryId = { $in: req.user.categoryIds || [] };
  }
  if (assignedTo && LEADER_ROLES.includes(req.user.role)) {
    filter.assignedTo = assignedTo;
  }

  if (q) {
    filter.$or = [
      { displayName: new RegExp(q, "i") },
      { contact: new RegExp(q, "i") },
      { content: new RegExp(q, "i") },
    ];
  }

  const limit = 20;
  const skip = (Number(page) - 1) * limit;

  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .populate("categoryId", "name icon")
      .populate("assignedTo", "fullName username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Feedback.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({ feedbacks: items, pagination: { page: Number(page), totalPages, total } });
});

router.get("/:id", async (req, res) => {
  const feedback = await Feedback.findById(req.params.id)
    .populate("categoryId")
    .populate("assignedTo", "fullName username")
    .populate("assignedBy", "fullName username")
    .populate("draftBy", "fullName username")
    .populate("approvedBy", "fullName username");

  if (!feedback) return res.status(404).json({ error: "Not found" });

  const [admins, categories] = await Promise.all([
    AdminUser.find().select("fullName username role categoryIds"),
    Category.find().sort({ order: 1 }),
  ]);

  res.json({ feedback, admins, categories });
});

router.put("/:id", async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { note: req.body.note || "" },
    { new: true }
  );
  if (!feedback) return res.status(404).json({ error: "Not found" });
  res.json({ feedback });
});

router.delete("/:id", requireRole("superadmin"), async (req, res) => {
  await Feedback.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.post("/:id/assign", requireRole(...LEADER_ROLES), async (req, res) => {
  const { assignedTo, note } = req.body;
  if (!assignedTo) return res.status(400).json({ error: "Thiếu cán bộ phụ trách" });

  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    {
      assignedTo,
      assignedBy: req.user.id,
      assignAttachments: { note: note || "", sentBy: req.user.id, sentAt: new Date() },
    },
    { new: true }
  );
  if (!feedback) return res.status(404).json({ error: "Not found" });

  const officer = await AdminUser.findById(assignedTo);
  if (officer?.zaloUserId) {
    sendZaloText(
      officer.zaloUserId,
      `📋 Bạn được giao xử lý phản ánh #${feedbackCode(feedback)}\n${feedback.content}${
        note ? `\nGhi chú: ${note}` : ""
      }`
    ).catch((err) => console.error("[feedbacks] assign notify failed:", err.message));
  }

  res.json({ feedback });
});

router.post("/:id/draft", requireRole(...OFFICER_ROLES, ...LEADER_ROLES), async (req, res) => {
  const { draftResponse, note } = req.body;
  if (!draftResponse) return res.status(400).json({ error: "Thiếu nội dung trả lời" });

  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ error: "Not found" });
  if (feedback.status === "resolved") {
    return res.status(400).json({ error: "Phản ánh đã được giải quyết" });
  }

  feedback.draftResponse = draftResponse;
  feedback.draftAttachments = { note: note || "", sentBy: req.user.id, sentAt: new Date() };
  feedback.draftBy = req.user.id;
  feedback.draftAt = new Date();
  feedback.status = "draft";
  await feedback.save();

  res.json({ feedback });
});

router.post("/:id/approve", requireRole(...LEADER_ROLES), async (req, res) => {
  const { finalResponse } = req.body;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ error: "Not found" });

  feedback.finalResponse = finalResponse || feedback.draftResponse;
  feedback.approvedBy = req.user.id;
  feedback.status = "resolved";
  feedback.sentAt = new Date();
  await feedback.save();

  sendZaloText(
    feedback.userId,
    `✅ Phản ánh #${feedbackCode(feedback)} của bạn đã được xử lý:\n${
      feedback.finalResponse
    }`
  ).catch((err) => console.error("[feedbacks] approve notify failed:", err.message));

  res.json({ feedback });
});

router.post("/:id/reject", requireRole(...LEADER_ROLES), async (req, res) => {
  const { rejectedReason } = req.body;
  if (!rejectedReason) return res.status(400).json({ error: "Thiếu lý do từ chối" });

  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { status: "pending", rejectedReason },
    { new: true }
  );
  if (!feedback) return res.status(404).json({ error: "Not found" });

  res.json({ feedback });
});

module.exports = router;
