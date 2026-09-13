// ============================================================
// Probe API Cổng góp ý 1022 (gopy.danang.gov.vn) — read-only.
//
//   node scripts/probe-cgy1022.js          → GET danh sách phản ánh (KHÔNG ghi gì)
//
// Xác thực: HTTP Basic Auth + User-Agent trình duyệt (đã cấu hình trong service).
// ⚠️ KHÔNG có chế độ gửi thử: gopy.danang.gov.vn là hệ CHÍNH THỨC —
//    tuyệt đối không POST dữ liệu test lên. Việc gửi thật do luồng phản ánh
//    của người dân thực hiện.
// Yêu cầu .env: CGY1022_BASE_URL, CGY1022_USERNAME, CGY1022_PASSWORD
// ============================================================
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const cgy = require("../src/services/cgy1022Service");
const config = require("../src/config");

(async () => {
  if (!cgy.isConfigured()) {
    console.error("❌ Thiếu CGY1022_BASE_URL / USERNAME / PASSWORD trong Backend/.env");
    process.exit(1);
  }
  console.log("BASE_URL:", config.cgy1022.baseUrl + config.cgy1022.gopyPath);

  try {
    const data = await cgy.listFeedbacks({ page: 1, size: 3 });
    const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    console.log(`✅ Kết nối OK — nhận ${items.length} phản ánh gần nhất:`);
    items.forEach((it, i) => {
      console.log(`\n  ${i + 1}. [${it.tinhTrangXuLy || "?"}] ${it.tieuDe || ""}`);
      console.log(
        `     Lĩnh vực: ${it.tenChuDe || "?"} | Cơ quan: ${it.tenCoQuan || "?"} | ${
          it.ngayDienRa || ""
        }`
      );
    });
    console.log("\nℹ️  Đây là dữ liệu THẬT trên hệ thống thành phố (read-only). Không ghi gì lên.");
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
    process.exit(1);
  }
})();
