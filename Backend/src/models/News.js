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
      postedAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 },
      lastError: { type: String, default: "" },
      skip: { type: Boolean, default: false }, // backfill đánh dấu bỏ qua tin cũ
      // Đã tạo bài (articleId) KHÁC đã gửi (broadcastedAt) — tạo bài thành công không
      // đảm bảo broadcast cũng thành công (2 lệnh gọi API tách biệt).
      broadcastedAt: { type: Date, default: null },
      broadcastError: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);
