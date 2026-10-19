const Village = require("../models/Village");
const VILLAGES = require("../data/villages");

// Bổ sung danh mục cả khi DB đã có một phần dữ liệu. Giữ nguyên ID và các
// thông tin cán bộ đã nhập, để hồ sơ công dân đang chọn thôn không bị mất liên kết.
async function ensureVillages() {
  for (const village of VILLAGES) {
    await Village.updateOne(
      { ten: village.ten },
      { $setOnInsert: village },
      { upsert: true },
    );
  }
}

module.exports = { ensureVillages };
