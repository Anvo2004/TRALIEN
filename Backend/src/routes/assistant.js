const express = require("express");
const assistantService = require("../services/assistantService");
const { checkRateLimit } = require("../utils/rateLimit");

const router = express.Router();

const RATE_LIMIT = 20; // câu hỏi
const RATE_WINDOW_SECONDS = 60 * 60; // / giờ / user

router.post("/ask", async (req, res) => {
  const { userId, question } = req.body;
  const q = (question || "").trim();
  if (!q) {
    return res.status(400).json({ error: "Vui lòng nhập câu hỏi" });
  }
  if (!assistantService.isConfigured()) {
    return res.status(503).json({ error: "Trợ lý số chưa được cấu hình" });
  }

  const rateLimitKey = `assistant:${userId || req.ip}`;
  const { allowed } = await checkRateLimit(rateLimitKey, RATE_LIMIT, RATE_WINDOW_SECONDS);
  if (!allowed) {
    return res.status(429).json({ error: "Bạn đã hỏi quá nhiều lần. Vui lòng thử lại sau 1 giờ." });
  }

  try {
    const answer = await assistantService.ask(q);
    res.json({ answer });
  } catch (err) {
    console.error("[assistant] Trả lời thất bại:", err.message);
    res.status(err.status || 502).json({ error: "Không trả lời được lúc này. Vui lòng thử lại sau." });
  }
});

module.exports = router;
