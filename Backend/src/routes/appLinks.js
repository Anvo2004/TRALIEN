const express = require("express");
const AppLink = require("../models/AppLink");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const WRITE_ROLES = ["superadmin", "dept_leader", "officer"];
const SECTIONS = ["quick_link", "service", "portal"];

router.get("/", async (req, res) => {
  const { section } = req.query;
  const filter = {};
  if (section) {
    if (!SECTIONS.includes(section)) {
      return res.status(400).json({ error: "section không hợp lệ" });
    }
    filter.section = section;
  }
  const items = await AppLink.find(filter).sort({ section: 1, order: 1, label: 1 }).lean();
  res.json({ items });
});

router.post("/", requireRole(...WRITE_ROLES), async (req, res) => {
  const { section, icon, color, label, type, description, badge, path, href, order } = req.body;

  if (!label) {
    return res.status(400).json({ error: "Thiếu tên hiển thị" });
  }
  if (!SECTIONS.includes(section)) {
    return res.status(400).json({ error: "section không hợp lệ" });
  }

  const item = await AppLink.create({
    section,
    icon,
    color,
    label,
    type: type || "",
    description,
    badge,
    path,
    href,
    order: Number(order) || 0,
    createdBy: req.user.id,
  });

  res.json({ item });
});

router.put("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  const { section, icon, color, label, type, description, badge, path, href, order } = req.body;

  if (section && !SECTIONS.includes(section)) {
    return res.status(400).json({ error: "section không hợp lệ" });
  }

  const item = await AppLink.findByIdAndUpdate(
    req.params.id,
    {
      ...(section ? { section } : {}),
      icon,
      color,
      label,
      type: type || "",
      description,
      badge,
      path,
      href,
      order: order != null ? Number(order) : undefined,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json({ item });
});

router.delete("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  await AppLink.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
