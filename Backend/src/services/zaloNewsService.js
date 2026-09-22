const config = require("../config");
const News = require("../models/News");
const { createArticle, verifyArticle, getArticleDetail, broadcastArticle } = require("../utils/zaloArticle");
const { redisGet, redisSet } = require("../utils/redis");

// ============================================================
// Tự động đăng tin đã cào (model News) lên Zalo OA dạng "Bài viết", rồi
// broadcast (gửi) bài đó tới TOÀN BỘ người quan tâm OA.
// - Tạo bài (create + verify): xem postPendingArticles(). Luôn chạy nếu
//   ZALO_ARTICLE_ENABLED=true, độc lập với broadcast.
// - Broadcast: xem broadcastPendingArticles(), CHỈ chạy nếu
//   ZALO_BROADCAST_ENABLED=true. Gộp tối đa 5 bài/lượt gửi (giới hạn của
//   Zalo), và tự giãn cách >= MIN_BROADCAST_GAP_MS giữa 2 lượt gửi (Zalo yêu
//   cầu tối thiểu 30 phút/lượt — dùng 35 phút cho có biên an toàn).
// - Bỏ qua tin cũ: backfill đặt zalo.skip=true (xem scripts/backfill-news-zalo-skip.js),
//   nên chỉ tin cào được SAU khi bật mới được đăng/gửi.
// - Dùng chung token OA (utils/zaloArticle → zaloToken) — KHÔNG tạo token
//   store riêng, tránh 2 nơi refresh đá nhau làm hỏng token production (đã
//   từng xảy ra 2026-09-22, xem lịch sử trao đổi).
// ============================================================

const POST_INTERVAL_MS = 20 * 60 * 1000; // quét mỗi 20 phút
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 5; // mỗi lượt tối đa 5 bài, tuần tự (tránh dồn dập lên OA)
const BROADCAST_BATCH_SIZE = 5; // giới hạn cứng của Zalo: tối đa 5 bài/lượt broadcast
const MIN_BROADCAST_GAP_MS = 35 * 60 * 1000; // Zalo yêu cầu >= 30 phút/lượt, chừa biên an toàn
const LAST_BROADCAST_KEY = "tralien_zalo_last_broadcast_at";

function toArticleItem(news) {
  const summary = news.summary || news.title;
  return {
    title: news.title,
    author: news.source || "UBND xã Trà Liên",
    description: summary,
    coverPhotoUrl: news.imageUrl || config.zaloArticle.defaultCover || "",
    bodyText: `${summary}${news.link ? `\n\nNguồn: ${news.link}` : ""}`,
  };
}

async function postOne(news) {
  const item = toArticleItem(news);
  if (!item.coverPhotoUrl) {
    // Không có ảnh và chưa cấu hình cover mặc định → không đăng được (Zalo bắt buộc cover).
    await News.updateOne(
      { _id: news._id },
      { $inc: { "zalo.attempts": 1 }, $set: { "zalo.lastError": "Thiếu ảnh cover" } }
    );
    return { ok: false, error: "Thiếu ảnh cover" };
  }
  try {
    const token = await createArticle(item);
    const articleId = await verifyArticle(token);
    // link_view để "thẻ tin" (newsCardService.js) mở thẳng bài OA — lỗi thì bỏ
    // qua, lúc gửi thẻ sẽ tự lấy lại.
    let linkView = "";
    try {
      linkView = (await getArticleDetail(articleId)).link_view || "";
    } catch (err) {
      console.warn(`[ZaloArticle] Chưa lấy được link_view bài ${articleId}: ${err.message}`);
    }
    await News.updateOne(
      { _id: news._id },
      {
        $set: {
          "zalo.articleId": articleId,
          "zalo.linkView": linkView,
          "zalo.postedAt": new Date(),
          "zalo.lastError": "",
        },
      }
    );
    console.log(`[ZaloArticle] Đã tạo bài OA cho tin nid=${news.nid} (id=${articleId}): ${item.title.slice(0, 50)}`);
    return { ok: true, newsId: news._id, articleId };
  } catch (err) {
    await News.updateOne(
      { _id: news._id },
      { $inc: { "zalo.attempts": 1 }, $set: { "zalo.lastError": err.message || "unknown" } }
    );
    console.warn(`[ZaloArticle] Đăng tin nid=${news.nid} thất bại: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

// Đăng các tin chưa có bài OA (chưa đăng, không bị skip, chưa quá số lần thử).
async function postPendingArticles() {
  if (!config.zaloArticle.enabled) return;
  const pending = await News.find({
    "zalo.articleId": "",
    "zalo.skip": { $ne: true },
    "zalo.attempts": { $lt: MAX_ATTEMPTS },
  })
    .sort({ nid: 1 }) // đăng theo thứ tự tin cũ→mới trong nhóm chờ
    .limit(BATCH_SIZE)
    .lean();

  if (pending.length === 0) return;
  console.log(`[ZaloArticle] ${pending.length} tin chờ đăng lên OA`);
  for (const news of pending) {
    await postOne(news);
  }
}

// Gửi (broadcast) các bài đã tạo (có articleId) nhưng chưa gửi tới toàn bộ
// follower — gộp tối đa BROADCAST_BATCH_SIZE bài/lượt, tự giãn cách theo
// MIN_BROADCAST_GAP_MS (đọc/ghi mốc thời gian qua Setting, DÙNG CHUNG giữa
// mọi tiến trình — quan trọng vì VPS có thể chạy nhiều instance).
async function broadcastPendingArticles() {
  if (!config.zaloArticle.broadcastEnabled) return;

  const pending = await News.find({
    "zalo.articleId": { $ne: "" },
    "zalo.broadcastedAt": null,
    "zalo.skip": { $ne: true },
  })
    .sort({ nid: 1 })
    .limit(BROADCAST_BATCH_SIZE)
    .lean();

  if (pending.length === 0) return;

  const lastAtRaw = await redisGet(LAST_BROADCAST_KEY);
  const lastAt = Number(lastAtRaw) || 0;
  const elapsed = Date.now() - lastAt;
  if (elapsed < MIN_BROADCAST_GAP_MS) {
    const waitMin = Math.ceil((MIN_BROADCAST_GAP_MS - elapsed) / 60000);
    console.log(`[ZaloArticle] ${pending.length} bài chờ broadcast, còn ${waitMin} phút nữa mới đủ giãn cách`);
    return;
  }

  const articleIds = pending.map((n) => n.zalo.articleId);
  try {
    const messageId = await broadcastArticle(articleIds);
    await redisSet(LAST_BROADCAST_KEY, String(Date.now()));
    await News.updateMany(
      { _id: { $in: pending.map((n) => n._id) } },
      { $set: { "zalo.broadcastedAt": new Date(), "zalo.broadcastError": "" } }
    );
    console.log(
      `[ZaloArticle] Đã broadcast ${articleIds.length} bài tới toàn bộ follower (message_id=${messageId})`
    );
  } catch (err) {
    await redisSet(LAST_BROADCAST_KEY, String(Date.now())); // vẫn tính vào giãn cách dù lỗi, tránh spam API
    await News.updateMany(
      { _id: { $in: pending.map((n) => n._id) } },
      { $set: { "zalo.broadcastError": err.message || "unknown" } }
    );
    console.error(`[ZaloArticle] Broadcast thất bại: ${err.message}`);
  }
}

function startAutoPost() {
  if (!config.zaloArticle.enabled) {
    console.log("[ZaloArticle] ZALO_ARTICLE_ENABLED != true — bỏ qua tự động đăng tin lên OA");
    return;
  }
  // Lần đầu sau 3 phút (đợi token + scrape ổn định), rồi mỗi 20 phút.
  setTimeout(() => {
    const run = () => {
      postPendingArticles()
        .then(() => broadcastPendingArticles())
        .catch((e) => console.error("[ZaloArticle] Quét lỗi:", e.message));
    };
    run();
    setInterval(run, POST_INTERVAL_MS);
  }, 3 * 60 * 1000);
  console.log(
    `[ZaloArticle] Đã bật tự động đăng tin lên OA (quét mỗi 20 phút)${
      config.zaloArticle.broadcastEnabled ? " + tự động broadcast tới follower" : " (chưa bật broadcast)"
    }`
  );
}

module.exports = { postPendingArticles, broadcastPendingArticles, startAutoPost, postOne };
