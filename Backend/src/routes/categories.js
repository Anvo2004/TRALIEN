const express = require("express");
const Category = require("../models/Category");
const ZaloGroupMember = require("../models/ZaloGroupMember");
const { requireRole } = require("../middleware/auth");
const { createZaloGroup } = require("../utils/zaloApi");

const router = express.Router();

router.get("/", async (req, res) => {
  const categories = await Category.find().sort({ order: 1 });
  res.json({ categories });
});

router.post("/", requireRole("superadmin"), async (req, res) => {
  const { name, icon, zaloGroupId, order } = req.body;
  if (!name) return res.status(400).json({ error: "Thiếu tên lĩnh vực" });
  const category = await Category.create({ name, icon, zaloGroupId, order });
  res.json({ category });
});

router.post("/create-zalo-group", requireRole("superadmin"), async (req, res) => {
  try {
    const { name, icon, order, members } = req.body;
    if (!name || !members || members.length === 0) {
      return res.status(400).json({ error: "Thiếu name hoặc danh sách members" });
    }

    // 1. Gọi Zalo API
    const memberIds = members.map((m) => m.userId);
    const zaloGroupId = await createZaloGroup(name, memberIds);

    // 2. Tạo Category
    const cat = await Category.create({ name, zaloGroupId, icon, order: order ?? 0 });

    // 3. Thêm thành viên vào ZaloGroupMember
    for (const m of members) {
      await ZaloGroupMember.create({
        zaloUserId: String(m.userId),
        displayName: m.displayName || "Người dùng Zalo",
        avatar: m.avatar || "",
        categoryId: cat._id,
        groupId: zaloGroupId,
      }).catch((e) => console.error("[ZaloGroupMember] Lỗi insert:", e.message));
    }

    res.status(201).json({ category: cat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", requireRole("superadmin"), async (req, res) => {
  const { name, icon, zaloGroupId, order } = req.body;
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, icon, zaloGroupId, order },
    { new: true }
  );
  if (!category) return res.status(404).json({ error: "Not found" });
  res.json({ category });
});

router.delete("/:id", requireRole("superadmin"), async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  await ZaloGroupMember.deleteMany({ categoryId: req.params.id });
  res.json({ ok: true });
});

module.exports = router;
