const config = require("../config");
const News = require("../models/News");
const NewsCardSend = require("../models/NewsCardSend");
const SendLog = require("../models/SendLog");
const { sendZaloCard } = require("../utils/zaloApi");
const { getArticleDetail } = require("../utils/zaloArticle");
const { redisGet, redisSet } = require("../utils/redis");
const { createJob, getJobStatus, fetchAllFollowers } = require("./broadcastService");
const { ensureArticle, hasUsableArticle } = require("./zaloNewsService");

// ============================================================
// "Thẻ tin": gửi 1 tin tức (News) tới TẤT CẢ người quan tâm OA, từng người một,
// bằng TIN TƯ VẤN dạng danh sách (list template) — Zalo hiển thị ảnh lớn + tiêu
// đề đậm + mô tả, bấm vào mở bài. KHÔNG phải broadcast (broadcast bị giới hạn
// vài lượt/tháng theo gói OA và cần quyền riêng — xem comment đầu
// zaloNewsService.js). Cơ chế đối chiếu từ HOATIEN/QUESON
// (zaloBroadcast.sendArticleCard), đã chạy thật.
//
// Bấm thẻ LUÔN mở bài viết OA ngay trong Zalo (không mở trang tin gốc): tin
// chưa có bài, hoặc bài cũ chưa đầy đủ, thì zaloNewsService.ensureArticle tạo
// bài đầy đủ ngay trước khi gửi (văn bản PDF thành ảnh từng trang trong bài).
//
// Danh sách người nhận lấy thẳng từ Zalo lúc gửi (không dùng cache follower,
// để người mới quan tâm cũng nhận). Theo tài liệu Zalo, tin tư vấn qua OpenAPI
// chỉ tới được người có tương tác với OA trong 7 ngày — người còn lại Zalo trả
// lỗi, được đếm và gom theo mã trong lịch sử gửi.
//
// Tự động gửi (runAutoSend): tin MỚI cào về được gửi thẻ tự động, mỗi tin 1
// lần, trong giờ hành chính — bật/tắt ở AdminWeb (tab "Gửi thẻ tin").
// ============================================================

const SEND_DELAY_MS = 500; // cùng nhịp với broadcastService.sendBroadcast (tránh rate limit OA)
const PROGRESS_SAVE_EVERY = 20; // lưu tiến độ vào DB sau mỗi 20 người
const TITLE_MAX = 100; // giới hạn HOATIEN đã gửi thật thành công
const SUBTITLE_MAX = 255;
const NEWS_PAGE_SIZE = 20;
// Trạng thái job giữ 6 giờ — đủ cho bước chuẩn bị bài OA + gửi vài nghìn người (500ms/người).
const JOB_TTL_MS = 6 * 60 * 60 * 1000;

const AUTO_KEY = "tralien_news_card_auto"; // Setting: { enabled, since }
const AUTO_INTERVAL_MS = 10 * 60 * 1000; // quét tin mới mỗi 10 phút
const AUTO_MAX_PER_RUN = 2; // mỗi lượt tối đa 2 tin — nhiều tin mới thì giãn ra các lượt sau
const AUTO_MAX_ATTEMPTS = 5;
const AUTO_HOURS = { from: 7, to: 20 }; // chỉ tự gửi 7h00–19h59 giờ Việt Nam

const NO_IMAGE_MSG = "Tin này không có ảnh và chưa cấu hình ZALO_ARTICLE_DEFAULT_COVER — thẻ tin cần ảnh";

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function truncate(str, max) {
  const s = (str || "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trim()}…` : s;
}

// Ảnh thẻ = ảnh bìa bài OA (zaloNewsService.toArticleItem) — cùng điều kiện.
function cardImage(news) {
  return news.imageUrl || config.zaloArticle.defaultCover || "";
}

// Link mở khi bấm thẻ: bài viết OA (link_view). Tạo/dựng lại bài nếu cần; link_view
// thiếu (lúc tạo bài Zalo chưa trả) thì lấy lại từ Zalo rồi lưu.
async function resolveTarget(news) {
  let zalo;
  try {
    zalo = await ensureArticle(news);
  } catch (err) {
    throw httpError(502, `Không tạo được bài viết OA cho tin này: ${err.message}`);
  }
  let linkView = zalo.linkView || "";
  if (!linkView) {
    try {
      linkView = (await getArticleDetail(zalo.articleId)).link_view || "";
    } catch (err) {
      throw httpError(502, `Không lấy được link bài viết OA: ${err.message}`);
    }
    if (!linkView) throw httpError(502, "Zalo chưa trả link bài viết OA — thử lại sau ít phút");
    await News.updateOne({ _id: news._id }, { $set: { "zalo.linkView": linkView } }).catch((err) =>
      console.warn(`[NewsCard] Lưu link_view lỗi: ${err.message}`)
    );
  }
  return { url: linkView, type: "oa" };
}

async function buildCard(news) {
  const imageUrl = cardImage(news);
  if (!imageUrl) throw httpError(400, NO_IMAGE_MSG);
  const target = await resolveTarget(news);

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
// để cán bộ tránh gửi trùng. article: "ready" có bài OA dùng được | "rebuild" bài
// cũ chưa đầy đủ, sẽ tạo lại khi gửi | "none" chưa có bài, sẽ tạo khi gửi.
async function listNews({ q = "", page = 1 } = {}) {
  const filter = {};
  if (q) filter.title = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const current = Math.max(1, parseInt(page) || 1);

  const [items, total] = await Promise.all([
    News.find(filter)
      .sort({ nid: -1 })
      .skip((current - 1) * NEWS_PAGE_SIZE)
      .limit(NEWS_PAGE_SIZE)
      .select("nid title summary date tag imageUrl link zalo.articleId zalo.fullContent zalo.bodyVersion")
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
        article: hasUsableArticle(n) ? "ready" : n.zalo?.articleId ? "rebuild" : "none",
        lastSend: last ? { at: last.at, sent: last.sent, times: last.times } : null,
      };
    }),
    total,
    page: current,
    totalPages: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)),
  };
}

// Gửi thử cho đúng 1 người (cán bộ tự xem thẻ trước khi gửi hàng loạt) — chạy
// đồng bộ, không ghi lịch sử gửi. Tin chưa có bài OA thì tạo bài ở bước này.
async function sendTestCard(newsId, zaloUserId) {
  const news = await loadNews(newsId);
  const { element, target } = await buildCard(news);
  await sendZaloCard(zaloUserId, element);
  return { target };
}

// newsId đang chuẩn bị/gửi — chặn gửi trùng (vd. cán bộ bấm gửi đúng lúc bộ tự động gửi tin đó).
const activeSends = new Set();

// Gửi tới toàn bộ người quan tâm OA ở nền. Trả jobId ngay; tiến độ đọc qua
// broadcastService.getJobStatus (route có sẵn GET /api/broadcast/status/:jobId):
// stage "preparing" (tạo bài OA + lấy danh sách người nhận — có thể mất vài
// chục giây, lâu hơn thời gian chờ của nginx nên không làm trong request) →
// "sending" → xong (done=true; lỗi thì kèm `error`).
// `finished`: promise xong lượt gửi (reject nếu lỗi) — bộ tự động chờ để gửi tuần tự từng tin.
async function sendNewsCard({ newsId, sentBy = null, auto = false }) {
  const news = await loadNews(newsId);
  if (!cardImage(news)) throw httpError(400, NO_IMAGE_MSG); // báo ngay, trước khi tạo job
  const key = String(news._id);
  if (activeSends.has(key)) throw httpError(409, "Tin này đang được gửi — chờ lượt gửi hiện tại xong");
  activeSends.add(key);

  const jobId = createJob(0, JOB_TTL_MS);
  const job = getJobStatus(jobId);
  job.newsId = key;
  job.stage = "preparing";
  job.errors = [];

  const finished = deliver(news, job, { sentBy, auto })
    .catch((err) => {
      job.error = err.message;
      job.done = true;
      console.error(`[NewsCard] Gửi thẻ tin nid=${news.nid}${auto ? " (tự động)" : ""} lỗi: ${err.message}`);
      throw err;
    })
    .finally(() => activeSends.delete(key));
  finished.catch(() => {}); // lỗi đã báo qua job — chỉ bộ tự động cần bắt lại để đếm lần thử

  return { jobId, finished };
}

async function deliver(news, job, { sentBy, auto }) {
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
    auto,
    sentBy,
  });
  job.sendId = String(doc._id);
  job.total = recipients.length;
  job.stage = "sending";

  const errors = new Map(); // mã lỗi Zalo → { code, message, count }
  const saveProgress = (extra = {}) =>
    NewsCardSend.updateOne(
      { _id: doc._id },
      { $set: { sent: job.sent, failed: job.failed, errorCounts: [...errors.values()], ...extra } }
    ).catch((err) => console.error("[NewsCard] Lưu tiến độ lỗi:", err.message));

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

  job.stage = "done";
  job.done = true;
  await saveProgress({ status: job.sent > 0 ? "done" : "failed" });
  await SendLog.create({
    message: `[Thẻ tin${auto ? " tự động" : ""}] ${element.title}`,
    recipientCount: recipients.length,
    sentCount: job.sent,
    failedCount: job.failed,
    sentBy,
  }).catch((err) => console.error("[NewsCard] Ghi SendLog lỗi:", err.message));
  console.log(
    `[NewsCard] Gửi thẻ${auto ? " (tự động)" : ""} "${element.title.slice(0, 50)}": ${job.sent}/${recipients.length} thành công, ${job.failed} lỗi`
  );
  return { sendId: job.sendId, sent: job.sent, failed: job.failed };
}

async function listHistory(limit = 50) {
  return NewsCardSend.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sentBy", "fullName username")
    .lean();
}

// ===== Tự động gửi thẻ cho tin mới =====

// Chưa có cấu hình = BẬT sẵn (xã yêu cầu tự động), mốc `since` = lúc này để
// không gửi dồn tin cũ — chỉ tin cào về SAU mốc này mới được tự gửi.
async function getAutoConfig() {
  const raw = await redisGet(AUTO_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* hỏng thì tạo lại bên dưới */
    }
  }
  const cfg = { enabled: true, since: new Date().toISOString() };
  await redisSet(AUTO_KEY, JSON.stringify(cfg));
  return cfg;
}

// Bật lại sau khi đã tắt → mốc mới = lúc bật: tin xuất hiện trong lúc tắt không bị gửi bù.
async function setAutoConfig(enabled) {
  const current = await getAutoConfig();
  const next = {
    enabled: Boolean(enabled),
    since: enabled && !current.enabled ? new Date().toISOString() : current.since,
  };
  await redisSet(AUTO_KEY, JSON.stringify(next));
  return next;
}

function vnHour(date) {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Ho_Chi_Minh", hour: "numeric", hourCycle: "h23" }).format(date)
  );
}

function inAutoHours(date = new Date()) {
  const h = vnHour(date);
  return h >= AUTO_HOURS.from && h < AUTO_HOURS.to;
}

// Tin mới (tạo sau mốc bật), chưa từng gửi thẻ (kể cả gửi tay), chưa broadcast
// bài OA (tránh báo 2 lần nếu sau này bật ZALO_BROADCAST_ENABLED), chưa quá số lần thử.
async function findAutoCandidates(since) {
  const sentNewsIds = await NewsCardSend.distinct("newsId");
  return News.find({
    _id: { $nin: sentNewsIds },
    createdAt: { $gte: since },
    "zalo.broadcastedAt": null,
    "zalo.cardAttempts": { $not: { $gte: AUTO_MAX_ATTEMPTS } },
  })
    .sort({ nid: 1 })
    .limit(20)
    .lean();
}

let autoRunning = false;

async function runAutoSend() {
  if (autoRunning) return; // lượt trước còn đang gửi
  autoRunning = true;
  try {
    const cfg = await getAutoConfig();
    if (!cfg.enabled || !inAutoHours()) return;

    const candidates = await findAutoCandidates(new Date(cfg.since));
    const ready = candidates.filter((n) => !activeSends.has(String(n._id))).slice(0, AUTO_MAX_PER_RUN);

    for (const news of ready) {
      try {
        // Tin chưa có bài OA thì bước chuẩn bị của lượt gửi tự tạo bài.
        const { finished } = await sendNewsCard({ newsId: news._id, auto: true });
        await finished; // gửi xong tin này mới sang tin sau
      } catch (err) {
        await News.updateOne(
          { _id: news._id },
          { $inc: { "zalo.cardAttempts": 1 }, $set: { "zalo.cardError": err.message || "unknown" } }
        ).catch(() => {});
        console.error(`[NewsCard] Tự động gửi tin nid=${news.nid} lỗi: ${err.message}`);
      }
    }
  } catch (err) {
    console.error("[NewsCard] Lượt tự động gửi lỗi:", err.message);
  } finally {
    autoRunning = false;
  }
}

function startAutoSend() {
  // Lần đầu sau 5 phút khởi động (sau lượt tạo bài OA đầu tiên — zaloNewsService
  // chạy ở phút thứ 3), rồi mỗi 10 phút.
  setTimeout(() => {
    runAutoSend();
    setInterval(runAutoSend, AUTO_INTERVAL_MS);
  }, 5 * 60 * 1000);
  console.log(
    `[NewsCard] Bộ tự động gửi thẻ tin đã chạy (quét mỗi 10 phút, gửi ${AUTO_HOURS.from}h–${AUTO_HOURS.to}h, bật/tắt ở AdminWeb)`
  );
}

module.exports = {
  buildCard,
  listNews,
  sendTestCard,
  sendNewsCard,
  listHistory,
  getAutoConfig,
  setAutoConfig,
  runAutoSend,
  startAutoSend,
  inAutoHours,
};
