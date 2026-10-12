const express = require("express");
const Citizen = require("../models/Citizen");
const PointTransaction = require("../models/PointTransaction");
const { requireRole } = require("../middleware/auth");
const svc = require("../services/citizenService");

const router = express.Router();

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/program", async (req, res) => {
  res.json({ program: await svc.getProgram() });
});

router.put("/program", requireRole("superadmin"), async (req, res) => {
  const program = await svc.saveProgram(req.body?.program);
  // Ngưỡng hạng có thể đổi: tính lại điểm/hạng lưu sẵn cho mọi công dân.
  const citizens = await Citizen.find().select("zaloUserId").lean();
  for (const c of citizens) await svc.recalc(c.zaloUserId);
  res.json({ program });
});

router.get("/stats", async (req, res) => {
  const [total, byTier, pointsAgg] = await Promise.all([
    Citizen.countDocuments(),
    Citizen.aggregate([{ $group: { _id: "$tierKey", count: { $sum: 1 } } }]),
    Citizen.aggregate([{ $group: { _id: null, points: { $sum: "$points" } } }]),
  ]);
  res.json({
    total,
    totalPoints: pointsAgg[0]?.points || 0,
    byTier: Object.fromEntries(byTier.map((t) => [t._id || "none", t.count])),
  });
});

router.get("/", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const filter = {};
  const q = String(req.query.q || "").trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ displayName: rx }, { phone: rx }, { referralCode: rx }, { zaloUserId: rx }];
  }
  if (req.query.tier) filter.tierKey = String(req.query.tier);

  const [items, total] = await Promise.all([
    Citizen.find(filter)
      .sort({ points: -1, registeredAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Citizen.countDocuments(filter),
  ]);
  res.json({ items, total, page, limit });
});

router.get("/:zaloUserId", async (req, res) => {
  const citizen = await Citizen.findOne({ zaloUserId: req.params.zaloUserId }).lean();
  if (!citizen) return res.status(404).json({ error: "Không tìm thấy công dân" });
  const transactions = await PointTransaction.find({ zaloUserId: citizen.zaloUserId })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json({ citizen, transactions });
});

// Điều chỉnh điểm thủ công (cộng/trừ) kèm lý do — lưu vết trong sổ cái.
router.post("/:zaloUserId/adjust", requireRole("superadmin"), async (req, res) => {
  const points = Math.round(Number(req.body?.points));
  const note = String(req.body?.note || "").trim();
  if (!Number.isFinite(points) || points === 0 || Math.abs(points) > 1000) {
    return res.status(400).json({ error: "Số điểm không hợp lệ (khác 0, tối đa ±1000)" });
  }
  if (note.length < 3) return res.status(400).json({ error: "Cần nhập lý do điều chỉnh" });
  const citizen = await Citizen.findOne({ zaloUserId: req.params.zaloUserId });
  if (!citizen) return res.status(404).json({ error: "Không tìm thấy công dân" });

  await svc.award({
    zaloUserId: citizen.zaloUserId,
    type: "adjust",
    refId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    points,
    note,
    createdBy: req.user?.fullName || req.user?.username || "",
  });
  const fresh = await Citizen.findOne({ zaloUserId: citizen.zaloUserId }).lean();
  res.json({ citizen: fresh });
});

module.exports = router;
