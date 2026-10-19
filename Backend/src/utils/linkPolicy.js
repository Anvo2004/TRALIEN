const config = require("../config");

// Chính sách kiểm duyệt Zalo Mini App (mục 4.1 "Điều hướng liên kết trang thứ 3"):
// Mini App của Cơ quan Nhà nước chỉ được mở liên kết tới tên miền .gov.vn, hoặc tên
// miền có chủ thể đăng ký là CQNN (kể cả báo đài địa phương). Bản phát hành đầu tiên
// đã bị TỪ CHỐI vì "DaNang AI" (danangai.1022.vn) và "Cổng dữ liệu" (congdulieu.vn).
// Tên miền CQNN không đuôi .gov.vn → thêm vào ALLOWED_LINK_DOMAINS (đã xác minh chủ thể).
function extraDomains() {
  return String(config.allowedLinkDomains || "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^\.+/, ""))
    .filter(Boolean);
}

function isAllowedExternalUrl(url) {
  let host;
  try {
    const u = new URL(String(url));
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    host = u.hostname.toLowerCase();
  } catch {
    return false;
  }
  if (host === "gov.vn" || host.endsWith(".gov.vn")) return true;
  // Tích hợp DaNang AI theo yêu cầu của xã, cùng đích đến với Mini App Nông Sơn.
  if (host === "danangai.1022.vn") return true;
  return extraDomains().some((d) => host === d || host.endsWith(`.${d}`));
}

module.exports = { isAllowedExternalUrl };
