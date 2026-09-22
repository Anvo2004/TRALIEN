require("express-async-errors");
const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const routes = require("./routes");

const app = express();

app.use(cors({ origin: config.corsOrigin }));
// Giữ lại rawBody để zaloWebhook.js xác thực chữ ký X-ZEvent-Signature
// (công thức ký tính trên body gốc dạng chuỗi, không phải object đã parse).
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Video Kỹ năng PCTT — file tĩnh nặng, nằm ngoài git (xem config.mediaDir),
// phục vụ qua express.static để có sẵn hỗ trợ Range request (tua/seek video).
app.use("/media", express.static(config.mediaDir));

// Ảnh/video tải lên để gửi qua Zalo OA (route broadcast lưu vào public/images).
// express.static hỗ trợ Range request nên video mp4 phát/tua được khi mở link.
app.use("/images", express.static(path.join(__dirname, "..", "public", "images")));

app.get("/health", (req, res) => res.json({ error: 0, message: "ok" }));
app.post("/health", (req, res) => res.json({ error: 0, message: "ok" }));
app.get("/", (req, res) => res.send(`
<!DOCTYPE html>
<html>
<head>
    <!-- Xác thực quyền sở hữu domain tralienapi.dxvtech.vn cho app OA "Công dân
         số xã Trà Liên" (2026-09-22) — bắt buộc để redirect_uri hoạt động khi
         cấp lại access_token/refresh_token qua oauth.zaloapp.com/v4/oa/permission.
         Không xoá/đổi content, Zalo dò lại thẻ này định kỳ để giữ trạng thái
         "đã xác thực". -->
    <meta name="zalo-platform-site-verification" content="SjoHSRRr7cX3m9zsWEyuRWlkgdJdc70ZC3Sv" />
    <title>TraLien API</title>
</head>
<body>API is running</body>
</html>
`));

// Trang Điều khoản sử dụng & Chính sách quyền riêng tư — Zalo Mini App
// Console (Xét duyệt phiên bản → Bước 2) bắt buộc phải có 1 URL công khai
// mô tả dữ liệu/quyền mà Mini App sử dụng trước khi duyệt bản phát hành.
// Nội dung lấy từ SiteInfo thật (không bịa số liệu/cam kết thời hạn cụ thể
// ngoài mức chung chung, hợp lý). Sửa nội dung ở đây khi UBND xã có yêu cầu
// khác — trang tĩnh, không qua DB vì đây là văn bản pháp lý cần rà soát tay.
app.get("/dieu-khoan-su-dung", (req, res) => res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Điều khoản sử dụng &amp; Chính sách quyền riêng tư — Trà Liên Số</title>
  <style>
    body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px 20px 60px; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .updated { color: #666; font-size: 13px; margin-bottom: 28px; }
    h2 { font-size: 17px; margin-top: 32px; color: #0d47a1; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; }
    .contact-box { background: #f4f7ff; border-radius: 12px; padding: 16px 18px; margin-top: 12px; }
    .contact-box p { margin: 4px 0; }
  </style>
</head>
<body>
  <h1>Điều khoản sử dụng &amp; Chính sách quyền riêng tư</h1>
  <p class="updated">Ứng dụng "Trà Liên Số" — Cập nhật lần cuối: 18/09/2026</p>

  <h2>1. Đơn vị vận hành</h2>
  <p>Zalo Mini App "Trà Liên Số" do <strong>UBND xã Trà Liên, Thành phố Đà Nẵng</strong> vận
  hành, phục vụ công dân tra cứu thông tin hành chính, gửi phản ánh - kiến nghị và nhận
  thông báo từ chính quyền xã.</p>

  <h2>2. Dữ liệu thu thập</h2>
  <ul>
    <li>Thông tin Zalo cơ bản (mã định danh Zalo, tên hiển thị, ảnh đại diện) khi bạn mở
      ứng dụng hoặc đăng nhập qua Zalo.</li>
    <li>Số điện thoại liên hệ — chỉ khi bạn chủ động nhập để gửi phản ánh - kiến nghị.</li>
    <li>Vị trí (GPS) — chỉ khi bạn chủ động bấm "Lấy vị trí tự động" ở form phản ánh.</li>
    <li>Hình ảnh đính kèm phản ánh (nếu có).</li>
    <li>Nội dung phản ánh, kiến nghị, mã hồ sơ bạn tự nhập để tra cứu.</li>
  </ul>

  <h2>3. Mục đích sử dụng</h2>
  <ul>
    <li>Tiếp nhận, xử lý và phản hồi phản ánh - kiến nghị của công dân đến UBND xã.</li>
    <li>Gửi thông báo, tin tức từ chính quyền xã qua Zalo OA cho người dùng đã quan tâm.</li>
    <li>Tra cứu tình trạng hồ sơ thủ tục hành chính dựa trên mã hồ sơ do người dùng cung
      cấp.</li>
  </ul>

  <h2>4. Chia sẻ dữ liệu</h2>
  <p>Chúng tôi không chia sẻ dữ liệu cá nhân của bạn cho bên thứ ba ngoài mục đích xử lý
  hành chính nêu trên, và chỉ khi cần thiết chuyển tiếp đến các hệ thống chính thức của
  Thành phố Đà Nẵng (Cổng góp ý 1022, Cổng dịch vụ công) để xử lý đúng thẩm quyền.</p>

  <h2>5. Quyền của bạn</h2>
  <p>Bạn có quyền rút lại sự đồng ý và/hoặc yêu cầu xoá dữ liệu cá nhân đã cung cấp bất kỳ
  lúc nào bằng cách liên hệ theo thông tin bên dưới. UBND xã sẽ tiếp nhận và xử lý yêu cầu
  trong thời gian sớm nhất, thông thường không quá 30 ngày làm việc.</p>

  <h2>6. Liên hệ</h2>
  <div class="contact-box">
    <p><strong>UBND xã Trà Liên</strong></p>
    <p>Địa chỉ: Thôn Phương Đông, xã Trà Liên, TP Đà Nẵng</p>
    <p>Hotline: 0987368258</p>
    <p>Email: ubndxatralien@danang.gov.vn</p>
    <p>Website: tralien.danang.gov.vn</p>
  </div>
</body>
</html>
`));

app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
