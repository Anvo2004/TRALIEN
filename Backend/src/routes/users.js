const express = require("express");
const bcrypt = require("bcryptjs");
const AdminUser = require("../models/AdminUser");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// Chỉ superadmin mới quản lý tài khoản
router.use(requireRole("superadmin"));

// GET / — danh sách
router.get("/", async (req, res) => {
  try {
    const users = await AdminUser.find({}, "-password")
      .populate("categoryIds", "name icon")
      .sort({ createdAt: 1 })
      .lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id — chi tiết
router.get("/:id", async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id, "-password")
      .populate("categoryIds", "name icon")
      .lean();
    if (!user) return res.status(404).json({ error: "Không tìm thấy tài khoản" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / — tạo tài khoản
router.post("/", async (req, res) => {
  try {
    const { username, password, fullName, role, zaloUserId, categoryIds } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await AdminUser.create({
      username,
      password: hashed,
      fullName,
      role: role || "officer",
      zaloUserId: zaloUserId || "",
      categoryIds: categoryIds || [],
    });
    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        categoryIds: user.categoryIds,
      },
    });
  } catch (err) {
    const msg = err.code === 11000 ? "Tên đăng nhập đã tồn tại" : err.message;
    res.status(400).json({ error: msg });
  }
});

// PUT /:id — cập nhật
router.put("/:id", async (req, res) => {
  try {
    const { fullName, role, password, zaloUserId, categoryIds } = req.body;
    const user = await AdminUser.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Không tìm thấy tài khoản" });
    user.fullName = fullName;
    user.role = role;
    if (zaloUserId !== undefined) user.zaloUserId = zaloUserId;
    if (categoryIds !== undefined) user.categoryIds = categoryIds;
    if (password && password.trim()) {
      user.password = await bcrypt.hash(password.trim(), 10);
    }
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — xóa
router.delete("/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Không thể xóa tài khoản đang đăng nhập" });
    }
    await AdminUser.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
