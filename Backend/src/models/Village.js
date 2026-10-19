const mongoose = require("mongoose");

// Danh mục thôn Trà Liên được bổ sung từ tài liệu của xã khi khởi động.
// Thông tin cán bộ và số liệu từng thôn quản lý qua route admin.
const villageSchema = new mongoose.Schema({
  ten: { type: String, required: true },
  biThu: { type: String, default: "" },
  thonTruong: { type: String, default: "" },
  matTran: { type: String, default: "" },
  soHo: { type: Number, default: null },
  danSo: { type: Number, default: null },
  thuTu: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },
});

module.exports = mongoose.model("Village", villageSchema);
