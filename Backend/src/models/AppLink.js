const mongoose = require("mongoose");

// Danh sách icon/liên kết hiển thị trong MiniApp (Trang chủ "Tiện ích nhanh",
// trang "Dịch vụ" + "Cổng dịch vụ công") — nhập tay qua AdminWeb thay vì
// hardcode trong MiniApp/src/data/*.js, để đổi icon/link không cần build lại
// app. `section` phân biệt nơi hiển thị:
//   - quick_link: lưới icon ở Trang chủ
//   - service:    danh sách dịch vụ chính ở trang /dich-vu
//   - portal:     danh sách "Cổng dịch vụ công" ở cuối trang /dich-vu
const appLinkSchema = new mongoose.Schema({
  section: { type: String, enum: ["quick_link", "service", "portal"], required: true },
  icon: { type: String, default: "" }, // tên icon trong MiniApp/src/data/icon-paths.js
  color: { type: String, default: "" }, // hậu tố lớp .tile-<color>, thuần hiển thị
  label: { type: String, required: true }, // tên hiển thị
  type: { type: String, enum: ["online", "offline", ""], default: "" }, // chỉ dùng cho section=service
  description: { type: String, default: "" }, // chỉ dùng cho section=portal
  badge: { type: String, default: "" }, // chỉ dùng cho section=portal, vd "Đang hoàn thiện"
  path: { type: String, default: "" }, // route nội bộ MiniApp, vd "/dan-so"
  href: { type: String, default: "" }, // URL ngoài, vd "https://..."
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },
});

module.exports = mongoose.model("AppLink", appLinkSchema);
