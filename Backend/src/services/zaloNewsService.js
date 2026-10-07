const config = require("../config");
const News = require("../models/News");
const { createArticle, updateArticle, verifyArticle, getArticleDetail, broadcastArticle } = require("../utils/zaloArticle");
const { renderPdfPages } = require("../utils/pdfPages");
const { zaloFriendlyImage } = require("../utils/imageHost");
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
// tóm tắt, tin PDF chỉ có link...) được dựng lại khi gửi thẻ tin (ensureArticle).
// 2 = văn bản PDF thành ảnh từng trang trong bài. 3 = dựng lại các bài bị đánh
// dấu "2" oan trong sự cố token OA 2026-10-05 (Zalo từ chối nội dung nhưng vẫn
// ghi mốc, nên bài tóm tắt kẹt vĩnh viễn).
const ARTICLE_BODY_VERSION = 3;
const MAX_BODY_RETRIES = 3; // số lần dựng lại tối đa khi Zalo cứ từ chối bản đầy đủ
const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000; // token bài chờ verify còn dùng được trong 24h
const PENDING_WAIT_MS = 2 * 60 * 60 * 1000; // trong 2h đầu chỉ chờ Zalo xử lý xong, không tạo bài khác
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
// nguyên URL gốc, văn bản PDF đã chuyển ảnh (prepareDetail) thành các khối ảnh
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
      // Số trang đã nằm trong hạn mức ảnh (prepareDetail trừ sẵn ảnh của tin).
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

// Chuẩn bị nội dung trang chi tiết cho bài OA:
// - ảnh quá nặng → bản thu nhỏ do Backend phục vụ (utils/imageHost.js), vì Zalo
//   không xử lý nổi ảnh nặng và bài sẽ kẹt mãi;
// - văn bản PDF → ảnh từng trang (utils/pdfPages.js), trong hạn mức
//   MAX_BODY_IMAGES chung với ảnh của tin. Không chuyển được thì khối giữ
//   nguyên (bài hiện link tài liệu).
async function prepareDetail(detail) {
  let budget = MAX_BODY_IMAGES - detail.filter((b) => b.type === "image").length;
  const out = [];
  for (const block of detail) {
    if (block.type === "image") {
      out.push({ ...block, url: await zaloFriendlyImage(block.url) });
      continue;
    }
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
// hiện tại (dựng lại cũng không đầy đủ hơn — vd. tin quá nhiều ảnh, file docx),
// hoặc đã dựng lại quá nhiều lần mà vẫn không đầy đủ.
function hasUsableArticle(news) {
  const z = news.zalo || {};
  return Boolean(
    z.articleId &&
      (z.fullContent || (z.bodyVersion || 0) >= ARTICLE_BODY_VERSION || (z.bodyRetries || 0) >= MAX_BODY_RETRIES)
  );
}

// Ghi kết quả 1 lượt tạo/sửa bài (đã có id thật) vào News.
async function saveArticle(news, articleId, meta) {
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
        "zalo.fullContent": Boolean(meta.complete),
        "zalo.bodyVersion": meta.bodyVersion || 0,
        "zalo.lastReject": meta.reject || "",
        "zalo.postedAt": new Date(),
        "zalo.lastError": "",
        "zalo.pending": { token: "", at: null, meta: null },
      },
      // Bản tốt nhất bị Zalo từ chối → đếm lần dựng lại, tránh dựng lại mãi.
      ...(meta.best ? {} : { $inc: { "zalo.bodyRetries": 1 } }),
    }
  );
  return { articleId, linkView, fullContent: Boolean(meta.complete), bodyVersion: meta.bodyVersion || 0 };
}

// Tạo bài OA cho tin, hoặc SỬA bài đã có cho đầy đủ hơn (article/update giữ
// nguyên id → thẻ tin đã gửi cho dân cũng hiện nội dung mới, OA không bị thêm
// bài trùng). Lỗi thì ném ra.
async function buildArticle(news) {
  // Bài lượt trước Zalo đã nhận nhưng xử lý chưa xong (verify quá hạn) → verify
  // tiếp, KHÔNG tạo bài mới (mỗi lần tạo lại là 1 bài rác trên OA).
  const pending = news.zalo?.pending;
  const pendingAge = pending?.token ? Date.now() - new Date(pending.at || 0).getTime() : Infinity;
  if (pendingAge < PENDING_MAX_AGE_MS) {
    try {
      const articleId = await verifyArticle(pending.token, { retries: 3, delayMs: 3000 });
      console.log(`[ZaloArticle] Bài chờ Zalo xử lý của tin nid=${news.nid} đã xong (id=${articleId})`);
      return await saveArticle(news, articleId, pending.meta || { bodyVersion: news.zalo?.bodyVersion || 0 });
    } catch (err) {
      console.warn(`[ZaloArticle] Bài chờ xử lý của tin nid=${news.nid} vẫn chưa xong: ${err.message}`);
      // Zalo có thể xử lý bài (nhiều ảnh) lâu hơn nhiều phút — chờ hẳn, KHÔNG tạo
      // bài mới, nếu không mỗi lượt quét lại đẻ thêm 1 bài trùng trên OA (ngày
      // 2026-10-05 đã sinh 7 bài trùng cho 1 tin). Quá lâu thì mới dựng lại.
      if (pendingAge < PENDING_WAIT_MS) {
        throw new Error("Zalo đang xử lý bài viết của tin này, chờ lượt sau");
      }
    }
  }

  const item = toArticleItem(news);
  // Không có ảnh và chưa cấu hình cover mặc định → không đăng được (Zalo bắt buộc cover).
  if (!item.coverPhotoUrl) throw new Error("Thiếu ảnh cover");
  item.coverPhotoUrl = await zaloFriendlyImage(item.coverPhotoUrl);

  // Nội dung đầy đủ lấy từ trang chi tiết — tải lỗi thì vẫn đăng bản tóm tắt như
  // trước, và KHÔNG ghi bodyVersion để lần gửi thẻ sau thử dựng lại.
  let detail = null;
  if (news.link) {
    try {
      detail = await prepareDetail(await fetchNewsDetail(news.link));
    } catch (err) {
      console.warn(`[ZaloArticle] Không tải được nội dung đầy đủ tin nid=${news.nid}: ${err.message}`);
    }
  }
  // Dựng lại bài cũ mà không có nội dung đầy đủ → sửa thành bản tóm tắt là vô ích, giữ bài cũ.
  if (!detail && news.zalo?.articleId) throw new Error("Không tải được nội dung đầy đủ để dựng lại bài OA");

  const variants = articleVariants(detail || [], news);
  let existingId = news.zalo?.articleId || "";

  // Gửi lần lượt các bản nội dung, lùi xuống bản gọn hơn KHI VÀ CHỈ KHI Zalo từ
  // chối nội dung; lỗi mạng thì ném ra để cơ chế thử lại (zalo.attempts) xử lý.
  const submit = async (send) => {
    let reject = "";
    for (const v of variants) {
      try {
        return { token: await send(v.body), chosen: v, reject };
      } catch (err) {
        if (!err.zaloRejected || v === variants[variants.length - 1]) throw err;
        // Lý do Zalo bỏ bản tốt nhất — lưu lại để xem ở AdminWeb, khỏi phải đọc log VPS.
        reject = reject || `Zalo từ chối bản "${v.level}": ${err.message}`;
        console.warn(`[ZaloArticle] Zalo từ chối bản "${v.level}" của tin nid=${news.nid}, thử bản gọn hơn: ${err.message}`);
      }
    }
  };

  let result;
  if (existingId) {
    try {
      result = await submit((body) => updateArticle(existingId, { ...item, body }));
    } catch (err) {
      // Không sửa được (vd. OA chưa có quyền sửa bài) → tạo bài mới như trước.
      console.warn(`[ZaloArticle] Không sửa được bài ${existingId} của tin nid=${news.nid} (${err.message}) — tạo bài mới`);
      existingId = "";
    }
  }
  if (!result) result = await submit((body) => createArticle({ ...item, body }));
  const { token, chosen, reject } = result;

  const best = chosen === variants[0];
  const meta = {
    level: chosen.level,
    complete: chosen.complete,
    best,
    // Chỉ coi là "đã dựng theo cách hiện tại" khi Zalo nhận ĐÚNG bản tốt nhất.
    // Bị từ chối (vd. Zalo lỗi nhất thời như 2026-10-05) thì giữ mốc cũ để lần
    // gửi thẻ sau dựng lại — trước đây đánh dấu luôn nên bài tóm tắt kẹt vĩnh viễn.
    bodyVersion: detail && best ? ARTICLE_BODY_VERSION : news.zalo?.bodyVersion || 0,
    reject,
  };

  let articleId;
  try {
    articleId = await verifyArticle(token);
  } catch (err) {
    // Zalo vẫn đang xử lý → nhớ token để lượt sau verify tiếp thay vì tạo bài mới.
    // Zalo báo hỏng hẳn (err.zaloRejected, vd. ảnh quá nặng) thì không nhớ làm gì.
    if (!err.zaloRejected) {
      await News.updateOne({ _id: news._id }, { $set: { "zalo.pending": { token, at: new Date(), meta } } }).catch(() => {});
    }
    throw err;
  }

  // Sửa bài: GIỮ id cũ (thẻ tin đã gửi trỏ vào đó). Zalo trả id khác là bất
  // thường — ghi log để biết, nhưng không đổi id đang dùng.
  if (existingId && articleId && articleId !== existingId) {
    console.warn(`[ZaloArticle] Sửa bài ${existingId} nhưng Zalo trả id ${articleId} — giữ id cũ`);
  }
  const zalo = await saveArticle(news, existingId || articleId, meta);
  console.log(
    `[ZaloArticle] Đã ${existingId ? "cập nhật" : "tạo"} bài OA (${meta.level}${meta.complete ? ", đầy đủ" : ", chưa đầy đủ"}) cho tin nid=${news.nid} (id=${zalo.articleId}): ${item.title.slice(0, 50)}`
  );
  return zalo;
}

// Mỗi tin chỉ 1 lượt tạo bài tại 1 thời điểm — bộ đăng tin (20 phút/lần) và thẻ
// tin (gửi tay/tự động) có thể cùng nhắm 1 tin mới; lượt sau dùng chung kết quả,
// và đọc lại DB trước khi tạo để không tạo 2 bài cho 1 tin.
const building = new Map(); // newsId → Promise<zalo>

function buildArticleOnce(news, { force = false } = {}) {
  const key = String(news._id);
  if (!building.has(key)) {
    const task = (async () => {
      const fresh = (await News.findById(news._id).lean()) || news;
      if (!force && hasUsableArticle(fresh)) return fresh.zalo;
      return buildArticle(fresh);
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

// Dựng lại bài cho 1 tin dù bài hiện tại đã "dùng được" (nút "Tạo lại bài OA" ở
// AdminWeb) — lỗi thì ném ra để cán bộ thấy lý do.
function rebuildArticle(news) {
  return buildArticleOnce(news, { force: true });
}

// Thẻ tin luôn mở bài OA: bảo đảm tin có bài dùng được → { articleId, linkView, ... }.
// Chưa có bài → tạo; bài cũ chưa đầy đủ → sửa chính bài đó cho đầy đủ (giữ id).
// Lỗi mà vẫn có bài cũ thì dùng tạm bài cũ; không có bài nào thì ném lỗi.
// force=true: dựng lại kể cả khi bài hiện tại đã "dùng được" (nút Tạo lại bài OA).
async function ensureArticle(news, { force = false } = {}) {
  if (!force && hasUsableArticle(news)) return news.zalo;
  try {
    return await buildArticleOnce(news, { force });
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
  prepareDetail,
  hasUsableArticle,
  ensureArticle,
  rebuildArticle,
};
