const express = require("express");
const catDienService = require("../services/catDienService");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// Đồng bộ đã chạy tự động qua node-cron (server.js); route này chỉ để admin
// kích hoạt lại thủ công khi cần (vd. vừa sửa EVNCPC_SUBORG_CODE).
router.post("/sync", requireRole("superadmin"), async (req, res) => {
  const count = await catDienService.syncOutages();
  res.json({ ok: true, count });
});

module.exports = router;
