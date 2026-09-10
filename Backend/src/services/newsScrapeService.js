const config = require("../config");
const News = require("../models/News");
const { uploadFromBuffer } = require("../utils/cloudinary");

// ============================================================
// Cào tin tức mới nhất từ trang TTĐT xã (config.newsSourceUrl) → Mongo News.
// TẠM THỜI thay cho API chia sẻ tin (/chuyenmuc, /tinnoibat) khi chưa có Base URL.
//
// Vì sao cào ở Backend chứ không ở MiniApp:
// 1) Trang nguồn không bật CORS cho domain Zalo Mini App → app không fetch trực tiếp được.
// 2) Ảnh nguồn (/CMS14/pic/thumb/...) khai sai Content-Type → nhúng thẳng bị
//    ERR_BLOCKED_BY_ORB trong WebView. Nên re-host qua Cloudinary (phục vụ đúng type).
//
// Regex parse (blockRe/itemRe) được viết khớp HTML của thangdien.danang.gov.vn —
// CMS dùng chung nhiều xã Đà Nẵng nên NHIỀU KHẢ NĂNG khớp luôn nếu Trà Liên
// cùng CMS, nhưng CHƯA kiểm chứng trên trang thật của Trà Liên (chưa xác nhận
// URL — xem config.newsSourceUrl / docs/SETUP_CHECKLIST.md). Khi có API thật:
// chỉ thay fetchListing() bằng gọi API + map JSON.
// ============================================================

const UA = "Mozilla/5.0 (compatible; TraLienMiniAppBot/1.0)";

function isConfigured() {
  return Boolean(config.newsSourceUrl);
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDate(summary) {
  const m1 = summary.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (m1) {
    const day = m1[1].padStart(2, "0");
    const month = m1[2].padStart(2, "0");
    const year = m1[3] ? (m1[3].length === 2 ? `20${m1[3]}` : m1[3]) : new Date().getFullYear();
    return `${day}/${month}/${year}`;
  }
  const m2 = summary.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})/i);
  if (m2) {
    return `${m2[1].padStart(2, "0")}/${m2[2].padStart(2, "0")}/${new Date().getFullYear()}`;
  }
  return "";
}

const blockRe =
  /<div class='QTI_tinthuong news-k7'>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class='tinkhac'>/g;
const itemRe =
  /<a href='([^']+)'><h2 class='title'>([^<]+)<\/a><\/h2>[\s\S]*?<img src='([^']+)'>[\s\S]*?<p class='gioithieu'>([^<]*)<\/p>/;

// Trả [{ nid, title, summary, date, link, imageUrl(absolute) }], đã khử trùng theo nid.
async function fetchListing() {
  const SOURCE_URL = config.newsSourceUrl;
  const res = await fetch(SOURCE_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Không tải được trang nguồn: HTTP ${res.status}`);
  const html = await res.text();

  const blocks = html.match(blockRe) || [];
  const seen = new Set();
  const items = [];
  for (const block of blocks) {
    const m = block.match(itemRe);
    if (!m) continue;
    const [, url, rawTitle, img, rawSummary] = m;
    const nidMatch = url.match(/nid\/(\d+)/);
    if (!nidMatch) continue;
    const nid = Number(nidMatch[1]);
    if (seen.has(nid)) continue;
    seen.add(nid);

    const title = decodeEntities(rawTitle).replace(/\.\.\.$/, "").trim();
    const summary = decodeEntities(rawSummary).replace(/\.\.\.$/, "").trim();
    items.push({
      nid,
      title,
      summary,
      date: extractDate(summary),
      // Trang nguồn tự chèn href dạng http:// dù chỉ https:// mới chạy được
      // (http redirect sang https) — ép https luôn để openWebview phía Mini App
      // không bị reject vì URL không secure.
      link: (url.startsWith("http") ? url : new URL(url, SOURCE_URL).toString()).replace(
        /^http:\/\//i,
        "https://"
      ),
      imageUrl: img ? (img.startsWith("http") ? img : new URL(img, SOURCE_URL).toString()) : "",
    });
  }
  return items;
}

async function rehostImage(srcUrl) {
  try {
    const res = await fetch(srcUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) return "";
    const buffer = Buffer.from(await res.arrayBuffer());
    const result = await uploadFromBuffer(buffer, "tralien-news");
    return result.secure_url || "";
  } catch (err) {
    console.warn(`[News] Bỏ qua ảnh lỗi ${srcUrl}: ${err.message}`);
    return "";
  }
}

// Cào + upsert theo nid. Tin mới: re-host ảnh 1 lần rồi tạo. Tin đã có: cập nhật
// text nhẹ, GIỮ nguyên ảnh Cloudinary (không upload lại → tránh phình Cloudinary).
async function syncNews() {
  if (!isConfigured()) {
    console.log("[News] Bỏ qua đồng bộ: NEWS_SOURCE_URL chưa được cấu hình");
    return 0;
  }
  const items = await fetchListing();
  let created = 0;
  for (const it of items) {
    const existing = await News.findOne({ nid: it.nid }).select("_id").lean();
    if (existing) {
      await News.updateOne(
        { nid: it.nid },
        { $set: { title: it.title, summary: it.summary, date: it.date, link: it.link } }
      );
      continue;
    }
    const imageUrl = it.imageUrl ? await rehostImage(it.imageUrl) : "";
    await News.create({
      nid: it.nid,
      title: it.title,
      summary: it.summary,
      date: it.date,
      tag: "Tin tức",
      source: "UBND xã Trà Liên",
      link: it.link,
      imageUrl,
      scrapedAt: new Date(),
    });
    created++;
  }
  console.log(`[News] Đồng bộ ${items.length} tin (mới: ${created})`);
  return created;
}

// Tin mới nhất — sắp theo nid giảm dần (id bài lớn hơn ~ bài mới hơn).
async function listNews(limit = 20) {
  return News.find().sort({ nid: -1 }).limit(limit).lean();
}

function startAutoSync() {
  const cron = require("node-cron");
  syncNews().catch((e) => console.error("[News] Sync lần đầu lỗi:", e.message));
  cron.schedule("30 5,11,17 * * *", () => {
    syncNews().catch((e) => console.error("[News] Sync định kỳ lỗi:", e.message));
  });
  console.log("[News] Đã bật tự động cào tin tức (3 lần/ngày)");
}

module.exports = { fetchListing, syncNews, listNews, startAutoSync, isConfigured };
