const Setting = require("../models/Setting");

async function redisCmd(...args) {
  // Deprecated, do not use
  return null;
}

async function redisGet(key) {
  try {
    const doc = await Setting.findOne({ key }).lean();
    return doc ? doc.value : null;
  } catch (e) {
    console.error("[SettingGet] Error:", e.message);
    return null;
  }
}

async function redisSet(key, value) {
  try {
    await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
    return "OK";
  } catch (e) {
    console.error("[SettingSet] Error:", e.message);
    return null;
  }
}

module.exports = { redisCmd, redisGet, redisSet };
