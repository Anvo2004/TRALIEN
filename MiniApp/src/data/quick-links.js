const QUICK_LINKS = [
  { icon: "👥", label: "Dân số", path: "/dan-so" },
  { icon: "🏘️", label: "Thôn xóm", path: "/thon-xom" },
  {
    icon: "🗺️",
    label: "Bản đồ",
    href: "https://bando.danang.gov.vn/?ward=Tr%C3%A0%20Li%C3%AAn",
  },
  { icon: "🏛️", label: "Dịch vụ công", path: "/dich-vu" },
  { icon: "🏯", label: "Văn hóa", path: "/van-hoa" },
  { icon: "⛰️", label: "Du lịch", path: "/du-lich" },
  { icon: "🌪️", label: "Phòng chống thiên tai", path: "/phong-chong-thien-tai" },
  { icon: "🏥", label: "Lịch y tế", path: "/lich-y-te" },
  // "Hiến kế" tạm ẩn — trang chưa nối backend thật, xem components/layout.jsx
  { icon: "📣", label: "Góp ý", path: "/phan-anh" },
  { icon: "📋", label: "Phản ánh của tôi", path: "/phan-anh-cua-toi" },
  { icon: "☎️", label: "Liên hệ", path: "/lien-he" },
  {
    icon: "🔳",
    label: "Tạo QR bài viết",
    href: "https://qrcode.danangportal.gov.vn/Home/CreateQRCode",
  },
  {
    icon: "💻",
    label: "Bình dân số học",
    href: "https://binhdanhocvuso.danang.gov.vn/",
  },
  {
    icon: "⭐",
    label: "Khảo sát hài lòng",
    href: "https://khaosathailong.danang.gov.vn/",
  },
  {
    icon: "🌐",
    label: "Cổng dữ liệu",
    href: "https://opendata.danang.gov.vn/",
  },
  { icon: "🔍", label: "Tra cứu hồ sơ", path: "/tra-cuu-ho-so" },

  // ===== Nhóm liên kết dịch vụ bổ sung theo yêu cầu xã Trà Liên =====
  // href còn lại là placeholder — chưa có link thật, xem docs/SETUP_CHECKLIST.md
  {
    icon: "🗓️",
    label: "Hẹn giờ DVC",
    href: "TODO_LINK_HEN_GIO_DVC", // đặt lịch hẹn Cổng Dịch vụ công
  },
  {
    icon: "🏪",
    label: "Đăng ký hộ KD",
    href: "TODO_LINK_DANG_KY_HO_KINH_DOANH",
  },
  {
    icon: "🏠",
    label: "Đăng ký hộ khẩu",
    href: "TODO_LINK_DANG_KY_HO_KHAU",
  },
  {
    icon: "💰",
    label: "Bảng giá đất",
    href: "TODO_LINK_BANG_GIA_DAT",
  },
];

export default QUICK_LINKS;
