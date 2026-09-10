const config = require("../config");

// ============================================================
// Tra cứu thủ tục hành chính / hồ sơ qua IOCTC (tctthc.1022.vn)
// - Xác thực: POST /getToken {username,password} → token (cache ~23h).
// - Tra cứu: GET /tra-cuu?ma_ho_so=... với Bearer token.
// - IOCTC thỉnh thoảng trả 500 (CAPTCHA/scrape lỗi tạm) → thử lại tối đa 3 lần.
// Khác bản Đại Lộc: dùng global fetch (không axios), KHÔNG render ảnh/gửi Zalo —
// chỉ trả JSON đã chuẩn hoá để MiniApp tự hiển thị card.
// ============================================================

const TIMEOUT_MS = 15000;

let tokenCache = { token: null, expiry: 0 };

function isConfigured() {
  return Boolean(config.ioctc.baseUrl && config.ioctc.username && config.ioctc.password);
}

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiry) return tokenCache.token;
  console.log("[IOCTC] Đang lấy token mới...");
  const res = await fetch(`${config.ioctc.baseUrl}/getToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: config.ioctc.username, password: config.ioctc.password }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`IOCTC getToken trả về ${res.status}`);
  const data = await res.json();
  const token = data.token;
  if (!token) throw new Error("Không lấy được token từ IOCTC API");
  tokenCache = { token, expiry: Date.now() + 23 * 60 * 60 * 1000 };
  console.log("[IOCTC] Lấy token thành công");
  return token;
}

function pickDate(dateField) {
  if (!dateField) return null;
  const d = dateField.$date || dateField;
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function extractDossiers(responseData) {
  if (Array.isArray(responseData?.HoSo)) return responseData.HoSo;
  if (Array.isArray(responseData)) return responseData;
  return [];
}

// Chuẩn hoá 1 hồ sơ IOCTC → shape gọn cho MiniApp
function normalize(d) {
  return {
    maHoSo: d.MaHoSo || "",
    tenTTHC: d.TenTTHC || "",
    tenTrangThai: d.TenTrangThai || "",
    donViXuLy: d.DonViXuLy || "",
    tenChuHoSo: d.TenChuHoSo || d.HoTen || "",
    ngayTiepNhan: pickDate(d.NgayTiepNhan),
    hanGiaiQuyet: pickDate(d.HanGiaiQuyet),
    ngayTraKetQua: pickDate(d.NgayTraKetQua),
  };
}

// Tra cứu theo mã hồ sơ. Trả mảng hồ sơ đã chuẩn hoá (có thể rỗng).
async function searchDossier(code) {
  const token = await getToken();
  const maHoSo = code.trim().toUpperCase();
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const url = new URL(`${config.ioctc.baseUrl}/tra-cuu`);
      url.searchParams.set("ma_ho_so", maHoSo);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status === 500 && attempt < 3) {
        console.warn(`[IOCTC] tra-cuu lỗi 500 (lần ${attempt}), thử lại sau 1.5s...`);
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      if (!res.ok) throw new Error(`IOCTC tra-cuu trả về ${res.status}`);
      const data = await res.json();
      console.log("[IOCTC] TongSo:", data?.TongSo);
      return extractDossiers(data).map(normalize);
    } catch (err) {
      lastErr = err;
      // Timeout/mạng → thử lại; hết lượt thì ném ra
      if (attempt < 3) {
        console.warn(`[IOCTC] tra-cuu lỗi ${err.message} (lần ${attempt}), thử lại sau 1.5s...`);
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

module.exports = { isConfigured, searchDossier };
