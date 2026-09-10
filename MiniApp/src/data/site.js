// Thông tin thương hiệu tĩnh (tên app, banner) — hiếm khi đổi nên để trong
// code. Số liệu dân số, thông báo, và thông tin liên hệ đã chuyển sang
// MongoDB (xem components/stats-row.jsx, pages/home.jsx, pages/contact.jsx —
// gọi /api/public/dan-so, /thong-bao, /site-info).
const SITE = {
  appName: "Công dân số xã Trà Liên",
  shortName: "Trà Liên kết nối số",
  province: "Thành phố Đà Nẵng", // xác nhận từ tralien.danang.gov.vn
  badge: "Chính quyền số",
  heroCaption: "Xã Trà Liên",
};

export default SITE;
