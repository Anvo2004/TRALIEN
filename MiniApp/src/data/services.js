export const SERVICE_CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "online", label: "Trực tuyến", icon: "🌐" },
  { key: "offline", label: "Trực tiếp", icon: "🏛️" },
];

// Các thủ tục khai sinh/kết hôn/khai tử/lý lịch tư pháp/giấy phép xây dựng/
// xác nhận cư trú/chứng thực bản sao không có trong danh sách: app chưa có
// backend xử lý các thủ tục này (chỉ dẫn link ra Cổng DVC Quốc gia/Đà Nẵng),
// nên hiển thị mà không bấm được sẽ gây hiểu lầm là đã có form nộp hồ sơ.
// `icon` là tên icon Material Symbols Rounded, `color` là hậu tố lớp
// `.tile-<color>` — cả hai thuần hiển thị, không dùng cho logic.
const SERVICES = [
  { icon: "campaign", color: "o", title: "Phản ánh - Kiến nghị", type: "online", path: "/phan-anh" },
  { icon: "folder_open", color: "b", title: "Tra cứu hồ sơ TTHC", type: "online", path: "/tra-cuu-ho-so" },
  { icon: "description", color: "a", title: "Văn bản - Chính sách", type: "online", path: "/van-ban" },
  { icon: "bolt", color: "v", title: "Lịch cắt điện", type: "online", path: "/lich-cup-dien" },
  { icon: "vaccines", color: "g", title: "Lịch y tế - Tiêm chủng", type: "online", path: "/lich-y-te" },
  { icon: "volunteer_activism", color: "p", title: "Thông báo trợ cấp", type: "online", path: "/thong-bao" },
  { icon: "storm", color: "c", title: "Phòng chống thiên tai", type: "offline", path: "/phong-chong-thien-tai" },
];

export const SERVICE_PORTAL_LINKS = [
  {
    icon: "smart_toy",
    color: "v",
    title: "Trợ lý Công dân số",
    description: "Hỏi đáp thủ tục hành chính bằng AI",
    badge: "Đang hoàn thiện",
    path: "/tro-ly-so",
  },
  {
    icon: "account_balance",
    color: "b",
    title: "Cổng DVCQG",
    description: "Cổng Dịch vụ công Quốc gia",
    href: "https://dichvucong.gov.vn",
  },
  {
    icon: "badge",
    color: "g",
    title: "VNeID",
    description: "Định danh điện tử quốc gia",
    href: "https://vneid.gov.vn",
  },
  {
    icon: "language",
    color: "c",
    title: "UBND xã",
    description: "Trang thông tin điện tử xã Trà Liên",
    href: "TODO_LINK_TRANG_TTDT_XA", // chưa xác nhận URL — xem docs/SETUP_CHECKLIST.md
  },
];

export default SERVICES;
