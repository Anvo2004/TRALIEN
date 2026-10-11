const express = require("express");
const multer = require("multer");
const AppIcon = require("../models/AppIcon");
const { uploadFromBuffer } = require("../utils/cloudinary");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

const WRITE_ROLES = ["superadmin", "dept_leader", "officer"];
const ALLOWED_TYPES = ["image/png", "image/webp"];

// Icon là ảnh nhỏ (~20KB sau khi thu về 192px) — giới hạn 1MB đủ rộng cho ảnh
// cán bộ tự thiết kế mà vẫn chặn được người lỡ upload ảnh chụp màn hình.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error("Chỉ nhận ảnh PNG hoặc WEBP (nền trong suốt)"));
    }
    cb(null, true);
  },
});

router.get("/", async (req, res) => {
  const items = await AppIcon.find().sort({ group: 1, order: 1, label: 1 }).lean();
  res.json({ items });
});

router.post("/upload", requireRole(...WRITE_ROLES), (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const tooLarge = err.code === "LIMIT_FILE_SIZE";
      return res.status(400).json({ error: tooLarge ? "Ảnh vượt quá 1MB" : err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Thiếu file ảnh" });
  }

  const label = (req.body.label || req.file.originalname.replace(/\.[^.]+$/, "")).trim();
  const result = await uploadFromBuffer(req.file.buffer, "tralien-icons");

  // key phải duy nhất: ảnh cán bộ tự upload lấy mốc thời gian để không đụng
  // slug của bộ icon seed sẵn.
  const item = await AppIcon.create({
    key: `upload-${Date.now()}`,
    label,
    url: result.secure_url,
    group: req.body.group || "Tự tải lên",
    createdBy: req.user.id,
  });

  res.json({ item });
});

// Chỉ gỡ khỏi thư viện chọn nhanh; ảnh đã upload vẫn còn trên Cloudinary nên
// các AppLink đang trỏ tới URL đó không bị mất icon.
router.delete("/:id", requireRole(...WRITE_ROLES), async (req, res) => {
  await AppIcon.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
