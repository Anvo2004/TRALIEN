const config = require("../config");
const News = require("../models/News");
const { createArticle, verifyArticle } = require("../utils/zaloArticle");

// ============================================================
// Tự động đăng tin đã cào (model News) lên Zalo OA dạng "Bài viết".
// - CHỈ tạo bài (create + verify), KHÔNG broadcast — bài xuất hiện trong
//   "Quản lý bài viết" của OA (ẩn), không tự bắn thông báo tới người theo dõi.
//   Đúng mẫu TIENICHOAZALO_THUONGDUC (luồng cron tự động của họ cũng chỉ tạo
//   bài, không broadcast — xem articleSync.js/createArticles() bên đó).
// - Việc gửi (broadcast) để SAU: app hiện mới có quyền "Article API" (tạo/
//   sửa/xoá/lấy bài), CHƯA có quyền riêng "Broadcast bài viết" (nằm trong
//   nhóm "Official Account API" → "Gửi tin và thông báo qua OA", cần xin
//   duyệt riêng trên Zalo Developers). Zalo cũng giới hạn số lượt broadcast
//   rất thấp theo gói OA (gói Cơ bản ~1 lượt/tháng) nên khi làm lại, chỉ nên
//   tự động broadcast cho cảnh báo khẩn cấp, không phải mọi tin thường ngày.
//   Hàm broadcastArticle() đã có sẵn ở utils/zaloArticle.js, chỉ chưa được
//   gọi ở đây — xem lịch sử trao đổi 2026-09-14/15 nếu cần bật lại.
// - Bỏ qua tin cũ: backfill đặt zalo.skip=true (xem scripts/backfill-news-zalo-skip.js),
//   nên chỉ tin cào được SAU khi bật mới được đăng.
// - Dùng chung token OA (utils/zaloArticle → zaloToken). Tự tắt nếu ZALO_ARTICLE_ENABLED!=true.
// ============================================================

const POST_INTERVAL_MS = 20 * 60 * 1000; // quét mỗi 20 phút
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 5; // mỗi lượt tối đa 5 bài, tuần tự (tránh dồn dập lên OA)

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
    await News.updateOne(
      { _id: news._id },
      { $set: { "zalo.articleId": articleId, "zalo.postedAt": new Date(), "zalo.lastError": "" } }
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

function startAutoPost() {
  if (!config.zaloArticle.enabled) {
    console.log("[ZaloArticle] ZALO_ARTICLE_ENABLED != true — bỏ qua tự động đăng tin lên OA");
    return;
  }
  // Lần đầu sau 3 phút (đợi token + scrape ổn định), rồi mỗi 20 phút.
  setTimeout(() => {
    postPendingArticles().catch((e) => console.error("[ZaloArticle] Lần đầu lỗi:", e.message));
    setInterval(() => {
      postPendingArticles().catch((e) => console.error("[ZaloArticle] Quét lỗi:", e.message));
    }, POST_INTERVAL_MS);
  }, 3 * 60 * 1000);
  console.log("[ZaloArticle] Đã bật tự động đăng tin lên OA (chỉ tạo bài, quét mỗi 20 phút)");
}

module.exports = { postPendingArticles, startAutoPost, postOne };
