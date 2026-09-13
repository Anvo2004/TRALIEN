const Feedback = require("../models/Feedback");
const cgy1022 = require("./cgy1022Service");
const { sendZaloText } = require("../utils/zaloApi");
const { feedbackCode } = require("./feedbackNotifyService");

// ============================================================
// Đọc ngược tình trạng xử lý từ Cổng góp ý 1022 → cập nhật Feedback + báo
// kết quả cho dân qua Zalo. Đây là chiều NGƯỢC LẠI của cgy1022RetryService
// (chỉ mới đẩy góp ý LÊN 1022, chưa từng đọc lại kết quả).
//
// Dùng GET /public/gopy/{gopyId} (xem "Tài liệu mô tả API" trong docs/,
// mục "API lấy chi tiết góp ý") — trả maTinhTrangXuLy + thongTinXuLy[].
// Khi maTinhTrangXuLy = "DA_XU_LY" (1022 đã xử lý xong), lấy noiDungXuLy
// mới nhất làm finalResponse, đánh dấu status="resolved" NGAY TRONG HỆ
// THỐNG TA (không cần lãnh đạo bấm duyệt lại — 1022 đã là nơi xử lý thật),
// rồi gửi Zalo cho dân — đúng luồng "Thông báo kết quả xử lý từ Cổng góp ý
// của thành phố đến người dân" xã yêu cầu.
//
// Nguyên tắc giống các service khác trong dự án: không cấu hình → tự tắt,
// lỗi 1 bản không được làm hỏng cả lượt quét.
// ============================================================

const POLL_INTERVAL_MS = 30 * 60 * 1000; // quét mỗi 30 phút
const BATCH_SIZE = 20; // mỗi lượt tối đa 20 bản, tuần tự (tránh dồn dập lên 1022)

// 1022 trả tình trạng dạng "CHUA_XU_LY" | "DANG_XU_LY" | "CHUYEN_TIEP" | "DA_XU_LY".
// Chỉ "DA_XU_LY" mới coi là có kết quả cuối để báo dân — các trạng thái khác
// (đang chuyển tiếp/đang xử lý) không đụng tới status nội bộ, tránh giẫm chân
// luồng duyệt thủ công của cán bộ (draft/approve) đang chạy song song.
const RESOLVED_STATUS = "DA_XU_LY";

function extractNoiDungXuLy(detail) {
  const list = Array.isArray(detail?.thongTinXuLy) ? detail.thongTinXuLy : [];
  // 1022 trả theo thứ tự xử lý — lấy bản ghi CUỐI CÙNG (mới nhất) có nội dung.
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i]?.noiDungXuLy?.trim()) return list[i].noiDungXuLy.trim();
  }
  return "";
}

// Kiểm tra + đồng bộ kết quả 1 phản ánh. Trả true nếu vừa chuyển sang "đã có kết quả".
async function checkFeedbackStatus(feedbackId) {
  const fb = await Feedback.findById(feedbackId).lean();
  if (!fb || !fb.cgy1022?.gopyId) return false;

  let detail;
  try {
    detail = await cgy1022.getFeedbackDetail(fb.cgy1022.gopyId);
  } catch (err) {
    console.warn(`[CGY1022Status] Đọc trạng thái ${fb.cgy1022.gopyId} thất bại:`, err.message);
    return false;
  }

  if (detail?.maTinhTrangXuLy !== RESOLVED_STATUS) return false;

  const noiDungXuLy = extractNoiDungXuLy(detail);
  if (!noiDungXuLy) {
    console.warn(`[CGY1022Status] ${fb.cgy1022.gopyId} đã DA_XU_LY nhưng không có noiDungXuLy`);
    return false;
  }

  // Atomic: chỉ 1 lượt quét được "chốt" resolved cho mỗi phản ánh, tránh gửi Zalo trùng
  // nếu job trước chưa kịp lưu xong mà job sau đã chạy tới (không nên xảy ra vì cách
  // nhau 30 phút, nhưng vẫn phòng thủ giống các nơi khác trong dự án).
  const claimed = await Feedback.findOneAndUpdate(
    { _id: feedbackId, status: { $ne: "resolved" } },
    {
      $set: {
        status: "resolved",
        finalResponse: noiDungXuLy,
        sentAt: new Date(),
      },
    },
    { new: true }
  );
  if (!claimed) return false; // đã resolved từ trước (vd. lãnh đạo duyệt tay trước khi 1022 trả kết quả)

  console.log(`[CGY1022Status] Phản ánh ${feedbackId} (mã ${fb.cgy1022.gopyId}) đã có kết quả từ 1022`);

  try {
    await sendZaloText(
      claimed.userId,
      `✅ Phản ánh #${feedbackCode(claimed)} của bạn đã được xử lý:\n${noiDungXuLy}`
    );
  } catch (err) {
    // Không rollback status — kết quả đã đúng và đã lưu, chỉ tin báo lỗi. Cán bộ
    // vẫn thấy đúng kết quả trên AdminWeb; dân có thể tự tra qua mã ở "Phản ánh
    // của tôi" / tra cứu theo mã nếu lỡ không nhận được tin Zalo.
    console.error(`[CGY1022Status] Gửi Zalo báo kết quả thất bại cho ${feedbackId}:`, err.message);
  }

  return true;
}

async function runStatusSweep() {
  if (!cgy1022.isConfigured()) {
    console.log("[CGY1022Status] Bỏ qua đọc kết quả xử lý: CGY1022 chưa được cấu hình");
    return;
  }
  try {
    const pending = await Feedback.find({
      "cgy1022.synced": true,
      "cgy1022.gopyId": { $ne: "" },
      status: { $ne: "resolved" },
    })
      .sort({ "cgy1022.syncedAt": 1 })
      .limit(BATCH_SIZE)
      .select("_id")
      .lean();

    if (pending.length === 0) return;

    let resolvedCount = 0;
    for (const { _id } of pending) {
      if (await checkFeedbackStatus(_id)) resolvedCount++;
    }
    console.log(
      `[CGY1022Status] Quét ${pending.length} phản ánh, ${resolvedCount} vừa có kết quả mới`
    );
  } catch (err) {
    console.error("[CGY1022Status] Lượt quét lỗi:", err.message);
  }
}

function startCgy1022StatusPolling() {
  if (!cgy1022.isConfigured()) {
    console.log("[CGY1022Status] Chưa cấu hình (.env) — bỏ qua đọc kết quả xử lý 1022");
    return;
  }
  // Lần đầu sau 5 phút khởi động (đợi retry job đẩy hết góp ý mới trước), sau đó mỗi 30 phút.
  setTimeout(() => {
    runStatusSweep();
    setInterval(runStatusSweep, POLL_INTERVAL_MS);
  }, 5 * 60 * 1000);
  console.log("[CGY1022Status] Job đọc kết quả xử lý 1022 đã khởi động (quét mỗi 30 phút)");
}

module.exports = { checkFeedbackStatus, runStatusSweep, startCgy1022StatusPolling };
