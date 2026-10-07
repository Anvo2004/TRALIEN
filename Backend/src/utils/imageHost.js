const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { publicBase, dirOf, urlOf } = require("./publicMedia");

// ============================================================
// Ảnh của tin quá nặng thì Zalo KHÔNG xử lý được bài: article/verify trả
// -200 "Upload media failed" mãi và bài không bao giờ đăng xong (kiểm chứng
// 2026-10-06 trên OA Trà Liên: ảnh bìa PNG 2,33 MB của tin nid=349214 không bao
// giờ xong, trong khi ảnh 0,24 MB xong sau 10 giây). Ảnh nặng được tải về, thu
// nhỏ thành JPEG rồi phục vụ lại từ Backend (public/images/tin/anh).
// Ảnh nhẹ giữ nguyên URL gốc. Thiếu điều kiện (PUBLIC_URL không công khai, lỗi
// tải/giải mã, chưa cài @napi-rs/canvas) thì trả lại URL gốc, không chặn luồng.
// ============================================================

const GROUP = "anh";
const MAX_SOURCE_BYTES = 1.2 * 1024 * 1024; // nhẹ hơn mức này thì để nguyên
const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;
const MAX_WIDTH = 1600; // đủ nét trong bài viết Zalo trên điện thoại
const JPEG_QUALITY = 82;
const TIMEOUT_MS = 20000;
const UA = "Mozilla/5.0 (compatible; ZaloMiniAppBot/1.0)";

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function shrink(url, out) {
  const { createCanvas, loadImage } = require("@napi-rs/canvas");
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = Buffer.from(await res.arrayBuffer());
  if (data.length > MAX_DOWNLOAD_BYTES) throw new Error("ảnh quá lớn");
  const img = await loadImage(data);
  const scale = Math.min(1, MAX_WIDTH / img.width);
  const canvas = createCanvas(Math.round(img.width * scale), Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; // JPEG không có nền trong suốt
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const jpeg = await canvas.encode("jpeg", JPEG_QUALITY);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, jpeg);
  return { bytes: jpeg.length, width: canvas.width, height: canvas.height, source: data.length };
}

// Trả URL ảnh mà Zalo tải được: ảnh nhẹ → URL gốc; ảnh nặng → bản thu nhỏ do
// Backend phục vụ (thu nhỏ 1 lần, các bài sau dùng lại file đã có).
async function zaloFriendlyImage(url) {
  if (!url || !publicBase()) return url;
  const file = `${crypto.createHash("sha1").update(url).digest("hex").slice(0, 16)}.jpg`;
  const out = path.join(dirOf(GROUP), file);
  try {
    if (await exists(out)) return urlOf(GROUP, file);
    const head = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    // Không đo được dung lượng (server không trả content-length) → giữ URL gốc,
    // không thu nhỏ bừa: phần lớn ảnh của tin vốn nhẹ và Zalo tải tốt.
    const size = head.ok ? Number(head.headers.get("content-length") || 0) : 0;
    if (!size || size <= MAX_SOURCE_BYTES) return url;
    const r = await shrink(url, out);
    console.log(
      `[AnhTin] Đã thu nhỏ ảnh ${(r.source / 1048576).toFixed(2)}MB → ${Math.round(r.bytes / 1024)}KB (${r.width}x${r.height}): ${url}`
    );
    return urlOf(GROUP, file);
  } catch (err) {
    console.warn(`[AnhTin] Không thu nhỏ được ảnh (${url}): ${err.message}`);
    return url;
  }
}

module.exports = { zaloFriendlyImage };
