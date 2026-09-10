// ============================================================
// Chuyển document Feedback → dạng CÔNG KHAI cho người dân xem.
//
// Model Feedback chứa nhiều dữ liệu nội bộ. Whitelist ở đây là ranh giới duy
// nhất giữa dữ liệu nội bộ và dữ liệu người dân đọc được — thêm field mới vào
// model sẽ KHÔNG tự động lọt ra ngoài.
//
// TUYỆT ĐỐI KHÔNG trả ra:
//   draftResponse / draftAttachments — bản nháp lãnh đạo CHƯA duyệt
//   note                            — ghi chú nội bộ giữa cán bộ
//   rejectedReason                  — lý do lãnh đạo trả lại bản nháp
//   assignedTo / assignedBy / approvedBy / draftBy — quy trình nội bộ
//   cgy1022.lastError / attempts    — lỗi kỹ thuật, dân không cần biết
//   contact / userId                — dữ liệu định danh, client đã có sẵn
// ============================================================

// Chỉ những field dưới đây được đọc lên từ Mongo.
const PUBLIC_FIELDS = [
  "_id",
  "title",
  "content",
  "imageUrls",
  "imageUrl",
  "location.address",
  "categoryId",
  "status",
  "createdAt",
  "deadline",
  "sentAt",
  "finalResponse",
  "assignAttachments.sentAt",
  "draftAt",
  "cgy1022.gopyId",
  "cgy1022.syncedAt",
].join(" ");

// status nội bộ (pending/draft/resolved) → trạng thái người dân hiểu được.
// LƯU Ý: "draft" nghĩa là cán bộ đã soạn trả lời nhưng lãnh đạo chưa duyệt —
// với người dân đó vẫn chỉ là ĐANG XỬ LÝ, tuyệt đối không phải "đã trả lời".
function toCitizenStatus(fb) {
  if (fb.status === "resolved") return { key: "answered", label: "Đã trả lời" };
  if (fb.status === "draft" || fb.assignAttachments?.sentAt) {
    return { key: "processing", label: "Đang xử lý" };
  }
  return { key: "received", label: "Đã tiếp nhận" };
}

function buildTimeline(fb) {
  const processingAt = fb.assignAttachments?.sentAt || fb.draftAt || null;
  return [
    { key: "sent", label: "Đã gửi phản ánh", at: fb.createdAt },
    { key: "cgy1022", label: "Tiếp nhận trên hệ thống 1022", at: fb.cgy1022?.syncedAt || null },
    { key: "processing", label: "Đang xử lý", at: processingAt },
    { key: "answered", label: "Đã trả lời", at: fb.sentAt || null },
  ];
}

function toPublicView(fb) {
  const status = toCitizenStatus(fb);
  const imageUrls = fb.imageUrls?.length ? fb.imageUrls : fb.imageUrl ? [fb.imageUrl] : [];

  return {
    id: String(fb._id),
    code: fb.cgy1022?.gopyId || null, // null = chưa có mã 1022, KHÔNG bịa mã thay thế
    title: fb.title || "",
    content: fb.content || "",
    imageUrls,
    address: fb.location?.address || "",
    category: fb.categoryId
      ? { name: fb.categoryId.name || "", icon: fb.categoryId.icon || "" }
      : null,
    status: status.key,
    statusLabel: status.label,
    createdAt: fb.createdAt,
    deadline: fb.deadline || null,
    // Chỉ trả finalResponse (đã được lãnh đạo duyệt), không bao giờ trả draftResponse.
    response: fb.status === "resolved" && fb.finalResponse
      ? { text: fb.finalResponse, sentAt: fb.sentAt || null }
      : null,
    timeline: buildTimeline(fb),
  };
}

module.exports = { PUBLIC_FIELDS, toPublicView };
