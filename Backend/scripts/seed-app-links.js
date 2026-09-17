// Di chuyển nội dung đang hardcode ở MiniApp/src/data/quick-links.js và
// services.js sang MongoDB (collection AppLink) để cán bộ xã sửa icon/link
// qua AdminWeb mà không cần build lại MiniApp. Chạy 1 lần khi triển khai
// tính năng này; an toàn để chạy lại (bỏ qua section nào đã có dữ liệu).
const mongoose = require("mongoose");
const config = require("../src/config");
const AppLink = require("../src/models/AppLink");

// Sao y nguyên nội dung hiện có trong MiniApp/src/data/quick-links.js —
// KHÔNG đổi icon/label/link, chỉ đổi nơi lưu trữ.
const QUICK_LINKS = [
  { icon: "groups", color: "b", label: "Dân số", path: "/dan-so" },
  { icon: "holiday_village", color: "g", label: "Thôn xóm", path: "/thon-xom" },
  { icon: "map", color: "c", label: "Bản đồ", href: "https://bando.danang.gov.vn/?ward=Tr%C3%A0%20Li%C3%AAn" },
  { icon: "account_balance", color: "v", label: "Dịch vụ công", path: "/dich-vu" },
  { icon: "description", color: "g", label: "Danh mục TTHC", path: "/thu-tuc-hanh-chinh" },
  { icon: "theater_comedy", color: "p", label: "Văn hóa", path: "/van-hoa" },
  { icon: "travel_explore", color: "a", label: "Du lịch", path: "/du-lich" },
  { icon: "storm", color: "c", label: "Phòng chống thiên tai", path: "/phong-chong-thien-tai" },
  { icon: "vaccines", color: "g", label: "Lịch y tế", path: "/lich-y-te" },
  { icon: "rate_review", color: "o", label: "Góp ý", path: "/phan-anh" },
  { icon: "campaign", color: "b", label: "Phản ánh của tôi", path: "/phan-anh-cua-toi" },
  { icon: "call", color: "p", label: "Liên hệ", path: "/lien-he" },
  { icon: "qr_code_2", color: "n", label: "Tạo QR bài viết", href: "https://qrcode.danangportal.gov.vn/Home/CreateQRCode" },
  { icon: "computer", color: "c", label: "Bình dân số học", href: "https://binhdanhocvuso.danang.gov.vn/" },
  { icon: "star", color: "a", label: "Khảo sát hài lòng", href: "https://share.google/VwBQyXgjyWhwe4sEh" },
  { icon: "public", color: "v", label: "Cổng dữ liệu", href: "https://congdulieu.vn" },
  { icon: "search", color: "b", label: "Tra cứu hồ sơ", path: "/tra-cuu-ho-so" },
  { icon: "auto_awesome", color: "p", label: "DaNang AI", href: "https://share.google/B3oZQo7knRKbiIOMA" },
];

// Sao y nguyên MiniApp/src/data/services.js — SERVICES (section=service)
const SERVICES = [
  { icon: "campaign", color: "o", label: "Phản ánh - Kiến nghị", type: "online", path: "/phan-anh" },
  { icon: "folder_open", color: "b", label: "Tra cứu hồ sơ TTHC", type: "online", path: "/tra-cuu-ho-so" },
  { icon: "description", color: "a", label: "Văn bản - Chính sách", type: "online", path: "/van-ban" },
  { icon: "bolt", color: "v", label: "Lịch cắt điện", type: "online", path: "/lich-cup-dien" },
  { icon: "vaccines", color: "g", label: "Lịch y tế - Tiêm chủng", type: "online", path: "/lich-y-te" },
  { icon: "volunteer_activism", color: "p", label: "Thông báo trợ cấp", type: "online", path: "/thong-bao" },
  { icon: "storm", color: "c", label: "Phòng chống thiên tai", type: "offline", path: "/phong-chong-thien-tai" },
];

// Sao y nguyên SERVICE_PORTAL_LINKS (section=portal)
const PORTAL_LINKS = [
  {
    icon: "smart_toy",
    color: "v",
    label: "Trợ lý Công dân số",
    description: "Hỏi đáp thủ tục hành chính bằng AI",
    badge: "Đang hoàn thiện",
    path: "/tro-ly-so",
  },
  {
    icon: "account_balance",
    color: "b",
    label: "Cổng DVCQG",
    description: "Cổng Dịch vụ công Quốc gia",
    href: "https://dichvucong.gov.vn",
  },
  {
    icon: "badge",
    color: "g",
    label: "VNeID",
    description: "Định danh điện tử quốc gia",
    href: "https://vneid.gov.vn",
  },
  {
    icon: "language",
    color: "c",
    label: "UBND xã",
    description: "Trang thông tin điện tử xã Trà Liên",
    href: "", // chưa xác nhận URL — xem docs/SETUP_CHECKLIST.md, cán bộ xã điền qua AdminWeb
  },
];

async function seedSection(section, items) {
  const count = await AppLink.countDocuments({ section });
  if (count > 0) {
    console.log(`[${section}] đã có ${count} bản ghi, bỏ qua.`);
    return;
  }
  await AppLink.insertMany(
    items.map((it, i) => ({ ...it, section, order: i + 1 }))
  );
  console.log(`[${section}] đã seed ${items.length} bản ghi.`);
}

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");

  await seedSection("quick_link", QUICK_LINKS);
  await seedSection("service", SERVICES);
  await seedSection("portal", PORTAL_LINKS);

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { QUICK_LINKS, SERVICES, PORTAL_LINKS };
