const config = require("../config");
const VanBan = require("../models/VanBan");

// ============================================================
// Cào "Văn bản" (thực chất là menu tổng hợp: Văn bản Đảng ủy/HĐND/UBND/Mặt
// trận-Đoàn thể/Lịch công tác tuần/Lịch tiếp công dân — xem submenu thật) từ
// config.vanBanSourceUrl (mặc định /van-ban-chi-dao-dieu-hanh).
//
// Cùng portal VNPT với Tin tức (newsScrapeService.js) NHƯNG cấu trúc HTML
// KHÁC: danh sách phẳng <ul class="ArticleList"><li class="row"> (không chia
// theo <div class="ArticleCat"> như trang Tin tức), có ngày ban hành riêng
// trong <div class="Ngaydang"> — đáng tin hơn hẳn cách cũ (tách "Ngày
// X/Y/Z" từ tiêu đề bằng regex, không phải văn bản nào cũng viết đúng mẫu
// câu đó trong tiêu đề).
//
// Không cào trang chi tiết (dù có file PDF đính kèm thật, xem <a> "Tải về"
// trong .ArticleContent) — theo đúng quy ước cũ, chỉ dẫn dân ra detailUrl
// (trang nguồn) để xem/tải văn bản gốc, giữ cào nhẹ (không thêm 1 request/
// văn bản mỗi lần đồng bộ).
// ============================================================

function toAbsoluteUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

async function fetchListing() {
  const cheerio = require("cheerio");
  const res = await fetch(config.vanBanSourceUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (UBND-TraLien-VanBan/1.0)" },
  });
  if (!res.ok) throw new Error(`Nguồn văn bản trả về ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const rows = [];
  $("ul.ArticleList > li.row").each((_, el) => {
    const $el = $(el);
    const a = $el.find("h2.Title a").first();
    const title = a.text().replace(/\s+/g, " ").trim();
    const href = a.attr("href") || "";
    if (!title || !href) return;

    const dateStr = $el.find(".Ngaydang").first().text().replace(/\s+/g, " ").trim();
    rows.push({
      title,
      detailUrl: toAbsoluteUrl(href, config.vanBanSourceUrl),
      dateStr, // dd/MM/yyyy
    });
  });
  return rows;
}

// dateStr dạng "dd/MM/yyyy" lấy trực tiếp từ .Ngaydang — không phải đoán từ tiêu đề.
function parseNgaydang(dateStr) {
  const m = (dateStr || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  // Giờ VN (UTC+7): mốc 00:00 VN = 17:00 UTC hôm trước -> offset -7h theo giờ UTC.
  return new Date(Date.UTC(parseInt(y), parseInt(mo) - 1, parseInt(d), -7, 0, 0, 0));
}

function parseSoHieu(title) {
  const m = title.match(/số\s+([^\s,()]+\/[^\s,()]+)/iu);
  return m ? m[1].replace(/[.,;]+$/, "") : "";
}

function detectCategory(title) {
  const t = title.toLowerCase();
  if (t.includes("chính sách")) return "chinh-sach";
  if (t.includes("quy định") || t.includes("quyết định") || t.includes("nghị quyết")) return "quy-dinh";
  if (t.includes("thông báo")) return "thong-bao";
  return "khac";
}

async function syncVanBan() {
  if (!config.vanBanSourceUrl) {
    console.log("[VanBan] Bỏ qua đồng bộ: VAN_BAN_SOURCE_URL chưa được cấu hình");
    return 0;
  }

  let rows;
  try {
    rows = await fetchListing();
  } catch (err) {
    console.error("[VanBan] Cào thất bại:", err.message);
    return 0;
  }

  let upserted = 0;
  for (const r of rows) {
    const doc = {
      title: r.title,
      detailUrl: r.detailUrl,
      soHieu: parseSoHieu(r.title),
      ngayBanHanh: parseNgaydang(r.dateStr),
      category: detectCategory(r.title),
      source: "Cổng TTĐT xã Trà Liên",
      crawledAt: new Date(),
    };
    await VanBan.updateOne({ detailUrl: doc.detailUrl }, { $set: doc }, { upsert: true });
    upserted++;
  }
  console.log(`[VanBan] Đồng bộ ${upserted} văn bản`);
  return upserted;
}

function startAutoSync() {
  const cron = require("node-cron");
  syncVanBan().catch((e) => console.error("[VanBan] Sync lần đầu lỗi:", e.message));
  cron.schedule("0 6,12,18 * * *", () => {
    syncVanBan().catch((e) => console.error("[VanBan] Sync định kỳ lỗi:", e.message));
  });
  console.log("[VanBan] Đã bật tự động đồng bộ văn bản - chính sách (3 lần/ngày)");
}

async function listVanBan(category = "", query = "", page = 1) {
  const filter = {};
  if (category && category !== "all") filter.category = category;
  if (query) {
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: regex }, { soHieu: regex }];
  }

  const LIMIT = 20;
  const skip = (Math.max(1, parseInt(page) || 1) - 1) * LIMIT;

  const [items, count] = await Promise.all([
    VanBan.find(filter).sort({ ngayBanHanh: -1, crawledAt: -1 }).skip(skip).limit(LIMIT).lean(),
    VanBan.countDocuments(filter),
  ]);

  return { items, count, totalPages: Math.max(1, Math.ceil(count / LIMIT)) };
}

module.exports = { fetchListing, syncVanBan, startAutoSync, listVanBan };
