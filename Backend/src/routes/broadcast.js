const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const SendLog = require("../models/SendLog");
const { requireRole } = require("../middleware/auth");
const broadcastService = require("../services/broadcastService");
const { uploadImageToZalo, uploadFileToZalo } = require("../utils/zaloApi");
const config = require("../config");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "../../public/images");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Sending Zalo messages to the whole citizen base is sensitive enough that
// only the highest role (Lãnh đạo UBND) can do it — same gate as the reference.
router.use(requireRole("superadmin"));

router.get("/followers", async (req, res) => {
  const followers = await broadcastService.getCachedFollowers();
  res.json({ followers });
});

router.post("/followers/sync", async (req, res) => {
  try {
    const followers = await broadcastService.syncFollowers();
    res.json({ followers, count: followers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/groups", async (req, res) => {
  const groups = await broadcastService.getGroups();
  res.json({ groups });
});

router.post("/groups", async (req, res) => {
  const { id, name } = req.body;
  if (!id) return res.status(400).json({ error: "Thiếu Group ID" });
  const groups = await broadcastService.addGroup({ id, name });
  res.json({ groups });
});

router.delete("/groups/:id", async (req, res) => {
  const groups = await broadcastService.removeGroup(req.params.id);
  res.json({ groups });
});

router.post("/groups/import-from-categories", async (req, res) => {
  const groups = await broadcastService.importGroupsFromCategories();
  res.json({ groups });
});

router.post("/upload/image", (req, res) => {
  const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_, file, cb) =>
      cb(null, `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${path.extname(file.originalname)}`),
  });
  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Chỉ nhận file ảnh"));
    },
  }).array("images", 5);

  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.files?.length) return res.status(400).json({ error: "Không có file" });
    try {
      const attachmentIds = await Promise.all(
        req.files.map(async (file) => {
          const id = await uploadImageToZalo(file.path);
          fs.unlink(file.path, () => {});
          return id;
        })
      );
      res.json({ ok: true, attachmentIds });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

router.post("/upload/video", (req, res) => {
  const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_, file, cb) =>
      cb(null, `vid_${Date.now()}${path.extname(file.originalname)}`),
  });
  const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
  }).single("video");

  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Không có file video" });

    // URL TUYỆT ĐỐI (Zalo cần https://... đầy đủ). KHÔNG tự xoá sau vài giờ —
    // link phải sống để người nhận xem lại sau khi broadcast.
    const videoUrl = `${config.publicUrl}/images/${req.file.filename}`;
    res.json({ ok: true, articleToken: videoUrl });
  });
});

router.post("/upload/file", (req, res) => {
  const ALLOWED_EXT = [".pdf", ".doc", ".csv"];
  const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_, file, cb) =>
      cb(null, `file_${Date.now()}${path.extname(file.originalname).toLowerCase()}`),
  });
  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ALLOWED_EXT.includes(ext)) cb(null, true);
      else cb(new Error("Zalo chỉ hỗ trợ file .pdf, .doc, .csv"));
    },
  }).single("file");

  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Không có file" });
    try {
      const token = await uploadFileToZalo(req.file.path, req.file.originalname);
      fs.unlink(req.file.path, () => {});
      res.json({ ok: true, attachmentId: token });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

router.post("/send", async (req, res) => {
  const {
    userIds,
    message,
    adminNote,
    attachmentIds,
    videoAttachmentId,
    fileAttachmentId,
    linkUrl,
    linkTitle,
  } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: "Chưa chọn người nhận" });
  }

  const hasContent =
    (message && message.trim()) ||
    (attachmentIds && attachmentIds.length > 0) ||
    videoAttachmentId ||
    fileAttachmentId ||
    linkUrl;

  if (!hasContent) {
    return res.status(400).json({ error: "Thiếu nội dung tin nhắn hoặc đính kèm" });
  }

  const jobId = await broadcastService.sendBroadcast({
    userIds,
    message: message ? message.trim() : "",
    attachments: {
      attachmentIds,
      videoAttachmentId,
      fileAttachmentId,
    },
    linkUrl,
    linkTitle,
    adminNote,
    sentBy: req.user.id,
  });

  res.json({ jobId, total: userIds.length });
});

router.get("/status/:jobId", (req, res) => {
  const status = broadcastService.getJobStatus(req.params.jobId);
  if (!status) return res.status(404).json({ error: "Not found" });
  res.json(status);
});

router.get("/logs", async (req, res) => {
  const logs = await SendLog.find()
    .populate("sentBy", "fullName username")
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ logs });
});

module.exports = router;
