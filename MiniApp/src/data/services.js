export const SERVICE_CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "online", label: "Trực tuyến", icon: "🌐" },
  { key: "offline", label: "Trực tiếp", icon: "🏛️" },
];

// Các thủ tục khai sinh/kết hôn/khai tử/lý lịch tư pháp/giấy phép xây dựng/
// xác nhận cư trú/chứng thực bản sao không có trong danh sách: app chưa có
// backend xử lý các thủ tục này (chỉ dẫn link ra Cổng DVC Quốc gia/Đà Nẵng),
// nên hiển thị mà không bấm được sẽ gây hiểu lầm là đã có form nộp hồ sơ.
const SERVICES = [
  { icon: "📣", title: "Phản ánh - Kiến nghị", type: "online", path: "/phan-anh" },
  { icon: "📊", title: "Tra cứu hồ sơ TTHC", type: "online", path: "/tra-cuu-ho-so" },
  { icon: "📜", title: "Văn bản - Chính sách", type: "online", path: "/van-ban" },
  { icon: "⚡", title: "Lịch cắt điện", type: "online", path: "/lich-cup-dien" },
  { icon: "🏥", title: "Lịch y tế", type: "online", path: "/lich-y-te" },
  { icon: "🔔", title: "Thông báo trợ cấp", type: "online", path: "/thong-bao" },
  { icon: "🌪️", title: "Phòng chống thiên tai", type: "offline", path: "/phong-chong-thien-tai" },
];

export const SERVICE_PORTAL_LINKS = [
  {
    icon: "🤖",
    title: "Trợ lý Công dân số",
    description: "Hỏi đáp thủ tục hành chính bằng AI",
    badge: "🚧 Đang hoàn thiện",
    path: "/tro-ly-so",
  },
  {
    icon: "🏛️",
    title: "Cổng DVCQG",
    description: "Cổng Dịch vụ công Quốc gia",
    href: "https://dichvucong.gov.vn",
  },
  {
    icon: "🆔",
    title: "VNeID",
    description: "Định danh điện tử quốc gia",
    href: "https://vneid.gov.vn",
  },
  {
    icon: "📋",
    title: "UBND xã",
    description: "Trang thông tin điện tử xã Trà Liên",
    href: "TODO_LINK_TRANG_TTDT_XA", // chưa xác nhận URL — xem docs/SETUP_CHECKLIST.md
  },
];

export default SERVICES;
