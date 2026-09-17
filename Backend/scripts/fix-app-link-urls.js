// share.google/... chỉ là link rút gọn của Google — domain hiển thị không
// phải .gov.vn nên có nguy cơ bị Zalo từ chối kiểm duyệt (mục 4.1, xem
// .claude/rules). Đích đến thật đã xác nhận qua `curl -L` là domain chính
// quyền/thành phố hợp lệ — thay thẳng bằng URL cuối cùng, bỏ lớp wrapper.
// An toàn chạy lại nhiều lần (chỉ update nếu tìm thấy URL wrapper cũ).
const mongoose = require("mongoose");
const config = require("../src/config");
const AppLink = require("../src/models/AppLink");

const FIXES = [
  {
    oldHref: "https://share.google/VwBQyXgjyWhwe4sEh",
    newHref: "https://khaosathailong.danang.gov.vn/",
  },
  {
    oldHref: "https://share.google/B3oZQo7knRKbiIOMA",
    newHref: "https://danangai.1022.vn/",
  },
];

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");

  for (const { oldHref, newHref } of FIXES) {
    const res = await AppLink.updateMany({ href: oldHref }, { $set: { href: newHref } });
    console.log(`${oldHref} -> ${newHref}: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
