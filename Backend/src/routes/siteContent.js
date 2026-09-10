const express = require("express");
const DanSo = require("../models/DanSo");
const DuLich = require("../models/DuLich");
const VanHoa = require("../models/VanHoa");
const SiteInfo = require("../models/SiteInfo");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const WRITE_ROLES = ["superadmin", "dept_leader", "officer"];

// Mỗi mục dưới đây là singleton (chỉ 1 document) — sửa bằng cách PUT nguyên
// object mới đè lên document hiện có (upsert), không có :id vì chỉ có 1 bản ghi.
function singletonRoutes(path, Model) {
  router.get(path, async (req, res) => {
    const doc = (await Model.findOne().lean()) || {};
    res.json(doc);
  });

  router.put(path, requireRole(...WRITE_ROLES), async (req, res) => {
    const { _id, ...body } = req.body;
    const doc = await Model.findOneAndUpdate(
      {},
      { ...body, updatedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(doc);
  });
}

singletonRoutes("/dan-so", DanSo);
singletonRoutes("/du-lich", DuLich);
singletonRoutes("/van-hoa", VanHoa);
singletonRoutes("/site-info", SiteInfo);

module.exports = router;
