const mongoose = require("mongoose");

// Singleton — 1 document duy nhất chứa toàn bộ nội dung trang Văn hóa.
const vanHoaSchema = new mongoose.Schema({
  title: { type: String, default: "Văn hóa - Nghệ thuật" },
  subtitle: { type: String, default: "" },
  hoatDong: { type: mongoose.Schema.Types.Mixed, default: [] }, // [{ id, icon, title, desc }]
  diSan: { type: mongoose.Schema.Types.Mixed, default: [] }, // [{ id, icon, title, subtitle }]
  diemNoiBat: { type: mongoose.Schema.Types.Mixed, default: [] }, // [{ id, icon, name }]
  tinTuc: { type: mongoose.Schema.Types.Mixed, default: [] }, // [{ id, tag, date, title, summary, source }]
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("VanHoa", vanHoaSchema);
