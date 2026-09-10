const mongoose = require("mongoose");

// Entered by hand by xã staff via AdminWeb — no external data source for this one
// (mirrors TroCapSchedule.js).
const lichYTeSchema = new mongoose.Schema({
  ngayKham: { type: Date, required: true },
  khungGio: { type: String, default: "" },
  diaDiem: { type: String, required: true },
  loaiHinh: {
    type: String,
    enum: ["kham_benh", "tiem_chung", "khac"],
    default: "kham_benh",
  },
  donViThucHien: { type: String, default: "" }, // Trạm y tế xã / bệnh viện phối hợp...
  doiTuong: { type: String, default: "" }, // vd "Trẻ em dưới 5 tuổi", "Người cao tuổi"
  ghiChu: { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },
});

module.exports = mongoose.model("LichYTe", lichYTeSchema);
