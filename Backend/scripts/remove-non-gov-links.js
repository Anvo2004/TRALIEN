// Xoá mọi AppLink có `href` không hợp lệ theo chính sách kiểm duyệt Zalo (mục 4.1:
// chỉ .gov.vn hoặc tên miền trong ALLOWED_LINK_DOMAINS). Mặc định chỉ LIỆT KÊ;
// thêm `--apply` mới xoá thật.
//   node scripts/remove-non-gov-links.js           # xem trước
//   node scripts/remove-non-gov-links.js --apply   # xoá
const mongoose = require("mongoose");
const config = require("../src/config");
const AppLink = require("../src/models/AppLink");
const { isAllowedExternalUrl } = require("../src/utils/linkPolicy");

async function main() {
  const apply = process.argv.includes("--apply");
  await mongoose.connect(config.mongoUri);
  const items = await AppLink.find({ href: { $ne: "" } }).lean();
  const bad = items.filter((i) => !isAllowedExternalUrl(i.href));
  if (!bad.length) console.log("Không có link vi phạm.");
  for (const i of bad) {
    console.log(`${apply ? "XOÁ" : "VI PHẠM"}: [${i.section}] ${i.label} -> ${i.href}`);
    if (apply) await AppLink.deleteOne({ _id: i._id });
  }
  if (bad.length && !apply) console.log("\nChạy lại với --apply để xoá.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
