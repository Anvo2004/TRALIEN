const express = require("express");
const LichYTe = require("../models/LichYTe");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const WRITE_ROLES = ["superadmin", "dept_leader", "officer"];

router.get("/", async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 20;
  const skip = (Number(page) - 1) * limit;

  const [items, total] = await Promise.all([
    LichYTe.find().sort({ ngayKham: -1 }).skip(skip).limit(limit).lean(),
    LichYTe.countDocuments(),
  ]);

  res.json({ items, total, page: Number(page), pageSize: limit });
});

router.post("/", requireRole(...WRITE_ROLES), async (req, res) => {
  const { ngayKham, khungGio, diaDiem, loaiHinh, donViThucHien, doiTuong, ghiChu } = req.body;

  if (!ngayKham || !diaDiem) {
    return res.status(400).json({ error: "Thiếu ngày khám hoặc địa điểm" });
  }

  const schedule = await LichYTe.create({
    ngayKham: new Date(ngayKham),
    khungGio,
    diaDiem,
    loaiHinh,
    donViThucHien,
    doiTuong,
    ghiChu,
    createdBy: req.user.id,
  });

  res.json({ schedule });
});

router.put("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  const { ngayKham, khungGio, diaDiem, loaiHinh, donViThucHien, doiTuong, ghiChu } = req.body;

  const schedule = await LichYTe.findByIdAndUpdate(
    req.params.id,
    {
      ngayKham: ngayKham ? new Date(ngayKham) : undefined,
      khungGio,
      diaDiem,
      loaiHinh,
      donViThucHien,
      doiTuong,
      ghiChu,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!schedule) return res.status(404).json({ error: "Not found" });
  res.json({ schedule });
});

router.delete("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  await LichYTe.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
