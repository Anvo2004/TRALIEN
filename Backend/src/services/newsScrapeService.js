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

// ===== Nội dung đầy đủ 1 tin (trang chi tiết) — dùng để tạo bài viết OA đầy đủ =====
// Trang chi tiết portal VNPT: .ArticleDetailControl > .ArticleHeader (tiêu đề),
// .ArticleSummary (sapo), .ArticleContent (thân bài: <p> xen <div><img>, bảng,
// danh sách). Duyệt thân bài ĐÚNG THỨ TỰ, gom đoạn văn liên tiếp thành 1 khối
// chữ, mỗi ảnh 1 khối ảnh; bảng thành từng dòng "ô | ô". Đã chạy thử trên 7
// bài thật của tralien.danang.gov.vn (tin thường, bài dài, danh sách ứng cử có ảnh).
const DETAIL_BLOCK_TAGS = new Set([
  "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul", "ol", "blockquote",
  "figure", "figcaption", "section", "article", "table", "thead", "tbody", "tr",
]);
// Nội dung bài OA không thể hiện được: file đính kèm (tin "V/v tin bão..." chỉ có
// PDF nhúng + nút "Tải về") và khung nhúng (iframe/video).
const DETAIL_FILE_RE = /\.(pdf|docx?|xlsx?|pptx?|zip|rar)(?:[?#]|$)/i;
const DETAIL_EMBED_TAGS = new Set(["iframe", "embed", "object", "video", "audio"]);

// → [{ type: "text", paragraphs: [...] } | { type: "image", url } | { type: "file", url }]
// — sapo (nếu có) là đoạn đầu; "file" = tài liệu đính kèm/khung nhúng.
function parseNewsDetail(html, pageUrl) {
  const $ = cheerio.load(html);
  const root = $(".ArticleDetailControl .ArticleContent").first().length
    ? $(".ArticleDetailControl .ArticleContent").first()
    : $(".ArticleContent").first();
  const sapo = $(".ArticleSummary").first().text().replace(/\s+/g, " ").trim();

  const blocks = sapo ? [{ type: "text", paragraphs: [sapo] }] : [];
  let para = "";
  const flush = () => {
    const text = para.replace(/\s+/g, " ").trim();
    para = "";
    if (!text) return;
    const last = blocks[blocks.length - 1];
    if (last && last.type === "text") last.paragraphs.push(text);
    else blocks.push({ type: "text", paragraphs: [text] });
  };
  const walk = (node) => {
    if (node.type === "text") {
      para += node.data;
      return;
    }
    if (node.type !== "tag" || node.name === "script" || node.name === "style") return;
    if (node.name === "img") {
      const src = $(node).attr("src") || $(node).attr("data-src") || "";
      // new URL().href giữ nguyên %XX sẵn có, chỉ mã hoá dấu cách/chữ có dấu trong src.
      const url = src ? toAbsoluteUrl(src, pageUrl) : "";
      if (url) {
        flush();
        blocks.push({ type: "image", url });
      }
      return;
    }
    const fileUrl =
      node.name === "a" && DETAIL_FILE_RE.test($(node).attr("href") || "")
        ? $(node).attr("href")
        : DETAIL_EMBED_TAGS.has(node.name)
          ? $(node).attr("src") || $(node).attr("data") || $(node).find("source").attr("src") || ""
          : null;
    if (fileUrl !== null) {
      // Bỏ chữ của link tải ("Tải về") — thay bằng khối file; cùng 1 file (link +
      // khung xem PDF) chỉ giữ 1 lần.
      const url = fileUrl ? toAbsoluteUrl(fileUrl, pageUrl) : "";
      if (url && !blocks.some((b) => b.type === "file" && b.url === url)) {
        flush();
        blocks.push({ type: "file", url });
      }
      return;
    }
    if (node.name === "br") return flush();
    if (node.name === "td" || node.name === "th") {
      for (const child of node.children || []) walk(child);
      para += " | ";
      return;
    }
    const isBlock = DETAIL_BLOCK_TAGS.has(node.name);
    if (isBlock) flush();
    for (const child of node.children || []) walk(child);
    if (node.name === "tr") para = para.replace(/\s*\|\s*$/, "");
    if (isBlock) flush();
  };
  root.contents().each((_, node) => walk(node));
  flush();
  return blocks;
}

async function fetchNewsDetail(link) {
  const res = await fetch(link, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`Không tải được trang chi tiết: HTTP ${res.status}`);
  return parseNewsDetail(await res.text(), link);
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

module.exports = {
  fetchListing,
  syncNews,
  listNews,
  startAutoSync,
  isConfigured,
  parseNewsDetail,
  fetchNewsDetail,
};
