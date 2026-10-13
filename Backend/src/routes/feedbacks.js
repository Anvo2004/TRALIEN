const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const config = require("../config");
const Feedback = require("../models/Feedback");
const AdminUser = require("../models/AdminUser");
const Category = require("../models/Category");
const { requireRole } = require("../middleware/auth");
const { sendZaloText } = require("../utils/zaloApi");
const { feedbackCode } = require("../services/feedbackNotifyService");
const cgy1022StatusService = require("../services/cgy1022StatusService");
const citizenService = require("../services/citizenService");

const router = express.Router();

const LEADER_ROLES = ["superadmin", "dept_leader"];
const OFFICER_ROLES = ["officer", "staff"];

// ============================================================
// Đính kèm nội bộ của phản ánh (phân công: lãnh đạo → cán bộ; dự thảo: cán bộ
// → lãnh đạo). Khác đính kèm của broadcast ở chỗ KHÔNG đẩy lên Zalo: đây là
// tài liệu trao đổi giữa cán bộ, người dân không thấy (xem whitelist trong
// services/feedbackPublicView.js). File lưu ra đĩa và phục vụ lại qua /images
// (đã mount trong app.js), trả về URL tuyệt đối để AdminWeb mở trực tiếp.
// ============================================================
const ATTACH_GROUP = "phan-anh-dinh-kem";
const ATTACH_DIR = path.join(__dirname, "..", "..", "public", "images", ATTACH_GROUP);
const ATTACH_ROLES = [...LEADER_ROLES, ...OFFICER_ROLES];
const MAX_IMAGES = 5;
const DOC_EXT = [".pdf", ".doc", ".csv"];

function attachStorage(prefix) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdir(ATTACH_DIR, { recursive: true }, (err) => cb(err, ATTACH_DIR));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`);
    },
  });
}

function attachUrl(filename) {
  return `${config.publicUrl}/images/${ATTACH_GROUP}/${filename}`;
}

function uploadError(err, limitLabel) {
  if (err.code === "LIMIT_FILE_SIZE") return `File vượt quá giới hạn ${limitLabel}`;
  if (err.code === "LIMIT_FILE_COUNT") return `Tối đa ${MAX_IMAGES} ảnh mỗi lần`;
  return err.message;
}

router.post("/attachments/upload/image", requireRole(...ATTACH_ROLES), (req, res) => {
  const upload = multer({
    storage: attachStorage("img"),
    limits: { fileSize: 10 * 1024 * 1024, files: MAX_IMAGES },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Chỉ nhận file ảnh"));
    },
  }).array("images", MAX_IMAGES);

  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: uploadError(err, "10MB/ảnh") });
    if (!req.files?.length) return res.status(400).json({ error: "Không có file ảnh" });
    res.json({
      images: req.files.map((f) => ({ url: attachUrl(f.filename), name: f.originalname })),
    });
  });
});

router.post("/attachments/upload/video", requireRole(...ATTACH_ROLES), (req, res) => {
  const upload = multer({
    storage: attachStorage("vid"),
    // 90MB chứ không phải 100MB: Nginx trên VPS đặt client_max_body_size 100M,
    // file sát ngưỡng sẽ bị Nginx trả 413 (trang HTML) trước khi tới Node, báo
    // lỗi khó hiểu cho cán bộ. Để thấp hơn một nhịp thì lỗi là của mình.
    limits: { fileSize: 90 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("video/")) cb(null, true);
      else cb(new Error("Chỉ nhận file video"));
    },
  }).single("video");

  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: uploadError(err, "90MB") });
    if (!req.file) return res.status(400).json({ error: "Không có file video" });
    res.json({ url: attachUrl(req.file.filename), name: req.file.originalname });
  });
});

router.post("/attachments/upload/file", requireRole(...ATTACH_ROLES), (req, res) => {
  const upload = multer({
    storage: attachStorage("file"),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (DOC_EXT.includes(ext)) cb(null, true);
      else cb(new Error(`Chỉ nhận file ${DOC_EXT.join(", ")}`));
    },
  }).single("file");

  upload(req, res, (err) => {
    if (err) return res.status(400).json({ error: uploadError(err, "20MB") });
    if (!req.file) return res.status(400).json({ error: "Không có file" });
    res.json({ url: attachUrl(req.file.filename), name: req.file.originalname });
  });
});

// Chỉ giữ đúng {url, name} client gửi lên, cắt độ dài và chặn quá 5 ảnh —
// không tin thẳng payload dù route đã sau requireAuth.
function cleanAttachment(item) {
  if (!item || typeof item.url !== "string" || !item.url.trim()) return undefined;
  return {
    url: item.url.trim().slice(0, 500),
    name: String(item.name || "").slice(0, 200),
  };
}

function buildBundle({ note, images, video, file }, userId) {
  return {
    note: typeof note === "string" ? note : "",
    images: Array.isArray(images)
      ? images.map(cleanAttachment).filter(Boolean).slice(0, MAX_IMAGES)
      : [],
    video: cleanAttachment(video),
    file: cleanAttachment(file),
    sentBy: userId,
    sentAt: new Date(),
  };
}

router.get("/", async (req, res) => {
  const { status, assignedTo, categoryId, q, page = 1 } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (categoryId) filter.categoryId = categoryId;

  if (OFFICER_ROLES.includes(req.user.role)) {
    filter.assignedTo = req.user.id;
  } else if (req.user.role === "dept_leader") {
    filter.categoryId = { $in: req.user.categoryIds || [] };
  }
  if (assignedTo && LEADER_ROLES.includes(req.user.role)) {
    filter.assignedTo = assignedTo;
  }

  if (q) {
    filter.$or = [
      { displayName: new RegExp(q, "i") },
      { contact: new RegExp(q, "i") },
      { content: new RegExp(q, "i") },
    ];
  }

  const limit = 20;
  const skip = (Number(page) - 1) * limit;

  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .populate("categoryId", "name icon")
      .populate("assignedTo", "fullName username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Feedback.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.json({ feedbacks: items, pagination: { page: Number(page), totalPages, total } });
});

router.get("/:id", async (req, res) => {
  const feedback = await Feedback.findById(req.params.id)
    .populate("categoryId")
    .populate("assignedTo", "fullName username")
    .populate("assignedBy", "fullName username")
    .populate("draftBy", "fullName username")
    .populate("approvedBy", "fullName username");

  if (!feedback) return res.status(404).json({ error: "Not found" });

  const [admins, categories] = await Promise.all([
    AdminUser.find().select("fullName username role categoryIds"),
    Category.find().sort({ order: 1 }),
  ]);

  res.json({ feedback, admins, categories });
});

router.put("/:id", async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { note: req.body.note || "" },
    { new: true }
  );
  if (!feedback) return res.status(404).json({ error: "Not found" });
  res.json({ feedback });
});

router.delete("/:id", requireRole("superadmin"), async (req, res) => {
  await Feedback.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.post("/:id/assign", requireRole(...LEADER_ROLES), async (req, res) => {
  const { assignedTo, note, images, video, file } = req.body;
  if (!assignedTo) return res.status(400).json({ error: "Thiếu cán bộ phụ trách" });

  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    {
      assignedTo,
      assignedBy: req.user.id,
      assignAttachments: buildBundle({ note, images, video, file }, req.user.id),
    },
    { new: true }
  );
  if (!feedback) return res.status(404).json({ error: "Not found" });

  const officer = await AdminUser.findById(assignedTo);
  if (officer?.zaloUserId) {
    sendZaloText(
      officer.zaloUserId,
      `📋 Bạn được giao xử lý phản ánh #${feedbackCode(feedback)}\n${feedback.content}${
        note ? `\nGhi chú: ${note}` : ""
      }`
    ).catch((err) => console.error("[feedbacks] assign notify failed:", err.message));
  }

  res.json({ feedback });
});

router.post("/:id/draft", requireRole(...OFFICER_ROLES, ...LEADER_ROLES), async (req, res) => {
  const { draftResponse, note, images, video, file } = req.body;
  if (!draftResponse) return res.status(400).json({ error: "Thiếu nội dung trả lời" });

  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ error: "Not found" });
  if (feedback.status === "resolved") {
    return res.status(400).json({ error: "Phản ánh đã được giải quyết" });
  }

  feedback.draftResponse = draftResponse;
  feedback.draftAttachments = buildBundle({ note, images, video, file }, req.user.id);
  feedback.draftBy = req.user.id;
  feedback.draftAt = new Date();
  feedback.status = "draft";
  await feedback.save();

  res.json({ feedback });
});

router.post("/:id/approve", requireRole(...LEADER_ROLES), async (req, res) => {
  const { finalResponse } = req.body;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ error: "Not found" });

  feedback.finalResponse = finalResponse || feedback.draftResponse;
  feedback.approvedBy = req.user.id;
  feedback.status = "resolved";
  feedback.sentAt = new Date();
  await feedback.save();

  // Phản ánh được phản hồi → cộng điểm công dân (một lần/phản ánh, sổ cái chống trùng).
  citizenService
    .awardFeedbackResolved(feedback)
    .catch((err) => console.error("[feedbacks] cộng điểm công dân thất bại:", err.message));

  sendZaloText(
    feedback.userId,
    `✅ Phản ánh #${feedbackCode(feedback)} của bạn đã được xử lý:\n${
      feedback.finalResponse
    }`
  ).catch((err) => console.error("[feedbacks] approve notify failed:", err.message));

  res.json({ feedback });
});

router.post("/:id/reject", requireRole(...LEADER_ROLES), async (req, res) => {
  const { rejectedReason } = req.body;
  if (!rejectedReason) return res.status(400).json({ error: "Thiếu lý do từ chối" });

  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { status: "pending", rejectedReason },
    { new: true }
  );
  if (!feedback) return res.status(404).json({ error: "Not found" });

  res.json({ feedback });
});

// Đồng bộ đọc kết quả xử lý từ 1022 đã chạy tự động qua cron (server.js) —
// route này chỉ để cán bộ kích hoạt lại thủ công khi cần (vd. vừa có tài
// khoản 1022, muốn kiểm tra ngay không đợi tới lượt quét kế tiếp).
router.post("/sync-cgy1022-status", requireRole("superadmin"), async (req, res) => {
  await cgy1022StatusService.runStatusSweep();
  res.json({ ok: true });
});

module.exports = router;
