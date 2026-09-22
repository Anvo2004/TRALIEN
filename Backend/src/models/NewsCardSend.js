const mongoose = require("mongoose");

// Mỗi lượt gửi "thẻ tin" (1 tin tức → nhiều người, dạng tin tư vấn list template)
// — xem services/newsCardService.js. Tiến độ được lưu dần trong lúc gửi để
// restart giữa chừng không mất số liệu.
const newsCardSendSchema = new mongoose.Schema(
  {
    newsId: { type: mongoose.Schema.Types.ObjectId, ref: "News", required: true },
    title: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    targetUrl: { type: String, default: "" }, // link mở khi bấm thẻ
    targetType: { type: String, enum: ["oa", "goc"], default: "goc" }, // bài viết OA | trang tin gốc
    recipientCount: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    // Lỗi Zalo gom theo mã: [{ code, message, count }]
    errorCounts: [{ _id: false, code: String, message: String, count: Number }],
    status: { type: String, enum: ["sending", "done", "failed"], default: "sending" },
    auto: { type: Boolean, default: false }, // do bộ tự động gửi (không phải cán bộ bấm)
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  },
  { timestamps: true }
);

newsCardSendSchema.index({ newsId: 1, createdAt: -1 });

module.exports = mongoose.model("NewsCardSend", newsCardSendSchema);
