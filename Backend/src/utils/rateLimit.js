const config = require("../config");

// ============================================================
// Fixed-window rate limit, hai tầng:
//   1. Upstash Redis REST — dùng khi có cấu hình và gọi được.
//   2. Bộ đếm trong RAM   — dự phòng, tự động nhận việc khi Upstash thiếu
//      cấu hình hoặc lỗi (token sai, hết quota, mạng hỏng).
//
// Trước đây khi Upstash lỗi thì hàm này chặn sạch mọi request
// (`undefined <= limit` là false), khoá luôn cả tính năng. Sau đó sửa thành
// bỏ qua giới hạn, nhưng như vậy Trợ lý số — mỗi câu hỏi là một lần gọi
// Claude API có tính phí — lại nằm trần không có gì che. Bộ đếm RAM là lối
// giữa: mất Upstash vẫn còn lá chắn chống spam.
//
// GIỚI HẠN CỦA BỘ ĐẾM RAM:
//   - Reset mỗi lần restart backend. Chấp nhận được: cửa sổ đếm chỉ 1 giờ.
//   - Chỉ đúng khi backend chạy MỘT tiến trình (PM2 `fork`, đúng hiện trạng).
//     Nếu sau này chuyển sang PM2 `cluster` hoặc nhiều instance, mỗi tiến
//     trình giữ bộ đếm riêng nên giới hạn thực tế = limit × số tiến trình —
//     lúc đó phải sửa Upstash cho chạy lại.
// ============================================================

const memoryStore = new Map(); // key -> { count, resetAt }
const MEMORY_MAX_KEYS = 50000; // chặn RAM phình do key rác
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

let lastWarnAt = 0;
const WARN_EVERY_MS = 60 * 1000; // đừng để log ngập vì mỗi request một dòng

function warnOnce(message) {
  const now = Date.now();
  if (now - lastWarnAt < WARN_EVERY_MS) return;
  lastWarnAt = now;
  console.warn(`[rateLimit] ${message} — chuyển sang bộ đếm RAM`);
}

function sweepMemory() {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) memoryStore.delete(key);
  }
}

// unref: interval này không được giữ tiến trình sống khi backend muốn thoát.
setInterval(sweepMemory, SWEEP_INTERVAL_MS).unref();

function checkInMemory(key, limit, windowSeconds) {
  const now = Date.now();
  const entry = memoryStore.get(key);

  // Hết cửa sổ (hoặc chưa có) → mở cửa sổ mới.
  if (!entry || entry.resetAt <= now) {
    if (memoryStore.size >= MEMORY_MAX_KEYS) sweepMemory();
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, count: 1, source: "memory" };
  }

  entry.count += 1;
  return { allowed: entry.count <= limit, count: entry.count, source: "memory" };
}

async function checkRateLimit(key, limit, windowSeconds) {
  const { url, token } = config.upstash;
  if (!url || !token) return checkInMemory(key, limit, windowSeconds);

  const headers = { Authorization: `Bearer ${token}` };
  const base = url.replace(/\/+$/, "");

  try {
    const incrRes = await fetch(`${base}/incr/${encodeURIComponent(key)}`, { headers });
    const body = await incrRes.json().catch(() => ({}));
    const count = body?.result;

    if (!incrRes.ok || typeof count !== "number") {
      warnOnce(`Upstash trả về không hợp lệ (HTTP ${incrRes.status}: ${body?.error || "?"})`);
      return checkInMemory(key, limit, windowSeconds);
    }

    if (count === 1) {
      await fetch(`${base}/expire/${encodeURIComponent(key)}/${windowSeconds}`, { headers });
    }

    return { allowed: count <= limit, count, source: "upstash" };
  } catch (err) {
    warnOnce(`Không gọi được Upstash: ${err.message}`);
    return checkInMemory(key, limit, windowSeconds);
  }
}

module.exports = { checkRateLimit };
