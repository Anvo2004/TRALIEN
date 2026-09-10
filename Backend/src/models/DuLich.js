const mongoose = require("mongoose");

// Singleton — 1 document duy nhất chứa toàn bộ nội dung trang Du lịch.
const duLichSchema = new mongoose.Schema({
  title: { type: String, default: "Du lịch - Danh thắng" },
  subtitle: { type: String, default: "" },
  diemNoiBat: { type: mongoose.Schema.Types.Mixed, default: [] }, // [{ id, icon, title, subtitle }]
  diemThamQuan: { type: mongoose.Schema.Types.Mixed, default: [] }, // [{ id, title, desc, address, image }]
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DuLich", duLichSchema);
