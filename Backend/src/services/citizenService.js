const mongoose = require("mongoose");
const config = require("../config");
const Setting = require("../models/Setting");
const Citizen = require("../models/Citizen");
const PointTransaction = require("../models/PointTransaction");
const Village = require("../models/Village");
const rules = require("./citizenRules");

const PROGRAM_KEY = "citizen_program";
const CACHE_MS = 30 * 1000;
let programCache = null;

async function getProgram() {
  if (programCache && programCache.expiresAt > Date.now()) return programCache.value;
  let raw = null;
  try {
    const row = await Setting.findOne({ key: PROGRAM_KEY }).lean();
    raw = row ? JSON.parse(row.value) : null;
  } catch (err) {
    console.warn("[citizen] cấu hình chương trình lỗi, dùng mặc định:", err.message);
  }
  const value = rules.normalizeProgram(raw);
  programCache = { value, expiresAt: Date.now() + CACHE_MS };
  return value;
}

async function saveProgram(input) {
  const value = rules.normalizeProgram(input);
  await Setting.findOneAndUpdate(
    { key: PROGRAM_KEY },
    { key: PROGRAM_KEY, value: JSON.stringify(value) },
    { upsert: true }
  );
  programCache = { value, expiresAt: Date.now() + CACHE_MS };
  return value;
}

// Điểm của công dân = tổng sổ cái (nguồn sự thật duy nhất).
async function recalc(zaloUserId) {
  const [agg] = await PointTransaction.aggregate([
    { $match: { zaloUserId } },
    { $group: { _id: null, total: { $sum: "$points" } } },
  ]);
  const total = Math.max(0, agg?.total || 0);
  const program = await getProgram();
  const { current } = rules.tierInfo(total, program.tiers);
  await Citizen.updateOne({ zaloUserId }, { $set: { points: total, tierKey: current ? current.key : "" } });
  return { points: total, tierKey: current ? current.key : "" };
}

// Cộng/trừ điểm một lần cho mỗi (người, loại, refId). created=false nếu đã có.
async function award({ zaloUserId, type, refId = "", note = "", points, createdBy = "" }) {
  if (!zaloUserId || !rules.POINT_TYPES.includes(type)) return { created: false };
  const program = await getProgram();
  const value = points !== undefined ? Number(points) : program.rules[type]?.points;
  if (!Number.isFinite(value) || value === 0) return { created: false };

  try {
    await PointTransaction.create({ zaloUserId, type, refId: String(refId), points: value, note, createdBy });
  } catch (err) {
    if (err && err.code === 11000) return { created: false };
    throw err;
  }
  await recalc(zaloUserId);
  return { created: true, points: value };
}

async function newReferralCode() {
  for (let i = 0; i < 8; i++) {
    const code = rules.makeReferralCode();
    if (!(await Citizen.exists({ referralCode: code }))) return code;
  }
  throw new Error("Không tạo được mã giới thiệu");
}

// Đăng ký lần đầu (idempotent): tạo hồ sơ, +điểm đăng ký, gộp điểm đã tích trước đó.
async function ensureCitizen(zaloUserId, profile = {}) {
  const patch = { lastSeenAt: new Date() };
  if (profile.displayName) patch.displayName = String(profile.displayName).slice(0, 120);
  if (profile.avatar) patch.avatar = String(profile.avatar).slice(0, 500);
  if (typeof profile.followedOA === "boolean") patch.followedOA = profile.followedOA;

  let citizen = await Citizen.findOneAndUpdate({ zaloUserId }, { $set: patch }, { new: true });
  let isNew = false;
  if (!citizen) {
    try {
      citizen = await Citizen.create({
        zaloUserId,
        ...patch,
        referralCode: await newReferralCode(),
        registeredAt: new Date(),
      });
      isNew = true;
    } catch (err) {
      if (err && err.code === 11000) {
        citizen = await Citizen.findOne({ zaloUserId });
      } else {
        throw err;
      }
    }
    await award({ zaloUserId, type: "register", note: "Thưởng đăng ký lần đầu" });
    citizen = await Citizen.findOne({ zaloUserId });
  }
  return { citizen, isNew };
}

async function redeemReferral(zaloUserId, rawCode) {
  const code = rules.normalizeReferralCode(rawCode);
  if (code.length !== 6) return { ok: false, error: "Mã giới thiệu không hợp lệ" };

  const me = await Citizen.findOne({ zaloUserId });
  if (!me) return { ok: false, error: "Bạn cần đăng ký tài khoản trước" };
  if (me.referredBy) return { ok: false, error: "Bạn đã nhập mã giới thiệu trước đó" };
  if (me.referralCode === code) return { ok: false, error: "Không thể dùng mã giới thiệu của chính bạn" };

  const referrer = await Citizen.findOne({ referralCode: code });
  if (!referrer) return { ok: false, error: "Mã giới thiệu không tồn tại" };

  // Chốt nguyên tử: mỗi người chỉ được nhập mã một lần.
  const claimed = await Citizen.updateOne(
    { zaloUserId, referredBy: "" },
    { $set: { referredBy: referrer.zaloUserId, referredAt: new Date() } }
  );
  if (!claimed.modifiedCount) return { ok: false, error: "Bạn đã nhập mã giới thiệu trước đó" };

  await award({
    zaloUserId: referrer.zaloUserId,
    type: "referrer",
    refId: zaloUserId,
    note: "Giới thiệu bạn bè thành công",
  });
  const mine = await award({
    zaloUserId,
    type: "referee",
    refId: referrer.zaloUserId,
    note: "Nhập mã giới thiệu",
  });
  return { ok: true, points: mine.points || 0 };
}

async function setVillage(zaloUserId, villageId) {
  let patch;
  if (!villageId) {
    patch = { villageId: null, villageName: "" };
  } else {
    if (!mongoose.isValidObjectId(villageId)) return { ok: false, error: "Thôn không hợp lệ" };
    const v = await Village.findById(villageId).lean();
    if (!v) return { ok: false, error: "Không tìm thấy thôn" };
    patch = { villageId: v._id, villageName: v.ten };
  }
  const res = await Citizen.updateOne({ zaloUserId }, { $set: patch });
  if (!res.matchedCount) return { ok: false, error: "Bạn cần đăng ký tài khoản trước" };
  return { ok: true };
}

// Đổi token getPhoneNumber() của Mini App thành số điện thoại (server-to-server).
async function fetchPhone(accessToken, phoneToken) {
  if (!config.zalo.appSecret) return { ok: false, error: "Chưa cấu hình ZALO_APP_SECRET" };
  if (!accessToken || !phoneToken) return { ok: false, error: "Thiếu token" };
  const res = await fetch("https://graph.zalo.me/v2.0/me/info", {
    headers: { access_token: accessToken, code: phoneToken, secret_key: config.zalo.appSecret },
  });
  const data = await res.json().catch(() => ({}));
  const number = data?.data?.number;
  if (!res.ok || !number || (data.error && data.error !== 0)) {
    return { ok: false, error: data?.message || "Không lấy được số điện thoại" };
  }
  return { ok: true, phone: rules.normalizePhone(number) };
}

async function toView(citizen) {
  const program = await getProgram();
  const info = rules.tierInfo(citizen.points, program.tiers);
  return {
    zaloUserId: citizen.zaloUserId,
    displayName: citizen.displayName,
    avatar: citizen.avatar,
    phone: citizen.phone,
    village: citizen.villageId ? { id: String(citizen.villageId), name: citizen.villageName } : null,
    referralCode: citizen.referralCode,
    referredBy: Boolean(citizen.referredBy),
    points: citizen.points,
    tier: info.current,
    nextTier: info.next,
    progress: info.progress,
    pointsNeeded: info.pointsNeeded,
    followedOA: citizen.followedOA,
    registeredAt: citizen.registeredAt,
  };
}

// Phản ánh được phản hồi (lãnh đạo duyệt hoặc 1022 trả kết quả) → cộng điểm 1 lần.
async function awardFeedbackResolved(feedback) {
  if (!feedback?.userId) return { created: false };
  return award({
    zaloUserId: String(feedback.userId),
    type: "feedback",
    refId: String(feedback._id),
    note: "Phản ánh được tiếp nhận và phản hồi",
  });
}

module.exports = {
  getProgram,
  saveProgram,
  award,
  recalc,
  ensureCitizen,
  redeemReferral,
  setVillage,
  fetchPhone,
  toView,
  awardFeedbackResolved,
};
