const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const config = require("../config");

// ============================================================
// Văn bản PDF → ảnh JPEG từng trang, lưu ở public/images/tin/ (phục vụ qua
// /images, xem app.js) để đưa vào bài viết Zalo OA dạng khối ảnh — tin chỉ có
// văn bản PDF (vd. "V/v tin bão...") vẫn đọc được đầy đủ ngay trong bài OA
// (xem zaloNewsService.attachPdfPages).
//
// Render bằng pdfjs-dist (bản legacy cho Node, cần Node >= 20) + @napi-rs/canvas
// — pdfjs 4.x cần đúng dòng @napi-rs/canvas 0.1.x (bản 1.x lệch kiểu Path2D,
// render lỗi "Value is none of these types String, Path").
// Tự tắt, trả null (bài OA giữ link văn bản như cũ) khi: không nạp được thư
// viện (binary lỗi trên VPS), PUBLIC_URL không phải https công khai (Zalo không
// tải được ảnh), hoặc tải/đọc file lỗi.
// ============================================================

const OUT_DIR = path.join(__dirname, "..", "..", "public", "images", "tin");
const PAGE_WIDTH = 1200; // px — đủ nét để đọc chữ văn bản trên điện thoại
const MAX_PAGE_HEIGHT = 4000; // trang dài bất thường thì thu theo chiều cao
const JPEG_QUALITY = 80; // ~150–300 KB/trang A4
const MAX_PDF_BYTES = 25 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 30000;
const UA = "Mozilla/5.0 (compatible; ZaloMiniAppBot/1.0)";

let libsPromise = null;

function loadLibs() {
  if (!libsPromise) {
    libsPromise = (async () => {
      const { createCanvas } = require("@napi-rs/canvas");
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const pkgDir = path.dirname(require.resolve("pdfjs-dist/package.json"));
      return { createCanvas, pdfjs, pkgDir };
    })();
  }
  return libsPromise;
}

// Gốc URL công khai của Backend — Zalo tải ảnh từ Internet nên localhost/http không dùng được.
function publicBase() {
  const base = (config.publicUrl || "").replace(/\/+$/, "");
  if (!/^https:\/\//i.test(base) || /^https:\/\/(localhost|127\.|0\.0\.0\.0)/i.test(base)) return "";
  return base;
}

async function download(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (Number(res.headers.get("content-length") || 0) > MAX_PDF_BYTES) throw new Error("file quá lớn");
  const data = new Uint8Array(await res.arrayBuffer());
  if (data.length > MAX_PDF_BYTES) throw new Error("file quá lớn");
  if (!Buffer.from(data.subarray(0, 1024)).includes("%PDF-")) throw new Error("không phải file PDF");
  return data;
}

async function readInfo(dir) {
  try {
    return JSON.parse(await fs.readFile(path.join(dir, "info.json"), "utf8"));
  } catch {
    return null;
  }
}

// → { totalPages, pages: [URL ảnh công khai của maxPages trang đầu] } | null.
// Cùng 1 file chỉ render 1 lần (thư mục theo hash URL) — tạo lại bài OA sau
// này dùng lại ảnh cũ. Ảnh giữ lâu dài, không dọn: bài OA đã tạo trỏ tới chúng.
async function renderPdfPages(pdfUrl, { maxPages = 20 } = {}) {
  const base = publicBase();
  if (!base) {
    console.warn(`[PdfPages] PUBLIC_URL (${config.publicUrl}) không phải https công khai — bỏ qua chuyển PDF thành ảnh`);
    return null;
  }
  if (maxPages < 1) return null;

  const key = crypto.createHash("sha1").update(pdfUrl).digest("hex").slice(0, 16);
  const dir = path.join(OUT_DIR, key);
  const pageUrls = (n) => Array.from({ length: n }, (_, i) => `${base}/images/tin/${key}/trang-${i + 1}.jpg`);

  const cached = await readInfo(dir);
  if (cached && cached.rendered >= Math.min(maxPages, cached.totalPages)) {
    return { totalPages: cached.totalPages, pages: pageUrls(Math.min(maxPages, cached.totalPages)) };
  }

  try {
    const { createCanvas, pdfjs, pkgDir } = await loadLibs();
    const doc = await pdfjs.getDocument({
      data: await download(pdfUrl),
      standardFontDataUrl: path.join(pkgDir, "standard_fonts") + path.sep,
      cMapUrl: path.join(pkgDir, "cmaps") + path.sep,
      cMapPacked: true,
      isEvalSupported: false,
      verbosity: 0, // chỉ báo lỗi, không in cảnh báo font
    }).promise;
    try {
      const count = Math.min(doc.numPages, maxPages);
      await fs.mkdir(dir, { recursive: true });
      for (let i = 1; i <= count; i++) {
        const page = await doc.getPage(i);
        const size = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale: Math.min(PAGE_WIDTH / size.width, MAX_PAGE_HEIGHT / size.height),
        });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff"; // nền trắng — JPEG không có nền trong suốt
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        await fs.writeFile(path.join(dir, `trang-${i}.jpg`), await canvas.encode("jpeg", JPEG_QUALITY));
        page.cleanup();
      }
      // info.json ghi SAU khi đủ trang — render dở dang thì lần sau render lại.
      await fs.writeFile(
        path.join(dir, "info.json"),
        JSON.stringify({ url: pdfUrl, totalPages: doc.numPages, rendered: count, at: new Date().toISOString() })
      );
      console.log(`[PdfPages] Đã chuyển ${count}/${doc.numPages} trang PDF thành ảnh: ${pdfUrl}`);
      return { totalPages: doc.numPages, pages: pageUrls(count) };
    } finally {
      await doc.destroy();
    }
  } catch (err) {
    console.warn(`[PdfPages] Không chuyển được PDF thành ảnh (${pdfUrl}): ${err.message}`);
    return null;
  }
}

module.exports = { renderPdfPages };
