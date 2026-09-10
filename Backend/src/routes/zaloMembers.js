const express = require("express");
const Category = require("../models/Category");
const ZaloGroupMember = require("../models/ZaloGroupMember");
const { requireRole } = require("../middleware/auth");
const {
  getGroupMembersV3,
  getPendingGroupMembers,
  acceptGroupJoinRequest,
  rejectGroupJoinRequest,
} = require("../utils/zaloApi");

const router = express.Router();

function normalizePendingMember(m) {
  return {
    id: String(m.user_id ?? m.id ?? ""),
    name: m.display_name || m.name || "",
    avatar: m.avatar || "",
  };
}

// GET /:categoryId — danh sách members của nhóm
router.get("/:categoryId", async (req, res) => {
  try {
    const members = await ZaloGroupMember.find({ categoryId: req.params.categoryId })
      .sort({ displayName: 1 })
      .lean();
    res.json({ members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /manual/:categoryId — thêm thành viên thủ công (superadmin)
router.post("/manual/:categoryId", requireRole("superadmin"), async (req, res) => {
  try {
    const { displayName, zaloUserId } = req.body;
    if (!displayName?.trim() || !zaloUserId?.trim()) {
      return res.status(400).json({ error: "Cần nhập họ tên và Zalo User ID" });
    }

    const cat = await Category.findById(req.params.categoryId).lean();
    if (!cat) return res.status(404).json({ error: "Không tìm thấy danh mục" });

    const member = await ZaloGroupMember.findOneAndUpdate(
      { zaloUserId: zaloUserId.trim(), categoryId: cat._id },
      {
        zaloUserId: zaloUserId.trim(),
        displayName: displayName.trim(),
        categoryId: cat._id,
        groupId: cat.zaloGroupId,
        syncedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    res.status(201).json({ ok: true, member });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /member/:memberId — xóa thành viên (superadmin)
router.delete("/member/:memberId", requireRole("superadmin"), async (req, res) => {
  try {
    await ZaloGroupMember.findByIdAndDelete(req.params.memberId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /sync/:categoryId — đồng bộ thành viên từ Zalo API (superadmin)
router.post("/sync/:categoryId", requireRole("superadmin"), async (req, res) => {
  try {
    const cat = await Category.findById(req.params.categoryId).lean();
    if (!cat) return res.status(404).json({ error: "Không tìm thấy danh mục" });
    if (!cat.zaloGroupId) return res.status(400).json({ error: "Danh mục chưa có Group ID" });

    const members = await getGroupMembersV3(cat.zaloGroupId);
    if (!members) return res.json({ synced: 0 });

    await ZaloGroupMember.deleteMany({ categoryId: cat._id });

    let count = 0;
    for (const m of members) {
      if (m.oa_id) continue;
      await ZaloGroupMember.create({
        zaloUserId: String(m.user_id),
        displayName: m.name || "Người dùng Zalo",
        avatar: m.avatar || "",
        categoryId: cat._id,
        groupId: String(cat.zaloGroupId),
        syncedAt: new Date(),
      });
      count++;
    }

    res.json({ synced: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /pending/:categoryId — người đang chờ duyệt vào nhóm (superadmin)
router.get("/pending/:categoryId", requireRole("superadmin"), async (req, res) => {
  try {
    const cat = await Category.findById(req.params.categoryId).lean();
    if (!cat) return res.status(404).json({ error: "Không tìm thấy danh mục" });
    if (!cat.zaloGroupId) return res.status(400).json({ error: "Danh mục chưa có Group ID" });
    const { members, total } = await getPendingGroupMembers(cat.zaloGroupId);
    res.json({ total, members: members.map(normalizePendingMember) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /pending/:categoryId/approve — duyệt vào nhóm + lưu DB (superadmin)
router.post("/pending/:categoryId/approve", requireRole("superadmin"), async (req, res) => {
  try {
    const { users } = req.body; // [{ id, name, avatar }]
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "Cần chọn ít nhất 1 người để duyệt" });
    }
    const cat = await Category.findById(req.params.categoryId).lean();
    if (!cat) return res.status(404).json({ error: "Không tìm thấy danh mục" });
    if (!cat.zaloGroupId) return res.status(400).json({ error: "Danh mục chưa có Group ID" });

    await acceptGroupJoinRequest(cat.zaloGroupId, users.map((u) => u.id));
    for (const u of users) {
      await ZaloGroupMember.findOneAndUpdate(
        { zaloUserId: String(u.id), categoryId: cat._id },
        {
          zaloUserId: String(u.id),
          displayName: u.name || "Người dùng Zalo",
          avatar: u.avatar || "",
          categoryId: cat._id,
          groupId: String(cat.zaloGroupId),
          syncedAt: new Date(),
        },
        { upsert: true }
      );
    }
    res.json({ ok: true, approved: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /pending/:categoryId/reject — từ chối yêu cầu vào nhóm (superadmin)
router.post("/pending/:categoryId/reject", requireRole("superadmin"), async (req, res) => {
  try {
    const { userIds } = req.body; // [id, ...]
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "Cần chọn ít nhất 1 người để từ chối" });
    }
    const cat = await Category.findById(req.params.categoryId).lean();
    if (!cat) return res.status(404).json({ error: "Không tìm thấy danh mục" });
    if (!cat.zaloGroupId) return res.status(400).json({ error: "Danh mục chưa có Group ID" });
    await rejectGroupJoinRequest(cat.zaloGroupId, userIds);
    res.json({ ok: true, rejected: userIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
