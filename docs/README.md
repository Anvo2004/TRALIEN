# Tài liệu dự án — Trà Liên Số

Mini App Zalo "Trà Liên Số": đăng tin/cảnh báo qua OA Zalo, tiếp
nhận & đồng bộ phản ánh-góp ý lên Cổng góp ý thành phố, chatbot hướng dẫn thủ
tục hành chính/FAQ, tra cứu tiện ích an sinh xã hội (lịch cắt điện, lịch y tế,
văn bản - chính sách, hồ sơ TTHC...), cùng AdminWeb cho cán bộ xã xử lý phản
ánh và quản trị nội dung.

Dự án được dựng lại từ MINIAPP_THANGDIEN (cùng kiến trúc: `Backend/` API
Node/Express + MongoDB, `Frontend/AdminWeb/` React admin, `MiniApp/` Zalo Mini
App) — xem [`../CLAUDE.md`](../CLAUDE.md) để biết tổng quan kỹ thuật và quy
ước, và [`SETUP_CHECKLIST.md`](./SETUP_CHECKLIST.md) cho danh sách việc cần
chuẩn bị trước khi lên production (tài khoản MongoDB, Zalo OA, Cloudinary...).

## Đổi icon trên MiniApp

Icon của lưới "Tiện ích nhanh" (Trang chủ) và trang "Dịch vụ" lưu trong
MongoDB (`AppLink.iconUrl`), đổi qua AdminWeb → **Icon & liên kết MiniApp**:
mỗi mục có nút chọn ảnh từ thư viện hoặc tải ảnh PNG/WEBP mới (tối đa 1MB,
nền trong suốt). Đổi xong có hiệu lực ngay, **không cần build lại MiniApp**.

Bộ icon khởi tạo nạp bằng `node Backend/scripts/seed-app-icons.js --apply-links`
(chạy trên VPS, nơi có kết nối MongoDB thật; thêm `--dry-run` để xem trước).

Ba chỗ icon nằm trong bundle nên **phải build lại MiniApp** khi đổi: thanh tab
dưới cùng, màn "Phòng chống thiên tai" và nhóm trợ cấp — xem
[`../MiniApp/src/static/icons/README.md`](../MiniApp/src/static/icons/README.md),
trong đó có cả điều kiện giấy phép của nguồn icon đang dùng (Icons8).

Thư mục này còn trống tài liệu vận hành thực tế (báo cáo triển khai, hướng dẫn
sử dụng cho dân/cán bộ, infographic...) — bổ sung dần khi dự án triển khai
thật, theo mẫu của MINIAPP_THANGDIEN/docs/.
