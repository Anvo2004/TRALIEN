const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    fullName: { type: String, default: "" },
    role: {
      type: String,
      enum: ["superadmin", "dept_leader", "officer", "staff"],
      default: "officer",
    },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    zaloUserId: { type: String, default: "" }, // for OTP password reset + internal messaging
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminUser", adminUserSchema);
