// ============================================================
// Đánh dấu BỎ QUA đăng OA cho toàn bộ tin ĐÃ CÀO hiện có (zalo.skip=true).
//   node scripts/backfill-news-zalo-skip.js
//
// CHẠY MỘT LẦN, TRƯỚC KHI bật ZALO_ARTICLE_ENABLED=true.
// Nếu bỏ qua bước này, lần bật đầu tiên sẽ đăng dồn ~9 tin cũ lên OA cùng lúc.
// Chỉ những tin cào được SAU khi chạy script này (và sau khi bật) mới được đăng.
// ============================================================
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const config = require("../src/config");
const News = require("../src/models/News");

(async () => {
  await mongoose.connect(config.mongoUri);

  const pending = await News.countDocuments({ "zalo.articleId": "", "zalo.skip": { $ne: true } });
  console.log(`Tin chưa đăng & chưa skip: ${pending}`);

  const r = await News.updateMany(
    { "zalo.articleId": "", "zalo.skip": { $ne: true } },
    { $set: { "zalo.skip": true } }
  );
  console.log(`Đã đánh dấu skip: ${r.modifiedCount} tin`);

  await mongoose.disconnect();
})().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
