# Secrets & cấu hình

- Không bao giờ commit `.env` thật (mọi `Backend/.env`, `MiniApp/.env`,
  `Frontend/AdminWeb/.env` đều trong `.gitignore`). Chỉ `.env.example` được
  commit, luôn để giá trị rỗng hoặc placeholder — không paste key thật vào
  `.env.example` "cho tiện", kể cả tạm thời.
- Thêm biến môi trường mới: thêm cả vào `.env.example` (kèm comment giải
  thích lấy ở đâu/dùng để làm gì) **và** vào `Backend/src/config/index.js`
  với fallback an toàn (`""` hoặc giá trị vô hại) — không đọc thẳng
  `process.env.X` rải rác trong route/service.
- Tích hợp ngoài optional (Cloudinary, Upstash, Zalo OA, CGY1022, IOCTC,
  Anthropic, nguồn cào tin/văn bản...) phải tự tắt gracefully khi thiếu config
  — trả lỗi rõ ràng (503 hoặc bỏ qua + log) thay vì crash hoặc gọi ra ngoài
  với giá trị rỗng/sai. Xem `isConfigured()` trong `assistantService.js`,
  `hoSoService.js`, hoặc guard đầu hàm trong `newsScrapeService.js`/
  `vanBanTraLienService.js` làm mẫu.
- URL/mã đặc thù theo xã (cổng thông tin điện tử, mã điện lực EVN CPC, tài
  khoản CGY1022/IOCTC) không có giá trị mặc định hợp lệ dùng chung — để rỗng
  kèm comment TODO trỏ tới `docs/SETUP_CHECKLIST.md`, không tự đoán.
