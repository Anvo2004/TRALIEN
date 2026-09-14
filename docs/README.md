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

Thư mục này còn trống tài liệu vận hành thực tế (báo cáo triển khai, hướng dẫn
sử dụng cho dân/cán bộ, infographic...) — bổ sung dần khi dự án triển khai
thật, theo mẫu của MINIAPP_THANGDIEN/docs/.
