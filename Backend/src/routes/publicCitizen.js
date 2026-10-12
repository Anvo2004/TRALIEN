const express = require("express");
const Citizen = require("../models/Citizen");
const PointTransaction = require("../models/PointTransaction");
const config = require("../config");
const { requireZaloUser } = require("../utils/zaloMiniApp");
const { checkRateLimit } = require("../utils/rateLimit");
const svc = require("../services/citizenService");
const { normalizeReferralCode } = require("../services/citizenRules");

const router = express.Router();

// Thể lệ, mức điểm, hạng, quyền lợi — công khai (không cần đăng nhập).
router.get("/program", async (req, res) => {
  const program = await svc.getProgram();
  res.json({ program, oaId: config.zalo.oaId || "" });
});

// Mọi route dưới đây định danh bằng access token Zalo, không tin userId do client gửi.
router.use(requireZaloUser);
router.use(async (req, res, next) => {
  const { allowed } = await checkRateLimit(`citizen:${req.zaloUserId}`, 120, 60 * 60);
  if (!allowed) {
    return res.status(429).json({ error: "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau." });
  }
  next();
});

// Mở tab Công dân: tự đăng ký lần đầu, trả hồ sơ + điểm + hạng.
router.post("/me", async (req, res) => {
  const { displayName, avatar, followedOA, referralCode } = req.body || {};
  const { citizen, isNew } = await svc.ensureCitizen(req.zaloUserId, { displayName, avatar, followedOA });

  let referral = null;
  if (isNew && referralCode) {
    referral = await svc.redeemReferral(req.zaloUserId, referralCode).catch(() => null);
  }
  const fresh = await Citizen.findOne({ zaloUserId: req.zaloUserId });
  res.json({ citizen: await svc.toView(fresh || citizen), isNew, referral });
});

router.put("/me/profile", async (req, res) => {
  const { villageId, followedOA } = req.body || {};
  if (villageId !== undefined) {
    const r = await svc.setVillage(req.zaloUserId, villageId || null);
    if (!r.ok) return res.status(400).json({ error: r.error });
  }
  if (typeof followedOA === "boolean") {
    await Citizen.updateOne({ zaloUserId: req.zaloUserId }, { $set: { followedOA } });
  }
  const c = await Citizen.findOne({ zaloUserId: req.zaloUserId });
  if (!c) return res.status(404).json({ error: "Bạn cần đăng ký tài khoản trước" });
  res.json({ citizen: await svc.toView(c) });
});

// Lấy SĐT tự động: Mini App gửi token từ getPhoneNumber(), server đổi sang số thật.
router.post("/me/phone", async (req, res) => {
  const accessToken = (req.get("x-zalo-access-token") || "").trim();
  const { token } = req.body || {};
  const r = await svc.fetchPhone(accessToken, String(token || ""));
  if (!r.ok) return res.status(400).json({ error: r.error });
  const c = await Citizen.findOneAndUpdate(
    { zaloUserId: req.zaloUserId },
    { $set: { phone: r.phone } },
    { new: true }
  );
  if (!c) return res.status(404).json({ error: "Bạn cần đăng ký tài khoản trước" });
  res.json({ citizen: await svc.toView(c) });
});

router.post("/me/referral", async (req, res) => {
  const code = normalizeReferralCode(req.body?.code);
  const r = await svc.redeemReferral(req.zaloUserId, code);
  if (!r.ok) return res.status(400).json({ error: r.error });
  const c = await Citizen.findOne({ zaloUserId: req.zaloUserId });
  res.json({ ok: true, points: r.points, citizen: await svc.toView(c) });
});

router.get("/me/transactions", async (req, res) => {
  const rows = await PointTransaction.find({ zaloUserId: req.zaloUserId })
    .sort({ createdAt: -1 })
    .limit(100)
    .select("type points note createdAt")
    .lean();
  res.json({ items: rows });
});

module.exports = router;
