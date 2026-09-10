// Cào tin tức mới nhất từ trang thông tin điện tử chính thức của xã Trà Liên
// và ghi lại vào src/data/news.js + ảnh vào src/static/news/.
//
// TODO: điền SOURCE_URL bên dưới (chưa xác nhận trang TTĐT của xã Trà Liên —
// xem docs/SETUP_CHECKLIST.md). blockRe/itemRe được viết khớp HTML của
// thangdien.danang.gov.vn (CMS dùng chung nhiều xã Đà Nẵng); nếu Trà Liên dùng
// cùng CMS có thể chạy được ngay, khác thì cần cập nhật lại regex.
//
// Cách chạy:  node scripts/scrape-tralien.js
//
// Lưu ý:
// 1. Trang nguồn không bật CORS cho domain Zalo Mini App, nên việc lấy tin
//    KHÔNG thể gọi trực tiếp từ trong app lúc chạy (runtime fetch sẽ bị chặn).
//    Vì vậy script này chạy ở máy dev / CI, ghi kết quả ra file tĩnh, rồi mới
//    build + deploy lại Mini App. Muốn tự động hoá, lên lịch chạy script này
//    (vd. cron / GitHub Actions) rồi tạo PR hoặc deploy lại thủ công.
// 2. Ảnh thumbnail trên CMS nguồn (/CMS14/pic/thumb/...) bị khai sai
//    Content-Type (khai "image/jpeg" nhưng thực chất là PNG), khiến Chrome/
//    Zalo WebView chặn bằng ERR_BLOCKED_BY_ORB nếu nhúng thẳng URL gốc. Script
//    này tải ảnh về, decode + re-encode lại bằng sharp rồi bundle như ảnh tĩnh
//    (import ES6) để tránh lỗi đó và tránh phụ thuộc uptime của trang nguồn.

import sharp from "sharp";
import { fileURLToPath } from "node:url";

const SOURCE_URL = ""; // TODO: URL trang TTĐT xã Trà Liên (xem docs/SETUP_CHECKLIST.md)
const OUTPUT_NEWS_PATH = fileURLToPath(new URL("../src/data/news.js", import.meta.url));
const IMAGES_DIR = fileURLToPath(new URL("../src/static/news/", import.meta.url));

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDate(summary) {
  // Bắt các mẫu kiểu "Chiều ngày 02/7", "Ngày 9 tháng 7", "Chiều 10/7", "sáng 05/7,"
  const m1 = summary.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (m1) {
    const day = m1[1].padStart(2, "0");
    const month = m1[2].padStart(2, "0");
    const year = m1[3] ? (m1[3].length === 2 ? `20${m1[3]}` : m1[3]) : new Date().getFullYear();
    return `${day}/${month}/${year}`;
  }
  const m2 = summary.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})/i);
  if (m2) {
    const day = m2[1].padStart(2, "0");
    const month = m2[2].padStart(2, "0");
    return `${day}/${month}/${new Date().getFullYear()}`;
  }
  return "";
}

function slugForImage(link, index) {
  const m = link.match(/nid\/(\d+)/);
  return m ? m[1] : `item-${index + 1}`;
}

async function scrape() {
  const res = await fetch(SOURCE_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TraLienMiniAppBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Không tải được trang nguồn: HTTP ${res.status}`);
  }
  const html = await res.text();

  // Mỗi khối tin theo cấu trúc: <div class='QTI_tinthuong news-k7'>...<a href='URL'><h2 class='title'>TITLE</a></h2>
  // ...<img src='IMG'>...<p class='gioithieu'>SUMMARY</p>
  const blockRe = /<div class='QTI_tinthuong news-k7'>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class='tinkhac'>/g;
  const itemRe =
    /<a href='([^']+)'><h2 class='title'>([^<]+)<\/a><\/h2>[\s\S]*?<img src='([^']+)'>[\s\S]*?<p class='gioithieu'>([^<]*)<\/p>/;

  const blocks = html.match(blockRe) || [];
  const seen = new Set();
  const items = [];

  for (const block of blocks) {
    const m = block.match(itemRe);
    if (!m) continue;
    const [, url, rawTitle, img, rawSummary] = m;
    if (seen.has(url)) continue;
    seen.add(url);

    const title = decodeEntities(rawTitle).replace(/\.\.\.$/, "").trim();
    const summary = decodeEntities(rawSummary).replace(/\.\.\.$/, "").trim();
    const date = extractDate(summary);
    const imageUrl = img.startsWith("http") ? img : new URL(img, SOURCE_URL).toString();
    const link = url.startsWith("http") ? url : new URL(url, SOURCE_URL).toString();

    items.push({
      id: items.length + 1,
      tag: "Tin tức",
      title,
      date,
      summary,
      source: "UBND xã Trà Liên",
      imageUrl,
      link,
    });
  }

  if (items.length === 0) {
    throw new Error(
      "Không tìm thấy tin nào — cấu trúc HTML của trang nguồn có thể đã thay đổi, cần cập nhật lại regex trong script."
    );
  }

  return items;
}

async function downloadAndFixImage(item, index, fs) {
  const slug = slugForImage(item.link, index);
  const filename = `${slug}.jpg`;
  const filePath = `${IMAGES_DIR}${filename}`;

  const res = await fetch(item.imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; TraLienMiniAppBot/1.0)" },
  });
  if (!res.ok) {
    throw new Error(`Không tải được ảnh ${item.imageUrl}: HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());

  // Nguồn khai sai Content-Type cho một số ảnh (vd. PNG bị gắn nhãn jpeg) khiến
  // trình duyệt chặn khi nhúng cross-origin (ERR_BLOCKED_BY_ORB). Decode theo
  // nội dung thật (sharp tự nhận diện qua magic bytes) rồi re-encode lại thành
  // jpeg chuẩn, đồng thời resize cho nhẹ.
  await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toFile(filePath);

  return `news/${filename}`;
}

function toFileContent(items, withImage, importNames) {
  const importNameByLink = new Map(withImage.map((item, i) => [item.link, importNames[i]]));

  const imports = withImage
    .map((item, i) => `import ${importNames[i]} from "../static/${item.localImage}";`)
    .join("\n");

  const arrayEntries = items
    .map((item) => {
      const importName = importNameByLink.get(item.link);
      return `  {
    id: ${item.id},
    tag: ${JSON.stringify(item.tag)},
    title: ${JSON.stringify(item.title)},
    date: ${JSON.stringify(item.date)},
    summary: ${JSON.stringify(item.summary)},
    source: ${JSON.stringify(item.source)},
    image: ${importName || "null"},
    link: ${JSON.stringify(item.link)},
  }`;
    })
    .join(",\n");

  return `// Tự động cào từ ${SOURCE_URL} — chạy \`node scripts/scrape-tralien.js\` để cập nhật lại.
// Cào lúc: ${new Date().toISOString()}
// Ảnh đã được tải về, re-encode và bundle tĩnh (xem src/static/news/).
${imports}

const NEWS = [
${arrayEntries},
];

export default NEWS;
`;
}

async function main() {
  const fs = await import("node:fs/promises");
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const items = await scrape();

  for (let i = 0; i < items.length; i++) {
    try {
      items[i].localImage = await downloadAndFixImage(items[i], i, fs);
      console.log(` - Đã tải ảnh: ${items[i].localImage}`);
    } catch (err) {
      console.warn(` - Bỏ qua ảnh lỗi (${items[i].title}): ${err.message}`);
      items[i].localImage = null;
    }
  }

  const withImage = items.filter((it) => it.localImage);
  const importNames = withImage.map((_, i) => `newsImg${i + 1}`);

  await fs.writeFile(OUTPUT_NEWS_PATH, toFileContent(items, withImage, importNames), "utf-8");
  console.log(`Đã ghi ${items.length} tin vào src/data/news.js`);
  items.forEach((it) => console.log(` - [${it.date}] ${it.title}`));
}

main().catch((err) => {
  console.error("Cào dữ liệu thất bại:", err.message);
  process.exit(1);
});
