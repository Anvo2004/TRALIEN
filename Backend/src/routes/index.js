const express = require("express");
const { requireAuth } = require("../middleware/auth");

const publicFeedbackRoutes = require("./publicFeedback");
const publicLookupRoutes = require("./publicLookup");
const assistantRoutes = require("./assistant");
const authRoutes = require("./auth");
const zaloWebhookRoutes = require("./zaloWebhook");
const feedbackRoutes = require("./feedbacks");
const categoryRoutes = require("./categories");
const broadcastRoutes = require("./broadcast");
const troCapRoutes = require("./troCap");
const noticeRoutes = require("./notices");
const lichCupDienRoutes = require("./lichCupDien");
const lichYTeRoutes = require("./lichYTe");
const thuTucHanhChinhRoutes = require("./thuTucHanhChinh");
const appLinksRoutes = require("./appLinks");
const vanBanRoutes = require("./vanBan");
const villageRoutes = require("./villages");
const siteContentRoutes = require("./siteContent");
const statsRoutes = require("./stats");
const userRoutes = require("./users");
const zaloMembersRoutes = require("./zaloMembers");

const router = express.Router();

// Public, unauthenticated routes (citizen-facing, called from the Zalo Mini App)
router.use("/public", publicFeedbackRoutes);
router.use("/public", publicLookupRoutes);
router.use("/public/assistant", assistantRoutes);
router.use("/auth", authRoutes);
// Zalo gọi vào endpoint này (sự kiện rút lại đồng ý/xoá dữ liệu...) — không qua JWT admin.
router.use("/zalo", zaloWebhookRoutes);

// Everything below requires a valid admin JWT
router.use(requireAuth);
router.use("/stats", statsRoutes);
router.use("/feedbacks", feedbackRoutes);
router.use("/users", userRoutes);
router.use("/zalo-members", zaloMembersRoutes);
router.use("/categories", categoryRoutes);
router.use("/broadcast", broadcastRoutes);
router.use("/tro-cap", troCapRoutes);
router.use("/notices", noticeRoutes);
router.use("/lich-cup-dien", lichCupDienRoutes);
router.use("/lich-y-te", lichYTeRoutes);
router.use("/thu-tuc-hanh-chinh", thuTucHanhChinhRoutes);
router.use("/app-links", appLinksRoutes);
router.use("/van-ban", vanBanRoutes);
router.use("/thon-xom", villageRoutes);
router.use("/", siteContentRoutes);

module.exports = router;
