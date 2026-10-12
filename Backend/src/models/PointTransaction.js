const mongoose = require("mongoose");
const { POINT_TYPES } = require("../services/citizenRules");

// Sổ cái điểm. Khoá duy nhất (zaloUserId, type, refId) chống cộng trùng:
// vd. cùng một phản ánh chỉ được cộng điểm một lần dù bị xử lý lại.
const pointTransactionSchema = new mongoose.Schema(
  {
    zaloUserId: { type: String, required: true, index: true },
    type: { type: String, enum: POINT_TYPES, required: true },
    refId: { type: String, default: "" },
    points: { type: Number, required: true },
    note: { type: String, default: "" },
    createdBy: { type: String, default: "" }, // tên cán bộ khi điều chỉnh tay
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

pointTransactionSchema.index({ zaloUserId: 1, type: 1, refId: 1 }, { unique: true });

module.exports = mongoose.model("PointTransaction", pointTransactionSchema);
