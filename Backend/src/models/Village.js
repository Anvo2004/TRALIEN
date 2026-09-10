const mongoose = require("mongoose");

// Danh sách 12 thôn xã Trà Liên sau sắp xếp — nhập tay qua route admin
// (Postman/AdminWeb), không có nguồn cào tự động.
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
