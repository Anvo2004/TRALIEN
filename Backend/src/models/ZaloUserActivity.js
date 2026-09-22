const mongoose = require("mongoose");

// Lần tương tác cuối của từng người dùng với OA — ghi từ webhook (xem
// services/zaloActivityService.js). Zalo chỉ cho gửi TIN TƯ VẤN qua OpenAPI tới
// người đã tương tác trong 7 ngày: miễn phí trong 48h, sau đó tính phí, quá 7
// ngày thì bị từ chối — collection này để biết mỗi follower đang ở khung nào.
const zaloUserActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Zalo user id (theo OA)
  lastInteractionAt: { type: Date, default: null },
  lastEvent: { type: String, default: "" },
  // Số tin tư vấn hệ thống đã gửi THÀNH CÔNG cho người này kể từ lần tương tác
  // cuối — reset về 0 mỗi lần người dùng tương tác lại (xem utils/zaloApi.js).
  msgsSinceInteraction: { type: Number, default: 0 },
  unfollowedAt: { type: Date, default: null },
});

module.exports = mongoose.model("ZaloUserActivity", zaloUserActivitySchema);
