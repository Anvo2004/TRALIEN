const express = require("express");
const vanBanService = require("../services/vanBanTraLienService");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/sync", requireRole("superadmin"), async (req, res) => {
  const count = await vanBanService.syncVanBan();
  res.json({ ok: true, count });
});

module.exports = router;
