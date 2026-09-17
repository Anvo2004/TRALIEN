// Danh sách dịch vụ chính + "Cổng dịch vụ công" (trang /dich-vu) đã chuyển
// sang lưu MongoDB (collection AppLink, section "service"/"portal") — quản lý
// qua AdminWeb, xem Backend/src/models/AppLink.js. File này chỉ còn giữ
// SERVICE_CATEGORIES (tab lọc cố định, không phải nội dung cần chỉnh sửa).
export const SERVICE_CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "online", label: "Trực tuyến", icon: "🌐" },
  { key: "offline", label: "Trực tiếp", icon: "🏛️" },
];
