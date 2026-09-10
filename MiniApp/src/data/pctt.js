// Phòng chống thiên tai — SOS/Danh bạ chưa có nguồn nội dung nên chưa gắn path
// (bấm vào chỉ hiện thông báo "đang hoàn thiện"). Kỹ năng PCTT đã có nguồn
// thật nên trỏ sang trang riêng. Bản đồ số trỏ ra trang ngoài nên dùng href
// (mở qua openExternal) thay vì path nội bộ.
// "Bản đồ mưa ngập" tạm ẩn — trang nhúng iframe flood-web-test.busmap.vn,
// domain của công ty tư nhân (BusMap/Phenikaa MaaS), không phải .gov.vn/CQNN,
// bị Zalo từ chối kiểm duyệt theo mục 4.1 (điều hướng liên kết trang thứ 3).
// Route/trang vẫn còn trong code, chỉ bỏ lối vào cho tới khi có nguồn .gov.vn.
const PCTT_ITEMS = [
  { icon: "🆘", label: "SOS", path: null },
  { icon: "📞", label: "Danh bạ điện thoại PCTT", path: null },
  { icon: "🎓", label: "Kỹ năng PCTT", path: "/pctt-ky-nang" },
  { icon: "🗺️", label: "Bản đồ số", href: "https://bando.danang.gov.vn/" },
];

export default PCTT_ITEMS;
