const express = require("express");
const ThuTucHanhChinh = require("../models/ThuTucHanhChinh");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const WRITE_ROLES = ["superadmin", "dept_leader", "officer"];

router.get("/", async (req, res) => {
  const { page = 1, q = "" } = req.query;
  const limit = 20;
  const skip = (Number(page) - 1) * limit;

  const filter = {};
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ tenThuTuc: regex }, { linhVuc: regex }];
  }

  const [items, total] = await Promise.all([
    ThuTucHanhChinh.find(filter).sort({ order: 1, tenThuTuc: 1 }).skip(skip).limit(limit).lean(),
    ThuTucHanhChinh.countDocuments(filter),
  ]);

  res.json({ items, total, page: Number(page), pageSize: limit });
});

router.post("/", requireRole(...WRITE_ROLES), async (req, res) => {
  const { tenThuTuc, linhVuc, mucDo, thoiGianXuLy, giayToCanNop, linkNopTrucTuyen, ghiChu, order } =
    req.body;

  if (!tenThuTuc) {
    return res.status(400).json({ error: "Thiếu tên thủ tục" });
  }

  const item = await ThuTucHanhChinh.create({
    tenThuTuc,
    linhVuc,
    mucDo,
    thoiGianXuLy,
    giayToCanNop,
    linkNopTrucTuyen,
    ghiChu,
    order: Number(order) || 0,
    createdBy: req.user.id,
  });

  res.json({ item });
});

router.put("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  const { tenThuTuc, linhVuc, mucDo, thoiGianXuLy, giayToCanNop, linkNopTrucTuyen, ghiChu, order } =
    req.body;

  const item = await ThuTucHanhChinh.findByIdAndUpdate(
    req.params.id,
    {
      tenThuTuc,
      linhVuc,
      mucDo,
      thoiGianXuLy,
      giayToCanNop,
      linkNopTrucTuyen,
      ghiChu,
      order: order != null ? Number(order) : undefined,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json({ item });
});

router.delete("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  await ThuTucHanhChinh.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
