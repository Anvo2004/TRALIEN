const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  zaloUserId: { type: String, required: true },
  displayName: { type: String, default: "" },
  avatar: { type: String, default: "" },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  groupId: { type: String, default: "" },
  syncedAt: { type: Date, default: Date.now },
});

schema.index({ zaloUserId: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model("ZaloGroupMember", schema);
