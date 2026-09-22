const crypto = require("crypto");
const express = require("express");
const config = require("../config");

const router = express.Router();

/**
 * Xác thực chữ ký webhook Zalo OA (X-ZEvent-Signature).
 * Công thức (theo tài liệu cộng đồng, nên đối chiếu lại với tài liệu chính
 * thức khi có): mac = sha256(appId + rawBody + timestamp + OASecretKey)
 * Nếu chưa cấu hình ZALO_OA_SECRET_KEY thì bỏ qua bước xác thực (chỉ log
 * cảnh báo), vì mục tiêu chính là đảm bảo webhook luôn trả 200 OK cho Zalo —
 * Zalo sẽ tự vô hiệu hoá webhook nếu liên tục nhận lỗi hoặc timeout.
 */
function verifySignature(req) {
  if (!config.zalo.oaSecretKey) return null; // không thể xác thực, bỏ qua

  const signature = req.get("X-ZEvent-Signature");
  const timestamp = req.body && req.body.timestamp;
  if (!signature || !timestamp) return false;

  const expected = crypto
    .createHash("sha256")
    .update(`${config.zalo.appId}${req.rawBody}${timestamp}${config.zalo.oaSecretKey}`)
    .digest("hex");

  return expected === signature;
}

router.post("/webhook", (req, res) => {
  const verified = verifySignature(req);
  if (verified === false) {
    console.warn("[zaloWebhook] Chữ ký không khớp (X-ZEvent-Signature), vẫn trả 200 OK.");
  }

  const event = req.body || {};
  console.log(`[zaloWebhook] Nhận sự kiện: ${event.event_name}`, JSON.stringify(event));

  res.status(200).send("OK");
});

module.exports = router;
