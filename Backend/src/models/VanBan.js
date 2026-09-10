const mongoose = require("mongoose");

// Scraped from tralien.danang.gov.vn's "Thông tin chỉ đạo điều hành" listing.
// Unlike Đại Lộc's 1022.vn source, that page has no separate structured columns —
// document number/date are embedded in the free-text title, so they're only
// best-effort regex-extracted, not guaranteed for every entry.
const vanBanSchema = new mongoose.Schema({
  title: { type: String, required: true },
  detailUrl: { type: String, required: true, unique: true },
  soHieu: { type: String, default: "" }, // best-effort extracted, e.g. "2257/QĐ-UBND"
  ngayBanHanh: { type: Date, default: null }, // best-effort extracted
  category: {
    type: String,
    enum: ["quy-dinh", "chinh-sach", "thong-bao", "khac"],
    default: "khac",
  },
  source: { type: String, default: "tralien.danang.gov.vn" },
  crawledAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("VanBan", vanBanSchema);
