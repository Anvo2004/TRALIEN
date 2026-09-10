const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: "" },
  zaloGroupId: { type: String, default: "" },
  order: { type: Number, default: 0 },
});

module.exports = mongoose.model("Category", categorySchema);
