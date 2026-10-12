// Nạp bộ icon riêng của xã (assets/icons-tien-ich-nhanh) vào thư viện AppIcon và
// gán cho từng mục trong lưới "Tiện ích nhanh".
//
// Khác scripts/seed-app-icons.js: script kia tải icon Icons8 từ mạng, script này
// đọc ảnh có sẵn trong repo — bộ icon do xã tự thiết kế nên không vướng giấy
// phép bên thứ ba, và có luôn file SVG gốc trong assets/.../svg/ để sửa sau này.
//
// Chạy (trên VPS, nơi có MongoDB thật):
//   node scripts/import-icon-pack.js --dry-run   # xem trước, không ghi gì
//   node scripts/import-icon-pack.js             # nạp + gán vào AppLink
//   node scripts/import-icon-pack.js --keep      # không ghi đè mục đã có icon
//   node scripts/import-icon-pack.js --reupload  # tải lại ảnh dù AppIcon đã có
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const config = require("../src/config");
const AppIcon = require("../src/models/AppIcon");
const AppLink = require("../src/models/AppLink");
const { uploadFromBuffer } = require("../src/utils/cloudinary");

const PACK_DIR = path.join(__dirname, "..", "..", "assets", "icons-tien-ich-nhanh");
const IMAGE_DIR = path.join(PACK_DIR, "png-no-tile-192"); // bản không nền ô, khớp lưới hiện tại
const MANIFEST = path.join(PACK_DIR, "icons.json");
const SECTION = "quick_link";
const GROUP = "Bộ icon xã Trà Liên";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const KEEP = args.includes("--keep");
const REUPLOAD = args.includes("--reupload");

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

  await mongoose.connect(config.mongoUri);
  console.log(`Connected to MongoDB${DRY_RUN ? " (dry-run: không ghi gì)" : ""}`);
  console.log(`Bộ icon: ${manifest.length} mục, ảnh lấy từ ${path.basename(IMAGE_DIR)}\n`);

  let uploaded = 0;
  let reused = 0;
  let assigned = 0;
  const missingFile = [];
  const missingLink = [];

  for (const entry of manifest) {
    const key = `pack-${entry.file}`;
    const file = path.join(IMAGE_DIR, `${entry.file}.png`);
    if (!fs.existsSync(file)) {
      missingFile.push(entry.file);
      continue;
    }

    const link = await AppLink.findOne({ section: SECTION, label: entry.label });
    if (!link) {
      missingLink.push(entry.label);
      continue;
    }
    if (link.iconUrl && KEEP) {
      console.log(`  = ${entry.label}: đã có icon, giữ nguyên (--keep)`);
      continue;
    }

    // Đã nạp lần trước thì dùng lại URL cũ, khỏi sinh file rác trên Cloudinary/đĩa.
    const existing = await AppIcon.findOne({ key });
    let url = existing && !REUPLOAD ? existing.url : null;

    if (DRY_RUN) {
      console.log(`  [dry-run] ${entry.label} <- ${entry.file}.png${url ? " (dùng lại ảnh đã nạp)" : ""}`);
      continue;
    }

    if (!url) {
      const buffer = fs.readFileSync(file);
      const result = await uploadFromBuffer(buffer, "tralien-icons");
      url = result.secure_url;
      uploaded += 1;
      if (existing) {
        existing.url = url;
        existing.label = entry.label;
        await existing.save();
      } else {
        await AppIcon.create({ key, label: entry.label, url, group: GROUP, order: entry.id });
      }
    } else {
      reused += 1;
    }

    link.iconUrl = url;
    link.updatedAt = new Date();
    await link.save();
    assigned += 1;
    console.log(`  + ${entry.label} <- ${entry.file}.png`);
  }

  console.log(`\nẢnh: tải lên ${uploaded}, dùng lại ${reused}. Gán vào AppLink: ${assigned}.`);
  if (missingFile.length) console.log(`Thiếu file ảnh: ${missingFile.join(", ")}`);
  if (missingLink.length) console.log(`Không tìm thấy mục trong AppLink (đổi tên?): ${missingLink.join(", ")}`);

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
