const express = require("express");
const multer = require("multer");
const Category = require("../models/Category");
const Feedback = require("../models/Feedback");
const { uploadFromBuffer } = require("../utils/cloudinary");
const { sendZaloText } = require("../utils/zaloApi");
const { requireZaloUser } = require("../utils/zaloMiniApp");
const { checkRateLimit } = require("../utils/rateLimit");
const { PUBLIC_FIELDS, toPublicView } = require("../services/feedbackPublicView");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

const PHONE_RE = /^(0|\+84)[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Tiêu đề do dân nhập; bỏ trống thì suy ra từ lĩnh vực, cuối cùng mới cắt nội dung.
function resolveTitle(rawTitle, content, categoryName) {
  const t = (rawTitle || "").trim();
  if (t) return t;
  if (categoryName) return `Phản ánh về ${categoryName.toLowerCase()}`;
  const c = content.replace(/\s+/g, " ").trim();
  return c.length > 60 ? `${c.slice(0, 60)}…` : c;
}

router.get("/categories", async (req, res) => {
  const categories = await Category.find().sort({ order: 1 }).select("name icon order");
  res.json({ categories });
});

router.post("/feedbacks", upload.array("images", 5), async (req, res) => {
  const { userId, displayName, contact, title, content, categoryId, address, lat, lng } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Thiếu thông tin người dùng Zalo" });
  }
  if (!contact || !(PHONE_RE.test(contact.trim()) || EMAIL_RE.test(contact.trim()))) {
    return res.status(400).json({ error: "Số điện thoại hoặc email không hợp lệ" });
  }
  if (!content || content.trim().length < 5) {
    return res.status(400).json({ error: "Nội dung phải có ít nhất 5 ký tự" });
  }

  let category = null;
  if (categoryId) {
    category = await Category.findById(categoryId).catch(() => null);
  }

  const files = req.files || [];
  const imageUrls = [];
  for (const file of files) {
    const result = await uploadFromBuffer(file.buffer, "tralien-feedback");
    imageUrls.push(result.secure_url);
  }

  const deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const feedback = await Feedback.create({
    userId,
    displayName: displayName || "",
    contact: contact.trim(),
    title: resolveTitle(title, content, category?.name),
    content: content.trim(),
    location: {
      address: address ? address.trim() : "",
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
    },
    imageUrls,
    categoryId: category?._id,
    deadline,
  });

  // Đẩy sang Cổng góp ý 1022 — fire-and-forget, KHÔNG chặn phản hồi cho người dân.
  // Tin báo nhóm + mã phản ánh gửi cho dân đều do luồng này kích hoạt sau khi 1022
  // trả mã; thất bại sẽ được cgy1022RetryService quét lại (mỗi 10 phút).
  const { syncFeedbackById } = require("../services/cgy1022RetryService");
  syncFeedbackById(feedback._id).catch((err) =>
    console.error("[CGY1022] Lỗi đẩy phản ánh mới:", err.message)
  );

  // Lời cảm ơn gửi ngay, KHÔNG kèm mã — mã 1022 sẽ nhắn riêng khi cổng cấp.
  // Best-effort: Zalo API trục trặc cũng không được làm hỏng lượt gửi của người dân.
  try {
    await sendZaloText(
      userId,
      `Cảm ơn bạn đã gửi phản ánh tới UBND xã Trà Liên.\nLĩnh vực: ${
        category?.name || "Chưa phân loại"
      }\n${
        imageUrls.length ? `Đã đính kèm ${imageUrls.length} ảnh.\n` : ""
      }Chúng tôi sẽ gửi mã phản ánh ngay khi hệ thống 1022 tiếp nhận.`
    );
  } catch (err) {
    console.error("[publicFeedback] failed to notify citizen:", err.message);
  }

  res.json({ ok: true });
});

// Phản ánh của chính người dùng đang mở Mini App.
// Danh tính lấy từ access token Zalo (requireZaloUser), KHÔNG lấy từ tham số
// client gửi lên — nếu không thì ai biết userId của người khác cũng đọc được.
const MINE_LIMIT = 60; // lượt
const MINE_WINDOW_SECONDS = 60 * 60; // / giờ / user
const MINE_MAX_ROWS = 50;

router.get("/feedbacks/mine", requireZaloUser, async (req, res) => {
  const { allowed } = await checkRateLimit(
    `feedbacks-mine:${req.zaloUserId}`,
    MINE_LIMIT,
    MINE_WINDOW_SECONDS
  );
  if (!allowed) {
    return res.status(429).json({ error: "Bạn tra cứu quá nhiều lần. Vui lòng thử lại sau." });
  }

  try {
    const rows = await Feedback.find({ userId: req.zaloUserId })
      .sort({ createdAt: -1 })
      .limit(MINE_MAX_ROWS)
      .populate("categoryId", "name icon")
      .select(PUBLIC_FIELDS)
      .lean();

    // Chẩn đoán: id từ graph.zalo.me phải trùng id mà getUserInfo() lưu lúc gửi.
    // Nếu log này xuất hiện với người CHẮC CHẮN đã từng gửi phản ánh thì hai
    // nguồn id lệch nhau — đối chiếu id dưới đây với Feedback.userId trong DB.
    if (rows.length === 0) {
      console.log(`[publicFeedback] /mine: 0 kết quả cho zaloUserId=${req.zaloUserId}`);
    }

    res.json({ feedbacks: rows.map(toPublicView) });
  } catch (err) {
    console.error("[publicFeedback] lỗi lấy phản ánh của tôi:", err.message);
    res.status(500).json({ error: "Không tải được danh sách phản ánh" });
  }
});

// Tra cứu phản ánh theo mã (mã do Cổng góp ý 1022 cấp — feedback.cgy1022.gopyId),
// dùng cho người không mở đúng tài khoản Zalo đã gửi (vd. tra hộ người thân,
// hoặc mở lại link mã được nhắn qua tin nhắn). Không yêu cầu đăng nhập Zalo,
// nên rate-limit theo IP thay vì zaloUserId để tránh dò mã hàng loạt.
const BY_CODE_LIMIT = 30;
const BY_CODE_WINDOW_SECONDS = 60 * 60;

router.get("/feedbacks/by-code/:code", async (req, res) => {
  const code = (req.params.code || "").trim();
  if (!code) {
    return res.status(400).json({ error: "Thiếu mã phản ánh" });
  }

  const { allowed } = await checkRateLimit(`feedbacks-by-code:${req.ip}`, BY_CODE_LIMIT, BY_CODE_WINDOW_SECONDS);
  if (!allowed) {
    return res.status(429).json({ error: "Bạn tra cứu quá nhiều lần. Vui lòng thử lại sau." });
  }

  try {
    const fb = await Feedback.findOne({ "cgy1022.gopyId": code })
      .populate("categoryId", "name icon")
      .select(PUBLIC_FIELDS)
      .lean();
    if (!fb) {
      return res.status(404).json({ error: "Không tìm thấy phản ánh với mã này" });
    }
    res.json({ feedback: toPublicView(fb) });
  } catch (err) {
    console.error("[publicFeedback] lỗi tra cứu theo mã:", err.message);
    res.status(500).json({ error: "Không tra cứu được phản ánh lúc này" });
  }
});

router.get("/feedbacks/map", async (req, res) => {
  const feedbacks = await Feedback.find({
    status: { $ne: "resolved" },
    "location.lat": { $exists: true },
    "location.lng": { $exists: true },
  })
    .populate("categoryId", "name icon")
    .select("content location status categoryId createdAt")
    .lean();
  res.json({ feedbacks });
});

module.exports = router;
