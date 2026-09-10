const mongoose = require("mongoose");

// Singleton — luôn chỉ có đúng 1 document (số liệu dân số toàn xã), không phải
// danh sách nhiều bản ghi. GET/PUT không cần :id, chỉ thao tác trên bản ghi duy nhất.
const danSoSchema = new mongoose.Schema({
  tongDanSo: { type: Number, default: 0 },
  dienTichKm2: { type: Number, default: 0 },
  soThon: { type: Number, default: 0 },
  hoDan: { type: Number, default: null },
  gioiTinh: { type: mongoose.Schema.Types.Mixed, default: null }, // { nam, nu } hoặc null
  doTuoi: { type: mongoose.Schema.Types.Mixed, default: null }, // [{ label, percent }] hoặc null
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DanSo", danSoSchema);
