const mongoose = require("mongoose");

// "Thông báo khác" tab — entered by hand via AdminWeb. Không có trong dự án
// tham khảo Đại Lộc (họ dùng Zalo OA broadcast thay vì lưu danh sách), nhưng
// Mini App Trà Liên đã có sẵn tab này nên vẫn cần một nơi lưu trữ.
const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notice", noticeSchema);
