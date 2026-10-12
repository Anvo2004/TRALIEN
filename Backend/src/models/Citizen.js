const mongoose = require("mongoose");

// Hồ sơ công dân dùng Mini App (định danh = Zalo user id). Điểm/hạng là số
// suy ra từ PointTransaction, lưu lại ở đây để liệt kê/sắp xếp nhanh.
const citizenSchema = new mongoose.Schema(
  {
    zaloUserId: { type: String, required: true, unique: true },
    displayName: { type: String, default: "" },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    villageId: { type: mongoose.Schema.Types.ObjectId, ref: "Village", default: null },
    villageName: { type: String, default: "" },
    referralCode: { type: String, required: true, unique: true },
    referredBy: { type: String, default: "" }, // zaloUserId người giới thiệu
    referredAt: { type: Date, default: null },
    points: { type: Number, default: 0 },
    tierKey: { type: String, default: "" },
    followedOA: { type: Boolean, default: false },
    registeredAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

citizenSchema.index({ points: -1 });
citizenSchema.index({ displayName: "text" });

module.exports = mongoose.model("Citizen", citizenSchema);
