// Nạp bộ icon 3D cho MiniApp vào thư viện AppIcon và gán vào từng mục AppLink.
//
// Nguồn: Icons8 "3D Fluency" (https://icons8.com/icons/3d-fluency). Giấy phép
// miễn phí của Icons8 yêu cầu có link tới icons8.com nơi hiển thị icon — trong
// dự án này là màn "Thông tin ứng dụng" của MiniApp
// (MiniApp/src/pages/thong-tin-ung-dung.jsx). Nếu xã mua gói Icons8 thì xoá
// dòng ghi công đó, phần còn lại không đổi. Giấy phép miễn phí cũng cấm phát
// tán icon dưới dạng file rời: ảnh chỉ được dùng làm giao diện trong app, không
// tạo trang cho tải icon.
//
// Chạy:
//   node scripts/seed-app-icons.js --dry-run       # chỉ in ra, không tải/ghi gì
//   node scripts/seed-app-icons.js                 # tải ảnh + nạp thư viện AppIcon
//   node scripts/seed-app-icons.js --apply-links   # nạp xong gán luôn vào AppLink
//
// Chạy lại an toàn: slug nào đã có trong AppIcon thì bỏ qua, AppLink nào đã có
// iconUrl thì không ghi đè (trừ khi thêm --force).
const mongoose = require("mongoose");
const config = require("../src/config");
const AppIcon = require("../src/models/AppIcon");
const AppLink = require("../src/models/AppLink");
const { uploadFromBuffer } = require("../src/utils/cloudinary");

const SOURCE_SIZE = 240; // cỡ tải về từ Icons8
const TARGET_SIZE = 192; // đủ nét cho ô 52px trên màn 3x, ~20KB/ảnh

// Bộ icon dùng chung — key trùng slug Icons8 để chạy lại không tạo bản sao.
// Tất cả slug đã kiểm tra trả HTTP 200 ngày 11/10/2026.
const ICON_SET = [
  { slug: "people", label: "Nhóm người", group: "Dân cư" },
  { slug: "home", label: "Ngôi nhà", group: "Dân cư" },
  { slug: "teddy-bear", label: "Trẻ em", group: "Dân cư" },
  { slug: "medal", label: "Huân chương", group: "Dân cư" },
  { slug: "handshake", label: "Bắt tay", group: "Dân cư" },
  { slug: "world-map", label: "Bản đồ", group: "Tra cứu" },
  { slug: "globe", label: "Quả địa cầu", group: "Tra cứu" },
  { slug: "search", label: "Kính lúp", group: "Tra cứu" },
  { slug: "database", label: "Kho dữ liệu", group: "Tra cứu" },
  { slug: "qr-code", label: "Mã QR", group: "Tra cứu" },
  { slug: "city", label: "Trụ sở hành chính", group: "Hành chính" },
  { slug: "document", label: "Văn bản", group: "Hành chính" },
  { slug: "contract", label: "Hợp đồng - chính sách", group: "Hành chính" },
  { slug: "folder-invoices", label: "Hồ sơ", group: "Hành chính" },
  { slug: "verified-account", label: "Định danh điện tử", group: "Hành chính" },
  { slug: "rating", label: "Đánh giá hài lòng", group: "Hành chính" },
  { slug: "hospital", label: "Bệnh viện", group: "Y tế" },
  { slug: "syringe", label: "Tiêm chủng", group: "Y tế" },
  { slug: "storm", label: "Bão", group: "Thiên tai" },
  { slug: "sos", label: "SOS", group: "Thiên tai" },
  { slug: "electricity", label: "Điện", group: "Tiện ích" },
  { slug: "speech-bubble", label: "Góp ý", group: "Tiện ích" },
  { slug: "megaphone", label: "Loa thông báo", group: "Tiện ích" },
  { slug: "phone", label: "Điện thoại", group: "Tiện ích" },
  { slug: "money", label: "Tiền trợ cấp", group: "Tiện ích" },
  { slug: "bot", label: "Trợ lý ảo", group: "Tiện ích" },
  { slug: "laptop", label: "Máy tính", group: "Học tập" },
  { slug: "graduation-cap", label: "Mũ tốt nghiệp", group: "Học tập" },
  { slug: "drama", label: "Văn hóa - nghệ thuật", group: "Văn hóa" },
  { slug: "mountain", label: "Du lịch - núi", group: "Văn hóa" },
  { slug: "toolbox", label: "Hộp công cụ", group: "Điều hướng" },
  { slug: "user-male-circle", label: "Công dân số", group: "Điều hướng" },
];

// label trong AppLink -> slug icon. Khớp bằng label vì đó là thứ cán bộ nhìn
// thấy; mục nào đổi tên thì script báo "không tìm thấy" thay vì gán nhầm.
const LINK_MAP = {
  quick_link: {
    "Dân số": "people",
    "Thôn xóm": "home",
    "Bản đồ": "world-map",
    "Dịch vụ công": "city",
    "Danh mục TTHC": "document",
    "Văn hóa": "drama",
    "Du lịch": "mountain",
    "Phòng chống thiên tai": "storm",
    "Lịch y tế": "hospital",
    "Góp ý": "speech-bubble",
    "Phản ánh của tôi": "megaphone",
    "Liên hệ": "phone",
    "Tạo QR bài viết": "qr-code",
    "Bình dân số học": "laptop",
    "Khảo sát hài lòng": "rating",
    "Cổng dữ liệu": "database",
    "Tra cứu hồ sơ": "search",
    "DaNang AI": "bot",
    "Công dân số": "user-male-circle",
  },
  service: {
    "Phản ánh - Kiến nghị": "megaphone",
    "Tra cứu hồ sơ TTHC": "folder-invoices",
    "Văn bản - Chính sách": "contract",
    "Lịch cắt điện": "electricity",
    "Lịch y tế - Tiêm chủng": "syringe",
    "Thông báo trợ cấp": "money",
    "Phòng chống thiên tai": "storm",
  },
  portal: {
    "Trợ lý Công dân số": "bot",
    "Cổng DVCQG": "city",
    VNeID: "verified-account",
    "UBND xã": "globe",
  },
};

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const APPLY_LINKS = args.includes("--apply-links");
const FORCE = args.includes("--force");

function sourceUrl(slug) {
  return `https://img.icons8.com/3d-fluency/${SOURCE_SIZE}/${slug}.png`;
}

// Thu nhỏ về TARGET_SIZE, giữ nền trong suốt (PNG, không phải JPEG như
// utils/imageHost.js vì icon cần nền trong).
async function fetchIcon(slug) {
  const { createCanvas, loadImage } = require("@napi-rs/canvas");
  const res = await fetch(sourceUrl(slug), { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = Buffer.from(await res.arrayBuffer());

  const img = await loadImage(raw);
  const canvas = createCanvas(TARGET_SIZE, TARGET_SIZE);
  const ctx = canvas.getContext("2d");
  const scale = Math.min(TARGET_SIZE / img.width, TARGET_SIZE / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (TARGET_SIZE - w) / 2, (TARGET_SIZE - h) / 2, w, h);
  return canvas.toBuffer("image/png");
}

async function seedLibrary() {
  const urlBySlug = {};
  let added = 0;
  let skipped = 0;

  for (const [i, icon] of ICON_SET.entries()) {
    const existing = await AppIcon.findOne({ key: icon.slug });
    if (existing) {
      urlBySlug[icon.slug] = existing.url;
      skipped += 1;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] tải ${sourceUrl(icon.slug)} -> ${icon.label}`);
      urlBySlug[icon.slug] = `(dry-run)/${icon.slug}.png`;
      continue;
    }

    const buffer = await fetchIcon(icon.slug);
    const result = await uploadFromBuffer(buffer, "tralien-icons");
    await AppIcon.create({
      key: icon.slug,
      label: icon.label,
      url: result.secure_url,
      group: icon.group,
      order: i + 1,
    });
    urlBySlug[icon.slug] = result.secure_url;
    added += 1;
    console.log(`  + ${icon.slug} (${(buffer.length / 1024).toFixed(1)}KB) -> ${result.secure_url}`);
  }

  console.log(`Thư viện icon: thêm ${added}, bỏ qua ${skipped} (đã có).`);
  return urlBySlug;
}

async function applyLinks(urlBySlug) {
  for (const [section, mapping] of Object.entries(LINK_MAP)) {
    for (const [label, slug] of Object.entries(mapping)) {
      const url = urlBySlug[slug];
      if (!url) {
        console.log(`  ! ${section}/${label}: chưa có ảnh cho slug "${slug}"`);
        continue;
      }

      const link = await AppLink.findOne({ section, label });
      if (!link) {
        console.log(`  ? ${section}/${label}: không tìm thấy mục này trong AppLink (đổi tên?)`);
        continue;
      }
      if (link.iconUrl && !FORCE) {
        console.log(`  = ${section}/${label}: đã có iconUrl, giữ nguyên`);
        continue;
      }
      if (DRY_RUN) {
        console.log(`  [dry-run] ${section}/${label} -> ${slug}`);
        continue;
      }

      link.iconUrl = url;
      link.updatedAt = new Date();
      await link.save();
      console.log(`  + ${section}/${label} -> ${slug}`);
    }
  }
}

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`Connected to MongoDB${DRY_RUN ? " (dry-run: không ghi gì)" : ""}`);

  console.log(`\nNạp thư viện icon (${ICON_SET.length} ảnh, ${SOURCE_SIZE}px -> ${TARGET_SIZE}px):`);
  const urlBySlug = await seedLibrary();

  if (APPLY_LINKS) {
    console.log("\nGán icon vào AppLink:");
    await applyLinks(urlBySlug);
  } else {
    console.log("\n(Thêm --apply-links để gán luôn icon vào từng mục AppLink.)");
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { ICON_SET, LINK_MAP };
