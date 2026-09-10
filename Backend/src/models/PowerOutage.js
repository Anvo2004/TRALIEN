const mongoose = require("mongoose");

// Mirrors EVN CPC's public outage-schedule API response shape (see
// src/services/catDienService.js) — synced automatically, never entered by hand.
const powerOutageSchema = new mongoose.Schema({
  subOrgCode: { type: String, default: "" },
  subOrgName: { type: String, default: "" },
  stationCode: { type: String, default: "" },
  stationName: { type: String, default: "" },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  fromDateStr: { type: String, default: "" },
  toDateStr: { type: String, default: "" },
  outageType: { type: String, default: "" },
  statusStr: { type: String, default: "" },
  reason: { type: String, default: "" },
  crawledAt: { type: Date, default: Date.now },
});

powerOutageSchema.index({ stationCode: 1, fromDate: 1, toDate: 1 }, { unique: true });

module.exports = mongoose.model("PowerOutage", powerOutageSchema);
