const express = require("express");
const Village = require("../models/Village");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const WRITE_ROLES = ["superadmin", "dept_leader", "officer"];

router.get("/", async (req, res) => {
  const items = await Village.find().sort({ thuTu: 1, ten: 1 }).lean();
  res.json({ items });
});

router.post("/", requireRole(...WRITE_ROLES), async (req, res) => {
  const { ten, biThu, thonTruong, matTran, soHo, danSo, thuTu } = req.body;

  if (!ten) {
    return res.status(400).json({ error: "Thiếu tên thôn" });
  }

  const village = await Village.create({
    ten,
    biThu,
    thonTruong,
    matTran,
    soHo,
    danSo,
    thuTu,
  });

  res.json({ village });
});

router.put("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  const { ten, biThu, thonTruong, matTran, soHo, danSo, thuTu } = req.body;

  const village = await Village.findByIdAndUpdate(
    req.params.id,
    { ten, biThu, thonTruong, matTran, soHo, danSo, thuTu, updatedAt: new Date() },
    { new: true }
  );
  if (!village) return res.status(404).json({ error: "Not found" });
  res.json({ village });
});

router.delete("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  await Village.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
