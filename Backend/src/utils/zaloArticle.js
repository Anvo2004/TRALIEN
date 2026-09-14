const { getAccessToken, refreshAccessToken } = require("./zaloToken");

// ============================================================
// Zalo OA Open API — "Nội dung dạng Bài viết" (article).
//   Tạo:      POST https://openapi.zalo.me/v2.0/article/create  → trả "token" (xử lý bất đồng bộ)
//   Verify:   POST https://openapi.zalo.me/v2.0/article/verify   → lấy id thật (poll vài lần)
//   Broadcast:POST https://openapi.zalo.me/v2.0/oa/message       → gửi tới TOÀN BỘ người quan
//             tâm OA (recipient.target rỗng = không lọc), tối đa 5 bài/lần gọi. Zalo cần ~30
//             phút kiểm duyệt nội dung trước khi thực sự gửi tới người dùng.
//
// Cơ chế broadcast đối chiếu trực tiếp với dự án tham khảo TIENICHOAZALO_THUONGDUC
// (frontend/DangTin/src/zalo/articleClient.js) — đã chạy thật, xác nhận đúng API.
//
// QUAN TRỌNG: dùng CHUNG token OA của zaloToken.js (getAccessToken) — tuyệt đối
// không tạo bộ quản token riêng, tránh 2 nơi refresh cùng refresh-token → hỏng token.
// Retry đúng 1 lần khi Zalo báo -216 (token hết hạn), như zaloApi.js.
// ============================================================

const CREATE_URL = "https://openapi.zalo.me/v2.0/article/create";
const VERIFY_URL = "https://openapi.zalo.me/v2.0/article/verify";
const BROADCAST_URL = "https://openapi.zalo.me/v2.0/oa/message";
const TIMEOUT_MS = 15000;
const BROADCAST_MAX_ARTICLES = 5;

function truncate(str, max) {
  const s = (str || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1).trim() + "…" : s;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function articlePost(url, body, { retried = false } = {}) {
  const accessToken = await getAccessToken();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: accessToken },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await res.json();
  if (data.error === -216 && !retried) {
    await refreshAccessToken();
    return articlePost(url, body, { retried: true });
  }
  return data;
}

// Tạo 1 bài viết trên OA. Trả về "token" (chưa phải id thật) → gọi verifyArticle sau.
async function createArticle({ title, author, description, coverPhotoUrl, bodyText }) {
  if (!coverPhotoUrl) throw new Error("Bài viết Zalo bắt buộc có ảnh cover (coverPhotoUrl)");

  // Zalo công bố title 150 / description 300 nhưng thực tế từ chối chuỗi đúng bằng
  // giới hạn (Thượng Đức đã xác nhận qua log lỗi thật) → lùi biên an toàn 140/250.
  const payload = {
    type: "normal",
    title: truncate(title, 140),
    author: truncate(author || "UBND xã Trà Liên", 50),
    cover: { cover_type: "photo", photo_url: coverPhotoUrl, status: "show" },
    description: truncate(description || title, 250),
    body: [{ type: "text", content: bodyText || description || title }],
    status: "show",
    comment: "show",
  };

  const data = await articlePost(CREATE_URL, payload);
  if (data.error !== 0 || !data.data || !data.data.token) {
    throw new Error(`Tạo bài viết Zalo thất bại: ${JSON.stringify(data)}`);
  }
  return data.data.token;
}

// Zalo xử lý bất đồng bộ → poll verify vài lần để lấy id thật.
async function verifyArticle(token, { retries = 8, delayMs = 3000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const data = await articlePost(VERIFY_URL, { token });
    if (data.error === 0 && data.data && data.data.id) return data.data.id;
    if (attempt < retries) await sleep(delayMs);
  }
  throw new Error("Không lấy được id bài viết sau nhiều lần verify (Zalo xử lý chậm hơn bình thường)");
}

// Gửi (broadcast) tối đa 5 bài đã tạo tới TOÀN BỘ người quan tâm OA.
// recipient.target rỗng = không lọc theo tiêu chí gì, gửi cho tất cả.
async function broadcastArticle(articleIds) {
  if (!articleIds.length) return null;
  if (articleIds.length > BROADCAST_MAX_ARTICLES) {
    throw new Error(`Broadcast chỉ hỗ trợ tối đa ${BROADCAST_MAX_ARTICLES} bài viết mỗi lần gửi`);
  }

  const payload = {
    recipient: { target: {} },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "media",
          elements: articleIds.map((id) => ({ media_type: "article", attachment_id: id })),
        },
      },
    },
  };

  const data = await articlePost(BROADCAST_URL, payload);
  if (data.error !== 0 || !data.data || !data.data.message_id) {
    throw new Error(`Broadcast bài viết Zalo thất bại: ${JSON.stringify(data)}`);
  }
  return data.data.message_id;
}

module.exports = { createArticle, verifyArticle, broadcastArticle };
