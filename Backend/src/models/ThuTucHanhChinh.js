const mongoose = require("mongoose");

// Danh mục thủ tục hành chính xã — nhập tay qua AdminWeb (không có nguồn đồng
// bộ tự động, giống LichYTe/TroCapSchedule). Khác "Tra cứu hồ sơ TTHC"
// (tra theo mã hồ sơ đã nộp qua IOCTC): đây là danh mục để dân XEM TRƯỚC thủ
// tục cần làm, giấy tờ cần chuẩn bị, nộp ở đâu.
const thuTucHanhChinhSchema = new mongoose.Schema({
  tenThuTuc: { type: String, required: true },
  linhVuc: { type: String, default: "" }, // vd "Tư pháp - Hộ tịch", "Đất đai"
  mucDo: {
    type: String,
    enum: ["3", "4"],
    default: "4",
  },
  thoiGianXuLy: { type: String, default: "" }, // vd "Trong ngày làm việc"
  giayToCanNop: { type: String, default: "" }, // nhiều dòng, mỗi dòng 1 giấy tờ
  linkNopTrucTuyen: { type: String, default: "" },
  ghiChu: { type: String, default: "" },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },
});

module.exports = mongoose.model("ThuTucHanhChinh", thuTucHanhChinhSchema);
