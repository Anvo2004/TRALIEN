const config = require("../config");
const News = require("../models/News");
const NewsCardSend = require("../models/NewsCardSend");
const SendLog = require("../models/SendLog");
const { sendZaloCard } = require("../utils/zaloApi");
const { getArticleDetail } = require("../utils/zaloArticle");
const { createJob, getJobStatus, fetchAllFollowers } = require("./broadcastService");

// ============================================================
// "Thẻ tin": gửi 1 tin tức (News) tới TẤT CẢ người quan tâm OA, từng người một,
// bằng TIN TƯ VẤN dạng danh sách (list template) — Zalo hiển thị ảnh lớn + tiêu
// đề đậm + mô tả, bấm vào mở bài. KHÔNG phải broadcast (broadcast bị giới hạn
// vài lượt/tháng theo gói OA và cần quyền riêng — xem comment đầu
// zaloNewsService.js). Cơ chế đối chiếu từ HOATIEN/QUESON
// (zaloBroadcast.sendArticleCard), đã chạy thật.
//
// Danh sách người nhận lấy thẳng từ Zalo lúc gửi (không dùng cache follower,
// để người mới quan tâm cũng nhận). Theo tài liệu Zalo, tin tư vấn qua OpenAPI
// chỉ tới được người có tương tác với OA trong 7 ngày — người còn lại Zalo trả
// lỗi, được đếm và gom theo mã trong lịch sử gửi.
// ============================================================

const SEND_DELAY_MS = 500; // cùng nhịp với broadcastService.sendBroadcast (tránh rate limit OA)
const PROGRESS_SAVE_EVERY = 20; // lưu tiến độ vào DB sau mỗi 20 người
const TITLE_MAX = 100; // giới hạn HOATIEN đã gửi thật thành công
const SUBTITLE_MAX = 255;
const NEWS_PAGE_SIZE = 20;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function truncate(str, max) {
  const s = (str || "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trim()}…` : s;
}

// Link cào đôi khi ở dạng http — ép https giống MiniApp (utils/open-external.js).
function toHttps(url) {
  return (url || "").replace(/^http:\/\//i, "https://");
}

// Link mở khi bấm thẻ: bài viết OA nếu tin đã được đăng lên OA (zaloNewsService),
// không có thì trang tin gốc. link_view thiếu thì lấy lại từ Zalo rồi lưu luôn.
async function resolveTarget(news) {
  if (news.zalo?.articleId) {
    let linkView = news.zalo.linkView || "";
    if (!linkView) {
      try {
        linkView = (await getArticleDetail(news.zalo.articleId)).link_view || "";
      } catch (err) {
        console.warn(`[NewsCard] Không lấy được link bài OA ${news.zalo.articleId}: ${err.message}`);
      }
      if (linkView) {
        News.updateOne({ _id: news._id }, { $set: { "zalo.linkView": linkView } }).catch((err) =>
          console.warn(`[NewsCard] Lưu link_view lỗi: ${err.message}`)
        );
      }
    }
    if (linkView) return { url: linkView, type: "oa" };
  }
  return { url: toHttps(news.link), type: "goc" };
}

async function buildCard(news) {
  const imageUrl = news.imageUrl || config.zaloArticle.defaultCover;
  if (!imageUrl) {
    throw httpError(400, "Tin này không có ảnh và chưa cấu hình ZALO_ARTICLE_DEFAULT_COVER — thẻ tin cần ảnh");
  }
  const target = await resolveTarget(news);
  if (!target.url) throw httpError(400, "Tin này không có link để mở");

  return {
    element: {
      title: truncate(news.title, TITLE_MAX),
      subtitle: truncate(news.summary || news.title, SUBTITLE_MAX),
      image_url: imageUrl,
      default_action: { type: "oa.open.url", url: target.url },
    },
    target,
  };
}

async function loadNews(newsId) {
  const news = await News.findById(newsId).lean().catch(() => null);
  if (!news) throw httpError(404, "Không tìm thấy tin");
  return news;
}

// Danh sách tin để chọn gửi (mới nhất trước) + lần gửi thẻ gần nhất của từng tin
// để cán bộ tránh gửi trùng.
async function listNews({ q = "", page = 1 } = {}) {
  const filter = {};
  if (q) filter.title = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const current = Math.max(1, parseInt(page) || 1);

  const [items, total] = await Promise.all([
    News.find(filter)
      .sort({ nid: -1 })
      .skip((current - 1) * NEWS_PAGE_SIZE)
      .limit(NEWS_PAGE_SIZE)
      .select("nid title summary date tag imageUrl link zalo.articleId zalo.linkView")
      .lean(),
    News.countDocuments(filter),
  ]);

  const lastSends = await NewsCardSend.aggregate([
    { $match: { newsId: { $in: items.map((n) => n._id) } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$newsId", at: { $first: "$createdAt" }, sent: { $first: "$sent" }, times: { $sum: 1 } } },
  ]);
  const lastById = new Map(lastSends.map((s) => [String(s._id), s]));

  return {
    items: items.map((n) => {
      const last = lastById.get(String(n._id));
      return {
        _id: n._id,
        title: n.title,
        summary: n.summary,
        date: n.date,
        tag: n.tag,
        imageUrl: n.imageUrl,
        link: n.link,
        hasOaArticle: Boolean(n.zalo?.articleId),
        lastSend: last ? { at: last.at, sent: last.sent, times: last.times } : null,
      };
    }),
    total,
    page: current,
    totalPages: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)),
  };
}

// Gửi thử cho đúng 1 người (cán bộ tự xem thẻ trước khi gửi hàng loạt) — chạy
// đồng bộ, không ghi lịch sử gửi.
async function sendTestCard(newsId, zaloUserId) {
  const news = await loadNews(newsId);
  const { element, target } = await buildCard(news);
  await sendZaloCard(zaloUserId, element);
  return { target };
}

// Gửi tới toàn bộ người quan tâm OA ở nền. Trả jobId ngay; tiến độ đọc qua
// broadcastService.getJobStatus (route có sẵn GET /api/broadcast/status/:jobId).
async function sendNewsCard({ newsId, sentBy = null }) {
  const news = await loadNews(newsId);
  // Lỗi thiếu ảnh/link báo ngay cho cán bộ, trước khi tạo job.
  const { element, target } = await buildCard(news);

  let followers;
  try {
    followers = await fetchAllFollowers();
  } catch (err) {
    throw httpError(502, `Không lấy được danh sách người quan tâm từ Zalo: ${err.message}`);
  }
  const recipients = [...new Set(followers.map((f) => String(f.user_id || "")).filter(Boolean))];
  if (!recipients.length) throw httpError(400, "OA chưa có người quan tâm nào để gửi");

  const doc = await NewsCardSend.create({
    newsId: news._id,
    title: element.title,
    imageUrl: element.image_url,
    targetUrl: target.url,
    targetType: target.type,
    recipientCount: recipients.length,
    sentBy,
  });

  const jobId = createJob(recipients.length, recipients.length * SEND_DELAY_MS + 10 * 60 * 1000);
  const job = getJobStatus(jobId);
  job.sendId = String(doc._id);
  job.errors = [];
  const errors = new Map(); // mã lỗi Zalo → { code, message, count }

  const saveProgress = (extra = {}) =>
    NewsCardSend.updateOne(
      { _id: doc._id },
      { $set: { sent: job.sent, failed: job.failed, errorCounts: [...errors.values()], ...extra } }
    ).catch((err) => console.error("[NewsCard] Lưu tiến độ lỗi:", err.message));

  (async () => {
    let done = 0;
    for (const userId of recipients) {
      try {
        await sendZaloCard(userId, element);
        job.sent += 1;
      } catch (err) {
        job.failed += 1;
        const code = String(err.zaloCode ?? "network");
        const entry = errors.get(code) || { code, message: err.message, count: 0 };
        entry.count += 1;
        errors.set(code, entry);
        job.errors = [...errors.values()];
      }
      done += 1;
      if (done % PROGRESS_SAVE_EVERY === 0) await saveProgress();
      if (done < recipients.length) await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
    }

    job.done = true;
    await saveProgress({ status: job.sent > 0 ? "done" : "failed" });
    await SendLog.create({
      message: `[Thẻ tin] ${element.title}`,
      recipientCount: recipients.length,
      sentCount: job.sent,
      failedCount: job.failed,
      sentBy,
    }).catch((err) => console.error("[NewsCard] Ghi SendLog lỗi:", err.message));
    console.log(
      `[NewsCard] Gửi thẻ "${element.title.slice(0, 50)}": ${job.sent}/${recipients.length} thành công, ${job.failed} lỗi`
    );
  })();

  return { jobId, sendId: String(doc._id), total: recipients.length };
}

async function listHistory(limit = 50) {
  return NewsCardSend.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sentBy", "fullName username")
    .lean();
}

module.exports = { buildCard, listNews, sendTestCard, sendNewsCard, listHistory };
