const mongoose = require("mongoose");

// Entered by hand by xã staff via AdminWeb — no external data source for this one.
const troCapScheduleSchema = new mongoose.Schema({
  ngayChiTra: { type: Date, required: true },
  khungGio: { type: String, default: "" },
  diaDiem: { type: String, required: true },
  nhanVienTen: { type: String, default: "" },
  nhanVienSdt: { type: String, default: "" },
  ghiChu: { type: String, default: "" },
  loaiTroCap: {
    type: String,
    enum: ["cong", "baotro", "ngheo", "treem"],
    default: "baotro",
  },
  soLuong: { type: Number, default: 0 },
  donVi: { type: String, default: "người" },
  soTien: { type: Number, default: 0 },
  hinhThuc: { type: String, enum: ["bank", "cash"], default: "cash" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },
});

module.exports = mongoose.model("TroCapSchedule", troCapScheduleSchema);
