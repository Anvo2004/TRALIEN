// `icon` là tên icon Material Symbols Rounded (font nạp trong index.html,
// xem class .ms trong app.scss) — thuần hiển thị. `color` là hậu tố lớp
// `.tile-<color>` (thuần hiển thị) — không dùng cho logic.
const QUICK_LINKS = [
  { icon: "groups", color: "b", label: "Dân số", path: "/dan-so" },
  { icon: "holiday_village", color: "g", label: "Thôn xóm", path: "/thon-xom" },
  {
    icon: "map",
    color: "c",
    label: "Bản đồ",
    href: "https://bando.danang.gov.vn/?ward=Tr%C3%A0%20Li%C3%AAn",
  },
  { icon: "account_balance", color: "v", label: "Dịch vụ công", path: "/dich-vu" },
  { icon: "theater_comedy", color: "p", label: "Văn hóa", path: "/van-hoa" },
  { icon: "travel_explore", color: "a", label: "Du lịch", path: "/du-lich" },
  { icon: "storm", color: "c", label: "Phòng chống thiên tai", path: "/phong-chong-thien-tai" },
  { icon: "vaccines", color: "g", label: "Lịch y tế", path: "/lich-y-te" },
  // "Hiến kế" tạm ẩn — trang chưa nối backend thật, xem components/layout.jsx
  { icon: "rate_review", color: "o", label: "Góp ý", path: "/phan-anh" },
  { icon: "campaign", color: "b", label: "Phản ánh của tôi", path: "/phan-anh-cua-toi" },
  { icon: "call", color: "p", label: "Liên hệ", path: "/lien-he" },
  {
    icon: "qr_code_2",
    color: "n",
    label: "Tạo QR bài viết",
    href: "https://qrcode.danangportal.gov.vn/Home/CreateQRCode",
  },
  {
    icon: "computer",
    color: "c",
    label: "Bình dân số học",
    href: "https://binhdanhocvuso.danang.gov.vn/",
  },
  {
    icon: "star",
    color: "a",
    label: "Khảo sát hài lòng",
    href: "https://share.google/VwBQyXgjyWhwe4sEh",
  },
  {
    icon: "public",
    color: "v",
    label: "Cổng dữ liệu",
    href: "https://congdulieu.vn",
  },
  { icon: "search", color: "b", label: "Tra cứu hồ sơ", path: "/tra-cuu-ho-so" },
  {
    icon: "auto_awesome",
    color: "p",
    label: "DaNang AI",
    href: "https://share.google/B3oZQo7knRKbiIOMA",
  },
];

export default QUICK_LINKS;
