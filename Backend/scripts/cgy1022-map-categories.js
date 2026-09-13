// ============================================================
// Liệt kê danh mục phản ánh THẬT trong DB + gợi ý CGY1022_LINHVUC_MAP.
//   node scripts/cgy1022-map-categories.js
// Read-only: chỉ đọc collection Category, không ghi gì.
//
// linhVucId của 1022: 1=Hạ tầng đô thị, 4=Môi trường, 21=An ninh trật tự,
//                     22=Lĩnh vực khác, 5000=Công vụ-Công chức
// Dán JSON in ra vào CGY1022_LINHVUC_MAP trong Backend/.env (kiểm tra lại cho đúng).
// ============================================================
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const config = require("../src/config");
const Category = require("../src/models/Category");

// Đoán linhVucId theo từ khoá trong tên danh mục
function guess(name) {
  const s = (name || "").toLowerCase();
  if (/(an ninh|trật tự|trat tu|pccc)/.test(s)) return 21;
  if (
    /(dịch vụ công|dich vu cong|thủ tục|thu tuc|công vụ|cong vu|công chức|cong chuc)/.test(s)
  )
    return 5000;
  if (/(môi trường|moi truong)/.test(s)) return 4;
  if (/(hạ tầng|ha tang|xây dựng|xay dung|đô thị|do thi)/.test(s)) return 1;
  return 22; // Lĩnh vực khác
}

(async () => {
  await mongoose.connect(config.mongoUri);
  const cats = await Category.find({}).sort({ order: 1 }).lean();
  console.log(`Có ${cats.length} danh mục:\n`);
  const map = {};
  for (const c of cats) {
    const id = guess(c.name);
    map[c.name] = id;
    console.log(`  ${c.icon || ""} "${c.name}"  →  linhVucId ${id}`);
  }
  console.log("\nGợi ý CGY1022_LINHVUC_MAP (dán 1 dòng vào .env, KIỂM TRA lại cho đúng):");
  console.log(`CGY1022_LINHVUC_MAP=${JSON.stringify(map)}`);
  console.log("CGY1022_LINHVUC_DEFAULT=22");
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
