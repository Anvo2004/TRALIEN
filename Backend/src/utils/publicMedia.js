const path = require("path");
const config = require("../config");

// ============================================================
// Thư mục + URL công khai cho file do Backend tự sinh để Zalo tải về (ảnh từng
// trang PDF — pdfPages.js, ảnh tin đã thu nhỏ — imageHost.js). File nằm trong
// public/images/tin/<nhóm>/, phục vụ qua /images (xem app.js).
// Zalo tải ảnh từ Internet nên chỉ dùng được khi PUBLIC_URL là domain https
// công khai của Backend; không thì các module gọi phải tự bỏ qua.
// ============================================================

const ROOT = path.join(__dirname, "..", "..", "public", "images", "tin");

function publicBase() {
  const base = (config.publicUrl || "").replace(/\/+$/, "");
  if (!/^https:\/\//i.test(base) || /^https:\/\/(localhost|127\.|0\.0\.0\.0)/i.test(base)) return "";
  return base;
}

const dirOf = (group) => path.join(ROOT, group);
const urlOf = (group, file) => `${publicBase()}/images/tin/${group}/${file}`;

module.exports = { publicBase, dirOf, urlOf, ROOT };
