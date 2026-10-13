// Nạp icon 3D cho trang "Dịch vụ" và "Cổng dịch vụ công" (section service +
// portal), thay bộ Icons8 đang dùng ở đó để cả app về cùng một ngôn ngữ hình.
//
// Hai nguồn ảnh, đều nằm trong repo:
//   - assets/icons-tien-ich-nhanh/png-no-tile-192/*.png — bộ icon riêng của xã.
//   - MiniApp/src/static/icons3d/*.svg — bộ bổ sung sinh bằng
//     MiniApp/scripts/gen-icons3d.mjs cho các mục bộ kia chưa có.
// SVG được kết xuất thành PNG 192px trước khi upload, vì endpoint upload chỉ
// nhận PNG/WEBP (SVG có thể chứa script nên không cho tải lên).
//
// Chạy (trên VPS):
//   node scripts/import-service-icons.js --dry-run
//   node scripts/import-service-icons.js
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const config = require("../src/config");
const AppIcon = require("../src/models/AppIcon");
const AppLink = require("../src/models/AppLink");
const { uploadFromBuffer } = require("../src/utils/cloudinary");

const PACK_DIR = path.join(__dirname, "..", "..", "assets", "icons-tien-ich-nhanh", "png-no-tile-192");
const SVG_DIR = path.join(__dirname, "..", "..", "MiniApp", "src", "static", "icons3d");
const SIZE = 192;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const REUPLOAD = args.includes("--reupload");

// section | label trong AppLink | nguồn ảnh (pack:<tên file> hoặc svg:<tên file>)
const MAP = [
  ["service", "Phản ánh - Kiến nghị", "pack:11-phan-anh-cua-toi"],
  ["service", "Tra cứu hồ sơ TTHC", "pack:17-tra-cuu-ho-so"],
  ["service", "Văn bản - Chính sách", "svg:doc-seal"],
  ["service", "Lịch cắt điện", "svg:power"],
  ["service", "Lịch y tế - Tiêm chủng", "pack:09-lich-y-te"],
  ["service", "Thông báo trợ cấp", "svg:money"],
  ["service", "Phòng chống thiên tai", "pack:08-phong-chong-thien-tai"],
  ["portal", "Trợ lý Công dân số", "pack:18-danang-ai"],
  ["portal", "Cổng DVCQG", "pack:04-dich-vu-cong"],
  ["portal", "VNeID", "svg:id-card"],
  ["portal", "UBND xã", "svg:globe"],
];

// SVG -> PNG 192px nền trong suốt. @napi-rs/canvas đọc được SVG trực tiếp.
async function render(source) {
  const [kind, name] = source.split(":");
  if (kind === "pack") {
    return fs.readFileSync(path.join(PACK_DIR, `${name}.png`));
  }
  const { createCanvas, loadImage } = require("@napi-rs/canvas");
  const img = await loadImage(fs.readFileSync(path.join(SVG_DIR, `${name}.svg`)));
  const canvas = createCanvas(SIZE, SIZE);
  canvas.getContext("2d").drawImage(img, 0, 0, SIZE, SIZE);
  return canvas.toBuffer("image/png");
}

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`Connected to MongoDB${DRY_RUN ? " (dry-run: không ghi gì)" : ""}\n`);

  let uploaded = 0;
  let reused = 0;
  let assigned = 0;
  const notFound = [];

  for (const [section, label, source] of MAP) {
    const link = await AppLink.findOne({ section, label });
    if (!link) {
      notFound.push(`${section}/${label}`);
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] ${section}/${label} <- ${source}`);
      continue;
    }

    const key = `svc-${source.replace(":", "-")}`;
    const existing = await AppIcon.findOne({ key });
    let url = existing && !REUPLOAD ? existing.url : null;

    if (!url) {
      const buffer = await render(source);
      const result = await uploadFromBuffer(buffer, "tralien-icons");
      url = result.secure_url;
      uploaded += 1;
      if (existing) {
        existing.url = url;
        await existing.save();
      } else {
        await AppIcon.create({ key, label, url, group: "Dịch vụ & Cổng DVC", order: assigned + 1 });
      }
    } else {
      reused += 1;
    }

    link.iconUrl = url;
    link.updatedAt = new Date();
    await link.save();
    assigned += 1;
    console.log(`  + ${section}/${label} <- ${source}`);
  }

  console.log(`\nẢnh: tải lên ${uploaded}, dùng lại ${reused}. Gán vào AppLink: ${assigned}/${MAP.length}.`);
  if (notFound.length) console.log(`Không tìm thấy trong AppLink (đổi tên?): ${notFound.join(", ")}`);

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
