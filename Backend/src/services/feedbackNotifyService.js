const Feedback = require("../models/Feedback");
const { sendZaloText, sendZaloToGroup } = require("../utils/zaloApi");

// ============================================================
// Thông báo phản ánh (nhóm Zalo + người dân).
//
// Mã phản ánh LUÔN là mã do Cổng góp ý 1022 cấp (cgy1022.gopyId) — hệ thống
// KHÔNG tự sinh mã. Vì vậy tin nhắn chỉ được gửi sau khi đẩy 1022 xong; caller
// (cgy1022RetryService) quyết định thời điểm gọi. Mỗi phản ánh chỉ báo 1 lần,
// chốt bằng cờ cgy1022.groupNotified / cgy1022.citizenNotified.
// ============================================================

const NO_CODE = "(chưa có mã 1022)";

// "14:08:36 17/7/2026" theo giờ VN
function formatVnTime(date) {
  const vn = new Date(new Date(date).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(vn.getHours())}:${pad(vn.getMinutes())}:${pad(vn.getSeconds())} ${vn.getDate()}/${
    vn.getMonth() + 1
  }/${vn.getFullYear()}`;
}

function feedbackCode(fb) {
  return fb?.cgy1022?.gopyId || NO_CODE;
}

function buildGroupMessage(fb) {
  const imageUrls = fb.imageUrls?.length ? fb.imageUrls : fb.imageUrl ? [fb.imageUrl] : [];
  const lines = [
    `📥 PHẢN ÁNH MỚI - ${formatVnTime(fb.createdAt)}`,
    "━━━━━━━━━━━━━━━━━━━━━━",
    `📌 Tiêu đề: ${fb.title || "(không có)"}`,
    `👤 Tên: ${fb.displayName || "(không có)"}`,
    `🏷️ Loại: ${fb.categoryId?.name || "Chưa phân loại"}`,
    `📍 Địa chỉ: ${fb.location?.address || "(không có)"}`,
    "📝 Nội dung:",
    fb.content,
  ];

  if (imageUrls.length) {
    lines.push(`🖼️ Ảnh: ${imageUrls.length} ảnh`, ...imageUrls.map((url) => `   ${url}`));
  } else {
    lines.push("🖼️ Ảnh: Không có");
  }

  lines.push(`🆔 Mã phản ánh: ${feedbackCode(fb)}`);
  return lines.join("\n");
}

// Chốt cờ trước khi gửi (atomic) để retry job và luồng tạo mới không gửi trùng.
// Gửi hỏng thì nhả cờ ra cho lượt quét sau thử lại.
async function claimFlag(feedbackId, flag) {
  const claimed = await Feedback.findOneAndUpdate(
    { _id: feedbackId, [`cgy1022.${flag}`]: { $ne: true } },
    { $set: { [`cgy1022.${flag}`]: true } }
  );
  return Boolean(claimed);
}

async function releaseFlag(feedbackId, flag) {
  await Feedback.updateOne({ _id: feedbackId }, { $set: { [`cgy1022.${flag}`]: false } });
}

// Báo nhóm Zalo của lĩnh vực. Gọi khi đã đẩy 1022 xong (hoặc đã bỏ cuộc —
// khi đó mã hiển thị là "(chưa có mã 1022)", KHÔNG bịa mã thay thế).
async function notifyGroup(feedbackId) {
  const fb = await Feedback.findById(feedbackId)
    .populate("categoryId", "name zaloGroupId")
    .lean();
  if (!fb) return false;

  // Lĩnh vực chưa gắn nhóm Zalo: coi như đã xong, đừng để sweep quét lại mãi.
  const groupId = fb.categoryId?.zaloGroupId;
  if (!groupId) {
    await claimFlag(feedbackId, "groupNotified");
    return false;
  }
  if (!(await claimFlag(feedbackId, "groupNotified"))) return false;

  try {
    const result = await sendZaloToGroup(buildGroupMessage(fb), groupId);
    if (result?.error && result.error !== 0) {
      throw new Error(`[${result.error}] ${result.message || "Zalo API lỗi"}`);
    }
    return true;
  } catch (err) {
    console.error("[notify] gửi nhóm thất bại:", err.message);
    await releaseFlag(feedbackId, "groupNotified");
    return false;
  }
}

// Gửi mã 1022 về cho người dân. Chưa có mã thì không gửi — chờ lượt sau.
async function notifyCitizenCode(feedbackId) {
  const fb = await Feedback.findById(feedbackId).populate("categoryId", "name").lean();
  if (!fb) return false;
  if (!fb.cgy1022?.gopyId) {
    // Đã đồng bộ mà 1022 không trả mã → không có gì để gửi, chốt cờ cho xong.
    if (fb.cgy1022?.synced) await claimFlag(feedbackId, "citizenNotified");
    return false;
  }
  if (!(await claimFlag(feedbackId, "citizenNotified"))) return false;

  try {
    const result = await sendZaloText(
      fb.userId,
      `Phản ánh của bạn đã được tiếp nhận trên hệ thống 1022.\n🆔 Mã phản ánh: ${fb.cgy1022.gopyId}\n🏷️ Lĩnh vực: ${
        fb.categoryId?.name || "Chưa phân loại"
      }\nVui lòng lưu mã này để tra cứu tiến độ xử lý.`
    );
    if (result?.error && result.error !== 0) {
      throw new Error(`[${result.error}] ${result.message || "Zalo API lỗi"}`);
    }
    return true;
  } catch (err) {
    console.error("[notify] gửi mã cho người dân thất bại:", err.message);
    await releaseFlag(feedbackId, "citizenNotified");
    return false;
  }
}

module.exports = { notifyGroup, notifyCitizenCode, feedbackCode, formatVnTime, NO_CODE };
