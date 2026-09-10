const express = require("express");
const config = require("../config");
const catDienService = require("../services/catDienService");
const vanBanService = require("../services/vanBanTraLienService");
const hoSoService = require("../services/hoSoService");
const newsScrapeService = require("../services/newsScrapeService");
const TroCapSchedule = require("../models/TroCapSchedule");
const LichYTe = require("../models/LichYTe");
const Notice = require("../models/Notice");
const Village = require("../models/Village");
const DanSo = require("../models/DanSo");
const DuLich = require("../models/DuLich");
const VanHoa = require("../models/VanHoa");
const SiteInfo = require("../models/SiteInfo");

const router = express.Router();

// ===== Tin tức (cào từ trang TTĐT xã, xem config.newsSourceUrl — tạm thời thay API chia sẻ tin) =====
router.get("/news", async (req, res) => {
  const items = await newsScrapeService.listNews(20);
  res.json({ items });
});

// ===== Tra cứu hồ sơ TTHC (IOCTC — tctthc.1022.vn) =====
router.get("/tra-cuu-ho-so", async (req, res) => {
  const maHoSo = (req.query.ma_ho_so || "").trim();
  if (!maHoSo) {
    return res.status(400).json({ error: "Vui lòng nhập mã hồ sơ" });
  }
  if (!hoSoService.isConfigured()) {
    return res.status(503).json({ error: "Chức năng tra cứu hồ sơ chưa được cấu hình" });
  }
  try {
    const dossiers = await hoSoService.searchDossier(maHoSo);
    res.json({ dossiers });
  } catch (err) {
    console.error("[IOCTC] Tra cứu hồ sơ thất bại:", err.message);
    res.status(502).json({ error: "Không tra cứu được hồ sơ lúc này. Vui lòng thử lại sau." });
  }
});

// ===== Lịch cắt điện =====
router.get("/lich-cup-dien", async (req, res) => {
  const { station, dateFrom, dateTo } = req.query;
  const items = await catDienService.getOutages({ station, dateFrom, dateTo });
  res.json({ items });
});

router.get("/lich-cup-dien/tram", async (req, res) => {
  const stations = await catDienService.listStations();
  const status = await catDienService.getSyncStatus();
  res.json({
    stations,
    lastSyncedAt: status?.lastRunAt || null,
    lastSyncCount: status?.lastCount ?? null,
  });
});

// VPS này không tới được cskh-api.cpc.vn (bị chặn ở tầng mạng). Một GitHub
// Actions cron job gọi EVN CPC từ hạ tầng GitHub rồi đẩy dữ liệu thô về đây,
// xác thực bằng secret dùng chung thay vì JWT (đây là máy gọi máy, không phải
// admin đăng nhập).
router.post("/lich-cup-dien/ingest", async (req, res) => {
  if (!config.evncpc.ingestSecret) {
    console.error("[CatDien] Ingest bị từ chối: LICH_CUP_DIEN_INGEST_SECRET chưa cấu hình trên Backend");
    return res.status(503).json({ error: "Ingest secret chưa được cấu hình" });
  }
  if (req.headers["x-ingest-secret"] !== config.evncpc.ingestSecret) {
    console.warn("[CatDien] Ingest bị từ chối: secret gửi lên không khớp");
    return res.status(401).json({ error: "Sai secret" });
  }
  const { items, subOrgCode } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Thiếu mảng items" });
  }
  const count = await catDienService.ingestOutages(items, subOrgCode);
  res.json({ ok: true, count });
});

// ===== Văn bản - Chính sách =====
router.get("/van-ban", async (req, res) => {
  const { category, q, page } = req.query;
  const result = await vanBanService.listVanBan(category, q, page);
  res.json(result);
});

// ===== Thông báo trợ cấp xã hội =====
// Tra cứu theo tháng/năm — khớp với cách citizen tra cứu (chọn tháng, bấm tìm),
// không phải chỉ liệt kê "sắp tới" như trước.
router.get("/tro-cap", async (req, res) => {
  const now = new Date();
  const m = parseInt(req.query.thang) || now.getMonth() + 1;
  const y = parseInt(req.query.nam) || now.getFullYear();

  const from = new Date(Date.UTC(y, m - 1, 1, -7, 0, 0, 0));
  const to = new Date(Date.UTC(y, m, 0, 16, 59, 59, 999));

  const items = await TroCapSchedule.find({ ngayChiTra: { $gte: from, $lte: to } })
    .sort({ ngayChiTra: 1 })
    .limit(200)
    .lean();
  res.json({ items });
});

// ===== Lịch y tế =====
// Tra cứu theo tháng/năm, cùng pattern với /tro-cap ở trên (dữ liệu nhập tay
// qua AdminWeb, không có nguồn đồng bộ tự động).
router.get("/lich-y-te", async (req, res) => {
  const now = new Date();
  const m = parseInt(req.query.thang) || now.getMonth() + 1;
  const y = parseInt(req.query.nam) || now.getFullYear();

  const from = new Date(Date.UTC(y, m - 1, 1, -7, 0, 0, 0));
  const to = new Date(Date.UTC(y, m, 0, 16, 59, 59, 999));

  const items = await LichYTe.find({ ngayKham: { $gte: from, $lte: to } })
    .sort({ ngayKham: 1 })
    .limit(200)
    .lean();
  res.json({ items });
});

// ===== Thông báo khác =====
router.get("/thong-bao", async (req, res) => {
  const items = await Notice.find().sort({ createdAt: -1 }).limit(30).lean();
  res.json({ items });
});

// ===== Thôn xóm =====
router.get("/thon-xom", async (req, res) => {
  const items = await Village.find().sort({ thuTu: 1, ten: 1 }).lean();
  res.json({ items });
});

// ===== Dân số / Du lịch / Văn hóa (singleton content, sửa qua admin route) =====
router.get("/dan-so", async (req, res) => {
  const doc = (await DanSo.findOne().lean()) || {};
  res.json(doc);
});

router.get("/du-lich", async (req, res) => {
  const doc = (await DuLich.findOne().lean()) || {};
  res.json(doc);
});

router.get("/van-hoa", async (req, res) => {
  const doc = (await VanHoa.findOne().lean()) || {};
  res.json(doc);
});

router.get("/site-info", async (req, res) => {
  const doc = (await SiteInfo.findOne().lean()) || {};
  res.json(doc);
});

module.exports = router;
