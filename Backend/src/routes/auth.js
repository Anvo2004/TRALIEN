const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");
const AdminUser = require("../models/AdminUser");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Thiếu tài khoản hoặc mật khẩu" });
  }

  const user = await AdminUser.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
  }

  const payload = {
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    categoryIds: user.categoryIds,
  };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "8h" });
  res.json({ token, user: payload });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await AdminUser.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user });
});

module.exports = router;
