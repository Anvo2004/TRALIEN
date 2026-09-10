const express = require("express");
const TroCapSchedule = require("../models/TroCapSchedule");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const WRITE_ROLES = ["superadmin", "dept_leader", "officer"];

router.get("/", async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 20;
  const skip = (Number(page) - 1) * limit;

  const [items, total] = await Promise.all([
    TroCapSchedule.find().sort({ ngayChiTra: -1 }).skip(skip).limit(limit).lean(),
    TroCapSchedule.countDocuments(),
  ]);

  res.json({ items, total, page: Number(page), pageSize: limit });
});

router.post("/", requireRole(...WRITE_ROLES), async (req, res) => {
  const {
    ngayChiTra,
    khungGio,
    diaDiem,
    nhanVienTen,
    nhanVienSdt,
    ghiChu,
    loaiTroCap,
    soLuong,
    donVi,
    soTien,
    hinhThuc,
  } = req.body;

  if (!ngayChiTra || !diaDiem) {
    return res.status(400).json({ error: "Thiếu ngày chi trả hoặc địa điểm" });
  }

  const schedule = await TroCapSchedule.create({
    ngayChiTra: new Date(ngayChiTra),
    khungGio,
    diaDiem,
    nhanVienTen,
    nhanVienSdt,
    ghiChu,
    loaiTroCap,
    soLuong,
    donVi,
    soTien,
    hinhThuc,
    createdBy: req.user.id,
  });

  res.json({ schedule });
});

router.put("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  const {
    ngayChiTra,
    khungGio,
    diaDiem,
    nhanVienTen,
    nhanVienSdt,
    ghiChu,
    loaiTroCap,
    soLuong,
    donVi,
    soTien,
    hinhThuc,
  } = req.body;

  const schedule = await TroCapSchedule.findByIdAndUpdate(
    req.params.id,
    {
      ngayChiTra: ngayChiTra ? new Date(ngayChiTra) : undefined,
      khungGio,
      diaDiem,
      nhanVienTen,
      nhanVienSdt,
      ghiChu,
      loaiTroCap,
      soLuong,
      donVi,
      soTien,
      hinhThuc,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!schedule) return res.status(404).json({ error: "Not found" });
  res.json({ schedule });
});

router.delete("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  await TroCapSchedule.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
