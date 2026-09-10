const mongoose = require("mongoose");

// Theo dõi lần đồng bộ gần nhất của các nguồn dữ liệu ngoài (EVN CPC, ...) —
// ghi lại kể cả khi nhận 0 bản ghi, để phân biệt được "thật sự không có lịch"
// với "pipeline đồng bộ đã ngừng chạy từ lâu" (VD: bị chặn mạng, secret sai).
const syncStatusSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  lastRunAt: { type: Date, default: Date.now },
  lastSource: { type: String, default: "" },
  lastCount: { type: Number, default: 0 },
  lastError: { type: String, default: "" },
});

module.exports = mongoose.model("SyncStatus", syncStatusSchema);
