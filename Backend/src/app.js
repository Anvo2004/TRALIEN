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
    <!-- TODO: thẻ xác minh site Zalo riêng cho domain Trà Liên (Zalo OA/Mini App
         Console → Xác minh miền) — token của Thăng Điền không dùng lại được,
         gắn với domain cụ thể. Xem docs/SETUP_CHECKLIST.md. -->
    <!-- <meta name="zalo-platform-site-verification" content="TODO" /> -->
    <title>TraLien API</title>
</head>
<body>API is running</body>
</html>
`));

app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
