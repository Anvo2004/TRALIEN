const ZaloUserActivity = require("../models/ZaloUserActivity");
const { redisGet, redisSet } = require("../utils/redis");

// ============================================================
// Theo dõi khung gửi TIN TƯ VẤN của Zalo cho từng người dùng.
//
// Chính sách Zalo (oa.zalo.me → Tổng quan các loại tin nhắn / Tin Tư vấn):
// tin tư vấn qua OpenAPI chỉ gửi được trong 7 ngày kể từ lần tương tác cuối của
// người dùng; trong 48h đầu miễn phí (một số nguồn ghi giới hạn 8 tin, được đặt
// lại mỗi lần người dùng tương tác), sau 48h tính phí theo bảng giá gói OA.
// "Tương tác" gồm: nhắn tin, nhắn trong nhóm GMF, gọi, bình luận, chatbot, bấm
// menu/CTA, quan tâm OA, bấm nút Nhắn tin, bấm widget.
//
// Nguồn dữ liệu: webhook OA (routes/zaloWebhook.js) — chỉ biết được tương tác
// xảy ra SAU khi webhook bắt đầu nhận sự kiện, nên lưu thêm mốc bắt đầu theo
// dõi (SINCE_KEY) để phân biệt "chưa rõ" với "chắc chắn đã quá 7 ngày".
// ============================================================

const HOUR_MS = 60 * 60 * 1000;
const FREE_WINDOW_MS = 48 * HOUR_MS;
const MAX_WINDOW_MS = 7 * 24 * HOUR_MS;
const FREE_MSG_LIMIT = 8;
const SINCE_KEY = "tralien_zalo_activity_since";

// Sự kiện được Zalo tính là tương tác (user_send_* gồm cả tin nhắn trong nhóm).
const INTERACTION_EVENTS = new Set(["follow", "user_click_chatnow", "user_submit_info"]);

function isInteractionEvent(name = "") {
  return name.startsWith("user_send_") || INTERACTION_EVENTS.has(name);
}

// user_send_* / user_submit_info: sender.id · follow / unfollow: follower.id ·
// user_click_chatnow: user_id. Chỉ gọi cho sự kiện PHÍA NGƯỜI DÙNG — với sự kiện
// oa_send_*, sender.id là chính OA.
function eventUserId(event) {
  return String(event?.sender?.id || event?.follower?.id || event?.user_id || "");
}

// timestamp của webhook Zalo là epoch ms (dạng chuỗi); sai/thiếu/ở tương lai → lấy giờ hiện tại.
function eventTime(event, now = Date.now()) {
  const ts = Number(event?.timestamp);
  return new Date(Number.isFinite(ts) && ts > 0 && ts <= now ? ts : now);
}

let sinceCache = null;

async function getTrackingSince() {
  if (sinceCache) return sinceCache;
  const raw = await redisGet(SINCE_KEY);
  sinceCache = raw ? new Date(raw) : null;
  return sinceCache;
}

async function ensureTrackingSince(at) {
  if (await getTrackingSince()) return;
  await redisSet(SINCE_KEY, at.toISOString());
  sinceCache = at;
}

async function recordInteraction(event) {
  const name = event?.event_name || "";
  if (name !== "unfollow" && !isInteractionEvent(name)) return;
  const userId = eventUserId(event);
  if (!userId) return;

  const at = eventTime(event);
  await ensureTrackingSince(at);

  if (name === "unfollow") {
    await ZaloUserActivity.updateOne(
      { userId },
      { $set: { unfollowedAt: at, lastEvent: name } },
      { upsert: true }
    );
    return;
  }

  // Chỉ ghi đè khi sự kiện MỚI HƠN lần đã lưu (webhook có thể tới không theo thứ
  // tự). Nếu bản ghi đã có mốc mới hơn, filter không khớp → upsert đụng unique
  // userId (E11000) → bỏ qua là đúng.
  try {
    await ZaloUserActivity.updateOne(
      { userId, $or: [{ lastInteractionAt: null }, { lastInteractionAt: { $lt: at } }] },
      { $set: { lastInteractionAt: at, lastEvent: name, msgsSinceInteraction: 0, unfollowedAt: null } },
      { upsert: true }
    );
  } catch (err) {
    if (err.code !== 11000) throw err;
  }
}

// Gọi sau mỗi tin tư vấn gửi THÀNH CÔNG tới 1 người (utils/zaloApi.js → zaloPost).
// Không upsert: chưa từng thấy người này tương tác thì cũng không có gì để đếm.
async function recordMessageSent(userId) {
  if (!userId) return;
  await ZaloUserActivity.updateOne({ userId: String(userId) }, { $inc: { msgsSinceInteraction: 1 } });
}

// free: ≤48h và chưa quá 8 tin · paid: 48h–7 ngày hoặc đã hết 8 tin miễn phí ·
// expired: quá 7 ngày hoặc đã bỏ quan tâm · unknown: chưa ghi nhận tương tác nào
// (chỉ còn "chưa rõ" khi chưa theo dõi đủ 7 ngày — đủ rồi thì chắc chắn đã quá hạn).
function bucketOf(activity, { now = Date.now(), trackingSince = null } = {}) {
  const last = activity?.lastInteractionAt ? new Date(activity.lastInteractionAt).getTime() : null;
  const unfollowed = activity?.unfollowedAt ? new Date(activity.unfollowedAt).getTime() : null;

  if (unfollowed && (!last || unfollowed >= last)) return "expired";
  if (!last) {
    const trackedFullWindow = trackingSince && now - new Date(trackingSince).getTime() >= MAX_WINDOW_MS;
    return trackedFullWindow ? "expired" : "unknown";
  }
  const age = now - last;
  if (age > MAX_WINDOW_MS) return "expired";
  if (age <= FREE_WINDOW_MS && (activity.msgsSinceInteraction || 0) < FREE_MSG_LIMIT) return "free";
  return "paid";
}

// followers: danh sách cache của broadcastService ([{ user_id, display_name, avatar }]).
// Gộp thêm người đã tương tác trong 7 ngày nhưng chưa có trong cache (vd. vừa
// quan tâm OA sau lần đồng bộ follower gần nhất) — chính là nhóm dễ nhận tin nhất.
async function classifyFollowers(followers = []) {
  const now = Date.now();
  const trackingSince = await getTrackingSince();

  const people = new Map();
  for (const f of followers) {
    const id = String(f.user_id || "");
    if (id) people.set(id, { userId: id, displayName: f.display_name || "", avatar: f.avatar || "" });
  }

  const recent = await ZaloUserActivity.find({ lastInteractionAt: { $gte: new Date(now - MAX_WINDOW_MS) } })
    .select("userId")
    .lean();
  for (const r of recent) {
    if (!people.has(r.userId)) people.set(r.userId, { userId: r.userId, displayName: "", avatar: "" });
  }

  const activities = await ZaloUserActivity.find({ userId: { $in: [...people.keys()] } }).lean();
  const byId = new Map(activities.map((a) => [a.userId, a]));

  const list = [...people.values()].map((p) => {
    const a = byId.get(p.userId);
    return {
      ...p,
      lastInteractionAt: a?.lastInteractionAt || null,
      msgsSinceInteraction: a?.msgsSinceInteraction || 0,
      bucket: bucketOf(a, { now, trackingSince }),
    };
  });

  const counts = { free: 0, paid: 0, unknown: 0, expired: 0 };
  for (const p of list) counts[p.bucket] += 1;

  return { people: list, counts, trackingSince };
}

module.exports = {
  recordInteraction,
  recordMessageSent,
  classifyFollowers,
  getTrackingSince,
  bucketOf,
  isInteractionEvent,
  eventUserId,
  eventTime,
  FREE_MSG_LIMIT,
};
