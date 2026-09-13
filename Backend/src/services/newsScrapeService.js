const cheerio = require("cheerio");
const config = require("../config");
const News = require("../models/News");

// ============================================================
// Cào tin tức mới nhất từ trang TTĐT xã (config.newsSourceUrl) → Mongo News.
// TẠM THỜI thay cho API chia sẻ tin khi chưa có Base URL.
//
// Trang tralien.danang.gov.vn dùng portal VNPT (iGate/LGSP, theme "qnm-ubnd" —
// hạ tầng cũ của Quảng Nam, xã vẫn dùng lại sau sáp nhập) — KHÁC HẲN CMS
// "CMS14" của Thăng Điền (bản cào cũ dùng regex khớp class `QTI_tinthuong
// news-k7` đã bỏ, không áp dụng được cho Trà Liên). Trang /tin-tuc liệt kê
// tin theo từng khối <div class="ArticleCat"> (1 khối/chuyên mục), mỗi khối
// có <ul class="ArticleOfCat"><li> chứa 1 tin. Ảnh nguồn phục vụ đúng
// Content-Type (image/jpeg, đã kiểm tra) nên nhúng thẳng được, KHÔNG cần
// re-host qua Cloudinary như CMS cũ (vốn khai sai Content-Type gây
// ERR_BLOCKED_BY_ORB).
// ============================================================

const UA = "Mozilla/5.0 (compatible; TraLienMiniAppBot/1.0)";

// Rút gọn vài tên chuyên mục quá dài cho vừa badge nhỏ trên UI — không đổi
// tên hiển thị đầy đủ ở đâu khác, chỉ dùng cho field `tag`.
const CATEGORY_ALIAS = {
  "Hoạt Động Lãnh Đạo": "Lãnh đạo",
  "Xây Dựng Đảng – Chính Quyền": "Đảng - Chính quyền",
  "Quốc phòng - An ninh": "Quốc phòng - AN",
  "Phòng Chống Thiên Tai": "Thiên tai",
  "Y Tế - Văn Hóa - Xã Hội - KHCN": "Y tế - VH - XH",
  "Kinh tế - Nông thôn mới - OCOP": "Kinh tế - OCOP",
  "Hoạt Động Mặt Trận – Đoàn Thể": "Mặt trận - Đoàn thể",
  "Hoạt động Giáo dục - Đào tạo": "Giáo dục",
  "Thông tin tuyên truyền": "Tuyên truyền",
};

function isConfigured() {
  return Boolean(config.newsSourceUrl);
}

function shortCategory(name) {
  if (CATEGORY_ALIAS[name]) return CATEGORY_ALIAS[name];
  return name.length > 20 ? "Tin tức" : name;
}

function toAbsoluteUrl(src, base) {
  if (!src) return "";
  try {
    return new URL(src, base).href;
  } catch {
    return "";
  }
}

// Trả [{ nid, title, summary, date, tag, link, imageUrl }], đã khử trùng theo nid.
async function fetchListing() {
  const SOURCE_URL = config.newsSourceUrl;
  const res = await fetch(SOURCE_URL, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Không tải được trang nguồn: HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const seen = new Set();
  const items = [];

  $("div.ArticleCat").each((_, catEl) => {
    const category = $(catEl).find(".ArticleCatName a").first().text().trim();

    $(catEl)
      .find("ul.ArticleOfCat > li")
      .each((__, li) => {
        const $li = $(li);
        const titleA = $li.find("h2.Title a").first();
        const title = titleA.text().replace(/\s+/g, " ").trim();
        const href = titleA.attr("href") || "";
        if (!title || !href) return;

        const nidMatch = href.match(/-(\d+)$/);
        if (!nidMatch) return;
        const nid = Number(nidMatch[1]);
        if (seen.has(nid)) return;
        seen.add(nid);

        const summary = $li.find("p").first().text().replace(/\s+/g, " ").trim();
        const date = $li.find(".Ngaydang").first().text().trim();
        const img = $li.find("img").first().attr("src") || "";

        items.push({
          nid,
          title,
          summary,
          date,
          tag: category ? shortCategory(category) : "Tin tức",
          link: toAbsoluteUrl(href, SOURCE_URL),
          imageUrl: toAbsoluteUrl(img, SOURCE_URL),
        });
      });
  });

  return items;
}

// Upsert theo nid — tin mới tạo mới, tin đã có cập nhật lại text/ảnh (ảnh nhúng
// thẳng từ nguồn, không lưu file riêng nên cứ ghi đè theo bản mới nhất).
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
        {
          $set: {
            title: it.title,
            summary: it.summary,
            date: it.date,
            tag: it.tag,
            link: it.link,
            imageUrl: it.imageUrl,
          },
        }
      );
      continue;
    }
    await News.create({
      nid: it.nid,
      title: it.title,
      summary: it.summary,
      date: it.date,
      tag: it.tag,
      source: "UBND xã Trà Liên",
      link: it.link,
      imageUrl: it.imageUrl,
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
