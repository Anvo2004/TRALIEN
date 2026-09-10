const mongoose = require("mongoose");

const attachmentBundleSchema = new mongoose.Schema(
  {
    note: { type: String, default: "" },
    images: [{ url: String, name: String }],
    video: { url: String, name: String },
    file: { url: String, name: String },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    sentAt: Date,
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    // citizen / reporter
    userId: { type: String, required: true }, // Zalo user id (zmp-sdk getUserID)
    displayName: { type: String, default: "" },
    contact: { type: String, required: true }, // phone or email
    title: { type: String, default: "" }, // tiêu đề ngắn; để trống thì suy ra từ lĩnh vực/nội dung
    content: { type: String, required: true },
    location: {
      address: { type: String, default: "" },
      lat: Number,
      lng: Number,
    },
    imageUrls: [String], // Cloudinary URLs

    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    // workflow
    status: {
      type: String,
      enum: ["pending", "draft", "resolved"],
      default: "pending",
    },
    deadline: Date, // createdAt + 5 days

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    assignAttachments: attachmentBundleSchema,

    draftResponse: { type: String, default: "" },
    draftAttachments: attachmentBundleSchema,
    draftBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    draftAt: Date,

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    rejectedReason: { type: String, default: "" },
    finalResponse: { type: String, default: "" },
    sentAt: Date,

    note: { type: String, default: "" }, // internal admin note

    // Đồng bộ sang Cổng góp ý 1022 (gopy.danang.gov.vn) — xem services/cgy1022Service.js
    cgy1022: {
      synced: { type: Boolean, default: false },
      gopyId: { type: String, default: "" },
      syncedAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 },
      lastError: { type: String, default: "" },
      // Tin báo chỉ gửi sau khi có gopyId (xem feedbackNotifyService.js)
      groupNotified: { type: Boolean, default: false },
      citizenNotified: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ assignedTo: 1 });
feedbackSchema.index({ categoryId: 1 });
feedbackSchema.index({ userId: 1, createdAt: -1 }); // "Phản ánh của tôi"

module.exports = mongoose.model("Feedback", feedbackSchema);
