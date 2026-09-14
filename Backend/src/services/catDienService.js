const config = require("../config");
const PowerOutage = require("../models/PowerOutage");
const SyncStatus = require("../models/SyncStatus");

async function recordSyncStatus({ source, count, error = "" }) {
  await SyncStatus.updateOne(
    { key: "lich-cup-dien" },
    { $set: { lastRunAt: new Date(), lastSource: source, lastCount: count, lastError: error } },
    { upsert: true }
  );
}

async function getSyncStatus() {
  return SyncStatus.findOne({ key: "lich-cup-dien" }).lean();
}

const DAYS_AHEAD = 14;

function fmt(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}`;
}

async function fetchSubOrgs() {
  const url = new URL(config.evncpc.orgListUrl);
  url.searchParams.set("maDonViCapTren", config.evncpc.orgCode);
  const res = await fetch(url, { headers: { version: "1.0" } });
  if (!res.ok) throw new Error(`EVN CPC organizations API trả về ${res.status}`);
  const data = await res.json();
  return (data || []).map((o) => ({ code: o.code, name: o.organizationName }));
}

async function fetchOutagesForSubOrg(subOrgCode) {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setDate(to.getDate() + DAYS_AHEAD);
  to.setHours(23, 59, 59, 0);

  const items = [];
  for (let page = 1; page <= 10; page++) {
    const url = new URL(config.evncpc.apiUrl);
    url.searchParams.set("orgCode", config.evncpc.orgCode);
    url.searchParams.set("subOrgCode", subOrgCode);
    url.searchParams.set("fromDate", fmt(from));
    url.searchParams.set("toDate", fmt(to));
    url.searchParams.set("page", page);
    url.searchParams.set("limit", 100);

    const res = await fetch(url, { headers: { version: "1.0", Accept: "application/json" } });
    if (!res.ok) throw new Error(`EVN CPC outages API trả về ${res.status}`);
    const data = await res.json();
    const batch = data?.items || [];
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

// ===== Nguồn mới: cào xenvn.com (bên thứ 3, Cloudflare — không dính EVN IP-block) =====
const XENVN_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function slug(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Parse bảng lịch của xenvn.com → items có field giống EVN (dùng chung toDoc).
// Mỗi <tr> có 3 ô: data-label "Thời Gian:" / "Lý Do:" / "Khu Vực:".
function parseXenvnHtml(html) {
  const cheerio = require("cheerio");
  const $ = cheerio.load(html);
  const items = [];
  $("tr").each((_, tr) => {
    const $tr = $(tr);
    const time = $tr.find('td[data-label="Thời Gian:"]').text().replace(/\s+/g, " ").trim();
    const area = $tr.find('td[data-label="Khu Vực:"]').text().replace(/\s+/g, " ").trim();
    const reason = $tr.find('td[data-label="Lý Do:"]').text().replace(/\s+/g, " ").trim();
    if (!area || !time) return;
    // "Từ 24/08/2026 05:30 đến 24/08/2026 08:00" → 2 mốc dd/mm/yyyy HH:MM
    const dts = [...time.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/g)];
    if (dts.length < 2) return;
    const mk = (m) => new Date(Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4] - 7, +m[5], 0)); // giờ VN → UTC
    const str = (m) =>
      `${m[4].padStart(2, "0")}:${m[5]} ${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}`;
    const fromDate = mk(dts[0]);
    const toDate = mk(dts[1]);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return;
    items.push({
      subOrganizationCode: config.evncpc.subOrgCode,
      subOrganizationName: config.evncpc.subOrgCode || "",
      stationCode: slug(area),
      stationName: area,
      fromDate,
      toDate,
      fromDateStr: str(dts[0]),
      toDateStr: str(dts[1]),
      outageType: "",
      statusStr: "",
      reason,
    });
  });
  return items;
}

function isConfigured() {
  return Boolean(config.evncpc.xenvnUrl);
}

// Nguồn xenvn.com của "Điện lực Trà My" gộp chung TOÀN BỘ khu vực điện lực phụ
// trách (nhiều xã sau sáp nhập: Trà Liên, Trà Giáp, Trà My, Trà Đốc...), không
// tách riêng theo xã — khác Thăng Điền (điện lực Thăng Bình chỉ có 1 xã dùng
// chung feed nên không cần lọc). Trà Liên = ghép xã Trà Đông + Trà Nú + Trà Kót
// (Nghị quyết 1659/NQ-UBTVQH15, xác nhận qua tìm kiếm 2026-09-14) nên phải lọc
// theo tên khu vực trước khi lưu, tránh trộn lẫn lịch cắt điện của xã khác.
//
// Danh sách khoá dưới đây CHỈ gồm tên đã xác nhận chắc chắn (không đoán theo
// tiền tố "Tak"/"Nóc" vì các tiền tố này dùng chung cho nhiều xã miền núi lân
// cận, không riêng Trà Liên):
// - "Trà Đông"/"Trà Nú"/"Trà Kót": tên 3 xã cũ trước sáp nhập.
// - "Tak Kót"/"Tak Ngưi": tên mới của Thôn 1/Thôn 2 xã Trà Kót cũ (theo đúng
//   Nghị quyết đổi tên thôn của xã Trà Liên, xác nhận qua trang Facebook
//   chính thức UBND huyện Bắc Trà My cũ).
// - "Tăk Nú"/"Làng Gạch"/"Phương Đông"/"Định Yên"/"Ba Hương": tên thôn đã xuất
//   hiện trong tin tức chính thức tralien.danang.gov.vn (xem
//   Backend/scripts/seed-site-content.js, docs/SETUP_CHECKLIST.md mục Thôn xóm).
//
// Có những khu vực trong feed KHÔNG khớp allowlist này (VD: "TBA LăngPok",
// "TBA TakRâu", "TBA Tak Lủ", "Nóc Ông Xích", "TBA Nóc Ông Thu" — quan sát
// 2026-09-14) mà KHÔNG xác nhận được thuộc Trà Liên hay xã lân cận nên bị bỏ
// qua (an toàn hơn là đoán sai và trộn nhầm lịch của xã khác). Nếu UBND xã xác
// nhận thêm thôn thuộc diện này, thêm tên vào mảng bên dưới.
const TRA_LIEN_STATION_KEYWORDS = [
  "Trà Đông",
  "Trà Nú",
  "Trà Kót",
  "Tak Kót",
  "Tăk Kót",
  "Tak Ngưi",
  "Tăk Ngưi",
  "Tak Nú",
  "Tăk Nú",
  "Làng Gạch",
  "Phương Đông",
  "Định Yên",
  "Ba Hương",
];
const TRA_LIEN_KEYWORD_SLUGS = TRA_LIEN_STATION_KEYWORDS.map(slug);

function isTraLienStation(stationName) {
  const s = slug(stationName);
  return TRA_LIEN_KEYWORD_SLUGS.some((kw) => kw && s.includes(kw));
}

async function fetchFromXenvn() {
  const res = await fetch(config.evncpc.xenvnUrl, {
    headers: { "User-Agent": XENVN_UA },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`xenvn.com trả về HTTP ${res.status}`);
  const html = await res.text();
  if (!html.includes("Điện lực Trà My") && !html.includes("Lịch cúp điện") && !html.includes("xenvn")) {
    throw new Error("Nội dung trả về từ xenvn.com không đúng cấu trúc trang");
  }
  return parseXenvnHtml(html);
}

function toDoc(it) {
  return {
    subOrgCode: it.subOrganizationCode || "",
    subOrgName: it.subOrganizationName || "",
    stationCode: it.stationCode || "",
    stationName: it.stationName || "",
    fromDate: it.fromDate ? new Date(it.fromDate) : null,
    toDate: it.toDate ? new Date(it.toDate) : null,
    fromDateStr: it.fromDateStr || "",
    toDateStr: it.toDateStr || "",
    outageType: it.outageType || "",
    statusStr: it.statusStr || "",
    reason: it.reason || "",
    crawledAt: new Date(),
  };
}

async function upsertItems(items, code) {
  let upserted = 0;
  for (const it of items) {
    const doc = toDoc(it);
    if (!doc.subOrgCode) doc.subOrgCode = code;
    if (!doc.stationCode || !doc.fromDate || !doc.toDate) continue;
    await PowerOutage.updateOne(
      { stationCode: doc.stationCode, fromDate: doc.fromDate, toDate: doc.toDate },
      { $set: doc },
      { upsert: true }
    );
    upserted++;
  }
  return upserted;
}

// Đồng bộ lịch cắt điện — nguồn CHÍNH giờ là xenvn.com (cào thẳng trên VPS được,
// vì xenvn nằm sau Cloudflare, hạ tầng khác EVN nên KHÔNG dính EVN chặn IP như
// cskh-api.cpc.vn). Thay cho luồng EVN CPC + GitHub Actions ingest trước đây.
async function syncOutages() {
  if (!isConfigured()) {
    console.log("[CatDien] Bỏ qua đồng bộ: XENVN_URL chưa được cấu hình");
    return 0;
  }

  let items;
  try {
    items = await fetchFromXenvn();
  } catch (e1) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      items = await fetchFromXenvn();
    } catch (e2) {
      // Ghi lỗi vào SyncStatus: xenvn giờ là nguồn thật (khác EVN trước đây luôn
      // fail nên cố tình bỏ qua) → cần thấy được khi cào hỏng để còn biết mà xử lý.
      console.error(`[CatDien] Cào xenvn.com thất bại: ${e2.message}`);
      await recordSyncStatus({ source: "xenvn-vps", count: 0, error: e2.message });
      return 0;
    }
  }

  const filtered = items.filter((it) => isTraLienStation(it.stationName));
  const skipped = items.length - filtered.length;

  const syncStart = new Date();
  const upserted = await upsertItems(filtered, config.evncpc.subOrgCode);

  // Dọn lịch trong khung CÒN HIỆU LỰC (toDate >= đầu ngày hôm nay, giờ VN — đúng
  // khung mà getOutages hiển thị) nhưng KHÔNG được lần cào này cập nhật (crawledAt
  // cũ hơn syncStart). Gồm: bản ghi EVN cũ còn sót từ luồng GitHub Actions ingest
  // trước đây (mã trạm khác slug nên không bị upsert đè → sinh lịch trùng), và
  // lịch mà xenvn đã gỡ. Chỉ chạy sau khi cào xenvn THÀNH CÔNG nên nếu xenvn lỗi
  // (đã return ở trên) thì không xoá nhầm dữ liệu dự phòng.
  const vnNow = new Date(Date.now() + 7 * 3600000);
  const startTodayVN = new Date(
    Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), -7, 0, 0, 0)
  );
  const purge = await PowerOutage.deleteMany({
    toDate: { $gte: startTodayVN },
    crawledAt: { $lt: syncStart },
  });

  console.log(
    `[CatDien] Cào xenvn.com: ${items.length} lịch (${skipped} ngoài khu vực Trà Liên, bỏ qua), upsert ${upserted}, dọn ${purge.deletedCount || 0} lịch cũ`
  );
  await recordSyncStatus({ source: "xenvn-vps", count: upserted });
  return upserted;
}

// Nhận dữ liệu EVN CPC đã được fetch từ nơi khác (VD: GitHub Actions, nơi
// không bị chặn mạng tới cskh-api.cpc.vn) và lưu vào DB — dùng chung logic
// upsert với syncOutages() ở trên.
async function ingestOutages(items, subOrgCode) {
  const code = subOrgCode || config.evncpc.subOrgCode;
  const received = (items || []).length;
  const upserted = await upsertItems(items || [], code);
  console.log(
    `[CatDien] Nhận ${received} bản ghi qua ingest, upsert ${upserted} (đơn vị ${code})`
  );
  await recordSyncStatus({ source: "github-actions-ingest", count: upserted });
  return upserted;
}

// dateStr: "yyyy-mm-dd" (native <input type="date"> format). Converts to the
// UTC instant range covering that calendar day in Vietnam time (UTC+7).
function vnDayRange(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, d, -7, 0, 0, 0)),
    end: new Date(Date.UTC(y, m - 1, d, 16, 59, 59, 999)),
  };
}

async function getOutages({ station = "", dateFrom = "", dateTo = "" } = {}) {
  const filter = {};

  if (dateFrom || dateTo) {
    const vnNow = new Date(Date.now() + 7 * 3600000);
    const todayStr = `${vnNow.getUTCFullYear()}-${String(vnNow.getUTCMonth() + 1).padStart(2, "0")}-${String(
      vnNow.getUTCDate()
    ).padStart(2, "0")}`;
    const fromStr = dateFrom || todayStr;
    const toStr = dateTo || dateFrom || todayStr;
    const { start } = vnDayRange(fromStr);
    const { end } = vnDayRange(toStr);
    filter.fromDate = { $gte: start, $lte: end };
  } else {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 3600000);
    filter.toDate = {
      $gte: new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), -7, 0, 0, 0)),
    };
  }

  if (station && station !== "all") {
    filter.stationName = station;
  }

  return PowerOutage.find(filter).sort({ fromDate: 1 }).limit(100).lean();
}

async function listStations() {
  const names = await PowerOutage.distinct("stationName");
  return names.filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"));
}

function startAutoSync() {
  const cron = require("node-cron");
  syncOutages().catch((e) => console.error("[CatDien] Sync lần đầu lỗi:", e.message));
  cron.schedule("*/30 * * * *", () => {
    syncOutages().catch((e) => console.error("[CatDien] Sync định kỳ lỗi:", e.message));
  });
  console.log("[CatDien] Đã bật tự động đồng bộ lịch cắt điện (mỗi 30 phút)");
}

module.exports = {
  fetchSubOrgs,
  fetchOutagesForSubOrg,
  fetchFromXenvn,
  parseXenvnHtml,
  isTraLienStation,
  syncOutages,
  ingestOutages,
  getOutages,
  listStations,
  getSyncStatus,
  startAutoSync,
  isConfigured,
};
