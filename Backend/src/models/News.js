const mongoose = require("mongoose");

// Tin tức cào từ trang TTĐT xã (tralien.danang.gov.vn). Tạm thời cào HTML;
// khi có API chia sẻ tin thật thì chỉ đổi nguồn trong newsScrapeService, giữ
// nguyên model này. Khử trùng theo `nid` (id bài trên CMS nguồn).
const newsSchema = new mongoose.Schema(
  {
    nid: { type: Number, required: true, unique: true }, // id bài trên CMS (nid/xxxx)
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    date: { type: String, default: "" }, // dd/MM/yyyy (chuỗi, theo tóm tắt)
    tag: { type: String, default: "Tin tức" },
    source: { type: String, default: "UBND xã Trà Liên" },
    link: { type: String, default: "" },
    imageUrl: { type: String, default: "" }, // URL Cloudinary sau khi re-host
    scrapedAt: { type: Date, default: Date.now },

    // Trạng thái đăng lên Zalo OA (Nội dung dạng Bài viết) — xem services/zaloNewsService.js
    zalo: {
      articleId: { type: String, default: "" }, // id bài trên OA (đã tạo)
      // link mở bài viết trong Zalo (article/getdetail → link_view) — "thẻ tin" trỏ vào đây
      linkView: { type: String, default: "" },
      // Bài OA có nội dung đầy đủ (chữ + ảnh + văn bản PDF thành ảnh, từ trang chi
      // tiết), không chỉ tóm tắt.
      fullContent: { type: Boolean, default: false },
      // Phiên bản cách dựng nội dung bài (zaloNewsService.ARTICLE_BODY_VERSION) —
      // bài chưa đầy đủ dựng bằng bản cũ được dựng lại khi gửi thẻ tin.
      bodyVersion: { type: Number, default: 0 },
      postedAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 },
      lastError: { type: String, default: "" },
      skip: { type: Boolean, default: false }, // backfill đánh dấu bỏ qua tin cũ
      // Đã tạo bài (articleId) KHÁC đã gửi (broadcastedAt) — tạo bài thành công không
      // đảm bảo broadcast cũng thành công (2 lệnh gọi API tách biệt).
      broadcastedAt: { type: Date, default: null },
      broadcastError: { type: String, default: "" },
      // Tự động gửi thẻ tin (newsCardService.runAutoSend) — số lần thử lỗi (vd. không
      // tạo được bài OA, không lấy được danh sách follower), quá AUTO_MAX_ATTEMPTS thì thôi.
      cardAttempts: { type: Number, default: 0 },
      cardError: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);
