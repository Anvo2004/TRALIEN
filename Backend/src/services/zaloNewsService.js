const config = require("../config");
const News = require("../models/News");
const { createArticle, verifyArticle, getArticleDetail, broadcastArticle } = require("../utils/zaloArticle");
const { renderPdfPages } = require("../utils/pdfPages");
const { redisGet, redisSet } = require("../utils/redis");
const { fetchNewsDetail } = require("./newsScrapeService");

// ============================================================
// Tự động đăng tin đã cào (model News) lên Zalo OA dạng "Bài viết", rồi
// broadcast (gửi) bài đó tới TOÀN BỘ người quan tâm OA.
// - Tạo bài (create + verify): xem postPendingArticles(). Luôn chạy nếu
//   ZALO_ARTICLE_ENABLED=true, độc lập với broadcast. Nội dung bài = TOÀN BỘ
//   tin (chữ + ảnh, lấy từ trang chi tiết; văn bản PDF chuyển thành ảnh từng
//   trang), lùi dần về chỉ chữ / tóm tắt nếu Zalo từ chối — zalo.fullContent=true
//   khi bài có nội dung đầy đủ.
// - "Thẻ tin" (newsCardService.js) luôn mở bài OA: ensureArticle() tạo bài ngay
//   lúc gửi nếu tin chưa có bài, hoặc bài cũ chỉ có tóm tắt/link PDF.
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

// Tổng ảnh trong 1 bài (ảnh của tin + trang PDF) — mỗi ảnh Zalo phải tải về host
// lại; quá số này thì bài không đủ nội dung (fullContent=false).
const MAX_BODY_IMAGES = 20;
// Phiên bản cách dựng nội dung bài OA. Bài chưa đầy đủ dựng bằng bản cũ hơn (chỉ
// tóm tắt, tin PDF chỉ có link...) được dựng lại 1 lần khi gửi thẻ tin
// (ensureArticle). 2 = văn bản PDF thành ảnh từng trang trong bài.
const ARTICLE_BODY_VERSION = 2;
const PDF_RE = /\.pdf(?:[?#]|$)/i;

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

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Khối nội dung trang chi tiết (newsScrapeService.parseNewsDetail) → body bài viết
// Zalo, cùng định dạng HOATIEN đang tạo bài thật: đoạn văn thành <p>, ảnh giữ
// nguyên URL gốc, văn bản PDF đã chuyển ảnh (attachPdfPages) thành các khối ảnh
// "Trang i/N". withImages=false: chỉ giữ chữ (bản dự phòng khi Zalo từ chối ảnh).
function toArticleBody(detail, news, { withImages = true } = {}) {
  const body = [];
  let images = 0;
  const pushText = (paragraphs) => {
    const html = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    const last = body[body.length - 1];
    if (last && last.type === "text") last.content += html;
    else body.push({ type: "text", content: html });
  };
  // Tin không có đoạn chữ nào (vd. chỉ có văn bản PDF) — mở đầu bằng tóm tắt/tiêu đề.
  if (!detail.some((b) => b.type === "text")) pushText([news.summary || news.title]);
  for (const block of detail) {
    if (block.type === "image") {
      if (!withImages || images >= MAX_BODY_IMAGES) continue;
      images += 1;
      body.push({ type: "image", url: block.url, caption: "" });
    } else if (block.type === "file") {
      // Số trang đã nằm trong hạn mức ảnh (attachPdfPages trừ sẵn ảnh của tin).
      const pages = withImages ? block.pages || [] : [];
      pages.forEach((url, i) => {
        body.push({ type: "image", url, caption: block.totalPages > 1 ? `Trang ${i + 1}/${block.totalPages}` : "" });
      });
      if (!pages.length) pushText([`Tài liệu đính kèm: ${block.url}`]);
      else if (pages.length < block.totalPages) {
        pushText([`Văn bản có ${block.totalPages} trang, xem đầy đủ tại: ${block.url}`]);
      } else pushText([`Tải văn bản gốc: ${block.url}`]);
    } else {
      pushText(block.paragraphs);
    }
  }
  if (news.link) pushText([`Nguồn: ${news.link}`]);
  return body;
}

// Văn bản PDF trong tin → ảnh từng trang (utils/pdfPages.js), trong hạn mức
// MAX_BODY_IMAGES chung với ảnh của tin. Không chuyển được thì khối giữ nguyên
// (bài hiện link tài liệu).
async function attachPdfPages(detail) {
  let budget = MAX_BODY_IMAGES - detail.filter((b) => b.type === "image").length;
  const out = [];
  for (const block of detail) {
    if (block.type === "file" && PDF_RE.test(block.url) && budget > 0) {
      const rendered = await renderPdfPages(block.url, { maxPages: budget });
      if (rendered && rendered.pages.length) {
        budget -= rendered.pages.length;
        out.push({ ...block, pages: rendered.pages, totalPages: rendered.totalPages });
        continue;
      }
    }
    out.push(block);
  }
  return out;
}

// Các bản nội dung thử lần lượt khi tạo bài: đầy đủ (chữ + ảnh + trang PDF) →
// chỉ chữ → tóm tắt. complete: bài OA thể hiện được TOÀN BỘ tin — có nội dung,
// mọi tài liệu đính kèm đã thành ảnh đủ trang (docx/khung nhúng thì không),
// tổng ảnh không vượt MAX_BODY_IMAGES.
function articleVariants(detail, news) {
  const hasText = detail.some((b) => b.type === "text");
  const images = detail.filter((b) => b.type === "image").length;
  const files = detail.filter((b) => b.type === "file");
  const pages = files.reduce((n, b) => n + (b.pages?.length || 0), 0);
  const complete =
    (hasText || pages > 0) &&
    files.every((b) => b.pages?.length && b.pages.length >= b.totalPages) &&
    images + pages <= MAX_BODY_IMAGES;
  const variants = [];
  if (detail.length) variants.push({ level: "full", body: toArticleBody(detail, news), complete });
  if (images + pages > 0) {
    variants.push({ level: "text", body: toArticleBody(detail, news, { withImages: false }), complete: false });
  }
  variants.push({ level: "summary", body: null, complete: false });
  return variants;
}

// Bài OA hiện có dùng được cho thẻ tin: đầy đủ nội dung, hoặc đã dựng bằng cách
// hiện tại (dựng lại cũng không đầy đủ hơn — vd. tin quá nhiều ảnh, file docx).
function hasUsableArticle(news) {
  const z = news.zalo || {};
  return Boolean(z.articleId && (z.fullContent || (z.bodyVersion || 0) >= ARTICLE_BODY_VERSION));
}

// Tạo 1 bài OA mới cho tin, nội dung đầy đủ nhất Zalo nhận. Lỗi thì ném ra.
async function createFullArticle(news) {
  const item = toArticleItem(news);
  // Không có ảnh và chưa cấu hình cover mặc định → không đăng được (Zalo bắt buộc cover).
  if (!item.coverPhotoUrl) throw new Error("Thiếu ảnh cover");

  // Nội dung đầy đủ lấy từ trang chi tiết — tải lỗi thì vẫn đăng bản tóm tắt như
  // trước, và KHÔNG ghi bodyVersion để lần gửi thẻ sau thử dựng lại.
  let detail = null;
  if (news.link) {
    try {
      detail = await attachPdfPages(await fetchNewsDetail(news.link));
    } catch (err) {
      console.warn(`[ZaloArticle] Không tải được nội dung đầy đủ tin nid=${news.nid}: ${err.message}`);
    }
  }
  // Dựng lại bài cũ mà không có nội dung đầy đủ → tạo thêm bài tóm tắt là vô ích, giữ bài cũ.
  if (!detail && news.zalo?.articleId) throw new Error("Không tải được nội dung đầy đủ để dựng lại bài OA");

  // Chỉ lùi xuống bản gọn hơn khi Zalo TỪ CHỐI nội dung (lỗi tạo bài); lỗi
  // mạng/verify thì ném ra để cơ chế thử lại (zalo.attempts) xử lý như cũ.
  const variants = articleVariants(detail || [], news);
  let token;
  let level;
  let complete = false;
  for (const v of variants) {
    try {
      token = await createArticle({ ...item, body: v.body });
      level = v.level;
      complete = v.complete;
      break;
    } catch (err) {
      if (!err.zaloRejected || v === variants[variants.length - 1]) throw err;
      console.warn(`[ZaloArticle] Zalo từ chối bản "${v.level}" của tin nid=${news.nid}, thử bản gọn hơn: ${err.message}`);
    }
  }
  const articleId = await verifyArticle(token);
  // link_view để "thẻ tin" (newsCardService.js) mở thẳng bài OA — lỗi thì bỏ
  // qua, lúc gửi thẻ sẽ tự lấy lại.
  let linkView = "";
  try {
    linkView = (await getArticleDetail(articleId)).link_view || "";
  } catch (err) {
    console.warn(`[ZaloArticle] Chưa lấy được link_view bài ${articleId}: ${err.message}`);
  }
  const zalo = {
    articleId,
    linkView,
    fullContent: complete,
    bodyVersion: detail ? ARTICLE_BODY_VERSION : news.zalo?.bodyVersion || 0,
  };
  await News.updateOne(
    { _id: news._id },
    {
      $set: {
        "zalo.articleId": zalo.articleId,
        "zalo.linkView": zalo.linkView,
        "zalo.fullContent": zalo.fullContent,
        "zalo.bodyVersion": zalo.bodyVersion,
        "zalo.postedAt": new Date(),
        "zalo.lastError": "",
      },
    }
  );
  console.log(
    `[ZaloArticle] Đã tạo bài OA (${level}${complete ? ", đầy đủ" : ", chưa đầy đủ"}) cho tin nid=${news.nid} (id=${articleId}): ${item.title.slice(0, 50)}`
  );
  return zalo;
}

// Mỗi tin chỉ 1 lượt tạo bài tại 1 thời điểm — bộ đăng tin (20 phút/lần) và thẻ
// tin (gửi tay/tự động) có thể cùng nhắm 1 tin mới; lượt sau dùng chung kết quả,
// và đọc lại DB trước khi tạo để không tạo 2 bài cho 1 tin.
const building = new Map(); // newsId → Promise<zalo>

function buildArticleOnce(news) {
  const key = String(news._id);
  if (!building.has(key)) {
    const task = (async () => {
      const fresh = (await News.findById(news._id).lean()) || news;
      if (hasUsableArticle(fresh)) return fresh.zalo;
      return createFullArticle(fresh);
    })()
      .catch(async (err) => {
        await News.updateOne(
          { _id: news._id },
          { $inc: { "zalo.attempts": 1 }, $set: { "zalo.lastError": err.message || "unknown" } }
        ).catch(() => {});
        throw err;
      })
      .finally(() => building.delete(key));
    building.set(key, task);
  }
  return building.get(key);
}

async function postOne(news) {
  try {
    const { articleId } = await buildArticleOnce(news);
    return { ok: true, newsId: news._id, articleId };
  } catch (err) {
    console.warn(`[ZaloArticle] Đăng tin nid=${news.nid} thất bại: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

// Thẻ tin luôn mở bài OA: bảo đảm tin có bài dùng được → { articleId, linkView, ... }.
// Chưa có bài, hoặc bài cũ chưa đầy đủ → tạo bài mới ngay (bài cũ giữ nguyên
// trên OA — thẻ/broadcast đã gửi trước đây vẫn trỏ tới). Tạo lỗi mà có bài cũ
// thì dùng tạm bài cũ; không có bài nào thì ném lỗi.
async function ensureArticle(news) {
  if (hasUsableArticle(news)) return news.zalo;
  try {
    return await buildArticleOnce(news);
  } catch (err) {
    if (!news.zalo?.articleId) throw err;
    console.warn(`[ZaloArticle] Không dựng lại được bài OA tin nid=${news.nid}, dùng bài cũ: ${err.message}`);
    return news.zalo;
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

module.exports = {
  postPendingArticles,
  broadcastPendingArticles,
  startAutoPost,
  postOne,
  articleVariants,
  attachPdfPages,
  hasUsableArticle,
  ensureArticle,
};
