const express = require("express");
const Notice = require("../models/Notice");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const WRITE_ROLES = ["superadmin", "dept_leader", "officer"];

router.get("/", async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 20;
  const skip = (Number(page) - 1) * limit;

  const [items, total] = await Promise.all([
    Notice.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notice.countDocuments(),
  ]);

  res.json({ items, total, page: Number(page), pageSize: limit });
});

router.post("/", requireRole(...WRITE_ROLES), async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Thiếu tiêu đề hoặc nội dung" });
  }
  const notice = await Notice.create({ title, content, createdBy: req.user.id });
  res.json({ notice });
});

router.put("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  const { title, content } = req.body;
  const notice = await Notice.findByIdAndUpdate(req.params.id, { title, content }, { new: true });
  if (!notice) return res.status(404).json({ error: "Not found" });
  res.json({ notice });
});

router.delete("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  await Notice.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
