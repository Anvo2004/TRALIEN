const mongoose = require("mongoose");

// Singleton — 1 document chứa thông tin liên hệ UBND xã + nội dung OA/banner
// chuyển đổi số hiển thị ở trang chủ và trang Liên hệ.
const siteInfoSchema = new mongoose.Schema({
  contact: { type: mongoose.Schema.Types.Mixed, default: {} }, // { officeName, address, phone, hotline, email, website, workHours }
  zaloOA: { type: mongoose.Schema.Types.Mixed, default: {} }, // { name, description }
  digitalTransform: { type: mongoose.Schema.Types.Mixed, default: {} }, // { title, tags }
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SiteInfo", siteInfoSchema);
