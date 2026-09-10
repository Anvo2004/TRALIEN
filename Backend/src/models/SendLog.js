const mongoose = require("mongoose");

const sendLogSchema = new mongoose.Schema(
  {
    message: { type: String, default: "" },
    recipientCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    adminNote: { type: String, default: "" },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SendLog", sendLogSchema);
