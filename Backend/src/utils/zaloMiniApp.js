const config = require("../config");

// ============================================================
// Xác thực người dùng Mini App.
//
// MiniApp gọi getAccessToken() của zmp-sdk rồi gửi token lên; ở đây đổi token
// đó lấy Zalo user id THẬT qua graph.zalo.me. Nhờ vậy endpoint trả dữ liệu cá
// nhân không phải tin vào userId do client tự khai — biết userId của người khác
// cũng không đọc được phản ánh của họ.
// ============================================================

const GRAPH_ME = "https://graph.zalo.me/v2.0/me";
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 5000; // chặn cache phình vô hạn

const cache = new Map(); // accessToken -> { userId, expiresAt }

function getCached(token) {
  const hit = cache.get(token);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(token);
    return null;
  }
  return hit.userId;
}

function setCached(token, userId) {
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(token, { userId, expiresAt: Date.now() + CACHE_TTL_MS });
}

function isConfigured() {
  return Boolean(config.zalo.appSecret);
}

// Trả Zalo user id, hoặc null nếu token thiếu/sai/hết hạn. KHÔNG throw.
async function verifyAccessToken(accessToken) {
  const token = (accessToken || "").trim();
  if (!token || !isConfigured()) return null;

  const cached = getCached(token);
  if (cached) return cached;

  try {
    const url = `${GRAPH_ME}?access_token=${encodeURIComponent(token)}&fields=id`;
    const res = await fetch(url, { headers: { secret_key: config.zalo.appSecret } });
    const data = await res.json().catch(() => ({}));

    // Zalo trả 200 kèm error != 0 khi token hỏng, nên phải soi cả body.
    const userId = data?.id ? String(data.id) : "";
    if (!res.ok || !userId || (data.error && data.error !== 0)) {
      console.warn("[zaloMiniApp] Token không hợp lệ:", data?.message || `HTTP ${res.status}`);
      return null;
    }

    setCached(token, userId);
    return userId;
  } catch (err) {
    console.error("[zaloMiniApp] Lỗi xác thực token:", err.message);
    return null;
  }
}

// Middleware: gắn req.zaloUserId, chặn 401 nếu không xác thực được.
async function requireZaloUser(req, res, next) {
  if (!isConfigured()) {
    return res.status(503).json({ error: "Chưa cấu hình ZALO_APP_SECRET" });
  }

  const token = req.get("x-zalo-access-token") || "";
  const userId = await verifyAccessToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Phiên đăng nhập Zalo không hợp lệ. Vui lòng mở lại ứng dụng." });
  }

  req.zaloUserId = userId;
  next();
}

module.exports = { verifyAccessToken, requireZaloUser, isConfigured };
