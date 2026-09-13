const config = require("../config");

// ============================================================
// Đồng bộ phản ánh sang Cổng góp ý 1022 (gopy.danang.gov.vn)
// Cơ chế THẬT (đã probe production bởi dự án Đại Lộc, khác tài liệu 2022):
// - Xác thực: HTTP Basic Auth (username/password) trên mỗi request — KHÔNG có JWT.
// - Đẩy góp ý: POST {baseUrl}{gopyPath}  (mặc định /api/gopy)
// - BẮT BUỘC User-Agent trình duyệt, nếu không WAF trả 403.
// - KHÔNG ép Accept: application/json (server trả 406) — để Accept: */*.
// Nguyên tắc: KHÔNG được chặn luồng tiếp nhận phản ánh của người dân —
// mọi lỗi ở đây chỉ log + đánh dấu chưa sync để retry job xử lý sau.
// (Viết bằng global fetch để không thêm dependency axios — như catDienService.)
// ============================================================

const TIMEOUT_MS = 10000;
// UA trình duyệt để vượt WAF của gopy.danang.gov.vn
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function basicAuthHeader() {
  const token = Buffer.from(`${config.cgy1022.username}:${config.cgy1022.password}`).toString(
    "base64"
  );
  return `Basic ${token}`;
}

function baseHeaders() {
  return {
    Authorization: basicAuthHeader(),
    "User-Agent": USER_AGENT,
    Accept: "*/*",
  };
}

function isConfigured() {
  return Boolean(config.cgy1022.baseUrl && config.cgy1022.username && config.cgy1022.password);
}

// Đọc map lĩnh vực từ env (JSON: tên danh mục → linhVucId 1022)
function getLinhVucId(categoryName) {
  try {
    const map = JSON.parse(config.cgy1022.linhVucMap);
    if (categoryName && map[categoryName] != null) return Number(map[categoryName]);
  } catch (e) {
    console.error("[CGY1022] CGY1022_LINHVUC_MAP không phải JSON hợp lệ:", e.message);
  }
  return config.cgy1022.linhVucDefault !== "" ? Number(config.cgy1022.linhVucDefault) : null;
}

// Map document Feedback (đã populate categoryId) → body POST /api/gopy
function buildPayload(fb) {
  const categoryName = fb.categoryId?.name || "";
  const created = new Date(fb.createdAt || Date.now());

  // Giờ VN cho ngayDienRa (dd/MM/yyyy) + thoiGianDienRa (HH:mm)
  const vn = new Date(created.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const pad = (n) => String(n).padStart(2, "0");
  const ngayDienRa = `${pad(vn.getDate())}/${pad(vn.getMonth() + 1)}/${vn.getFullYear()}`;
  const thoiGianDienRa = `${pad(vn.getHours())}:${pad(vn.getMinutes())}`;

  // Tiêu đề = tiêu đề người dân nhập, không có thì tóm tắt nội dung. KHÔNG chèn
  // tên loại (lĩnh vực đã có cột riêng trên 1022) và KHÔNG chèn mã tự sinh —
  // mã định danh duy nhất là gopyId do 1022 trả về, lưu lại ở cgy1022.gopyId.
  const content = fb.content || "";
  const base = (fb.title || "").trim() || content;
  const tieuDe = `${base.slice(0, 100)}${base.length > 100 ? "…" : ""}`;

  const imageUrls =
    fb.imageUrls && fb.imageUrls.length > 0 ? fb.imageUrls : fb.imageUrl ? [fb.imageUrl] : [];

  return {
    userId: Number(config.cgy1022.userId) || 0,
    tenDayDu: fb.displayName || "Người dân xã Trà Liên",
    email: config.cgy1022.defaultEmail,
    soDienThoai: fb.contact || "",
    tieuDe,
    noiDungYKien: content,
    noiDienRa: fb.location?.address || "Xã Trà Liên, Đà Nẵng",
    latitude: fb.location?.lat ?? 0,
    longitude: fb.location?.lng ?? 0,
    ngayDienRa,
    thoiGianDienRa,
    videos: "",
    amThanh: "",
    hinhAnhs: imageUrls.map((url, i) => ({ url, ten: `Ảnh phản ánh ${i + 1}` })),
    fileDinhKem: { url: "", ten: "" },
    linhVucId: getLinhVucId(categoryName),
    nguonGopY: config.cgy1022.nguon,
  };
}

// Đẩy 1 phản ánh lên 1022. Trả { ok: true, gopyId } hoặc { ok: false, error }
// KHÔNG throw — caller không phải bọc try/catch.
async function pushFeedback(fb) {
  if (!isConfigured()) return { ok: false, error: "CGY1022 chưa cấu hình (.env)" };

  const payload = buildPayload(fb);
  if (payload.linhVucId == null) {
    return { ok: false, error: `Chưa map linhVucId cho danh mục "${fb.categoryId?.name || "?"}"` };
  }

  const url = `${config.cgy1022.baseUrl}${config.cgy1022.gopyPath}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...baseHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    // Nhận diện id linh hoạt, 2xx coi là thành công
    const gopyId = String(data?.id ?? data?.data?.id ?? data?.yKienId ?? "");
    console.log(
      `[CGY1022] Đẩy phản ánh ${fb._id} thành công${gopyId ? ` (gopyId=${gopyId})` : ""}`
    );
    if (!gopyId) {
      console.warn(`[CGY1022] ⚠️ 1022 không trả mã cho phản ánh ${fb._id} — phản hồi: ${text.slice(0, 200)}`);
    }
    return { ok: true, gopyId };
  } catch (err) {
    console.error("[CGY1022] Đẩy phản ánh thất bại:", err.message);
    return { ok: false, error: err.message };
  }
}

// GET danh sách phản ánh (read-only) — dùng để probe/verify kết nối mà không ghi gì.
async function listFeedbacks({ page = 1, size = 5, keyword = "" } = {}) {
  const url = new URL(`${config.cgy1022.baseUrl}${config.cgy1022.gopyPath}`);
  url.searchParams.set("page", page);
  url.searchParams.set("size", size);
  if (keyword) url.searchParams.set("keyword", keyword);

  const res = await fetch(url, {
    headers: baseHeaders(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// GET chi tiết 1 góp ý theo gopyId — dùng để đọc lại tình trạng xử lý
// (maTinhTrangXuLy, thongTinXuLy[]) sau khi đã đẩy lên 1022. Xem
// "Tài liệu mô tả API" (docs/Nâng Cấp CGY-Tài liệu mô tả API.docx),
// mục "API lấy chi tiết góp ý" — GET /public/gopy/{id}. Tài liệu mô tả
// domain/JWT khác thực tế đã probe (xem comment đầu file), nhưng CẤU TRÚC
// response mục này chưa có gì mâu thuẫn với phần đã probe (cùng base
// path /public/gopy như POST đẩy góp ý), nên dùng chung basicAuthHeader().
async function getFeedbackDetail(gopyId) {
  const url = `${config.cgy1022.baseUrl}${config.cgy1022.gopyPath}/${gopyId}`;
  const res = await fetch(url, {
    headers: baseHeaders(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

module.exports = {
  isConfigured,
  pushFeedback,
  buildPayload,
  getLinhVucId,
  listFeedbacks,
  getFeedbackDetail,
};
