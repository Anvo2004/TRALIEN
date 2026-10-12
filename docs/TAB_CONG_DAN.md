# Tab Công dân & Tích điểm

Port từ MINIAPP_NONGSON (bản thân dự án đó port từ Thắng Phú; thể lệ mặc định
theo Đại Lộc). Phần logic/API giữ nguyên, riêng giao diện MiniApp dựng lại theo
bộ thiết kế Trà Liên (`css/app.scss`, `.listcard`/`.prow`/`.tile`) thay vì bộ
`components/ns/*` của Nông Sơn.

## Chức năng (giai đoạn 1)

| Chức năng | Cách hoạt động |
|---|---|
| Hồ sơ | Mở tab Công dân: lấy tên/ảnh Zalo, tự đăng ký lần đầu (+5 điểm), sinh mã giới thiệu 6 ký tự |
| Số điện thoại | `getPhoneNumber()` → Backend đổi token qua `graph.zalo.me/v2.0/me/info`; hỏi một lần, "Số điện thoại" trong menu để hỏi lại. Cần quyền trong Zalo Mini App Console |
| Chọn thôn | Danh sách lấy từ `/api/public/thon-xom` (cán bộ nhập ở AdminWeb) |
| Quan tâm OA | `followOA`/`unfollowOA` với `ZALO_OA_ID`; trống thì ẩn hàng này |
| Chia sẻ | `openShareSheet` kiểu `zmp_deep_link`, đường dẫn `/?ref=MÃ`; người mở link được áp mã khi đăng ký lần đầu |
| Nhập mã giới thiệu | Mỗi người một lần, không tự nhập mã mình; người mời +2, người nhập +2 |
| Ghim ứng dụng | `createShortcut()` (iOS hiện hướng dẫn, Android tạo shortcut) |
| Tích điểm | Sổ cái `PointTransaction`; điểm = tổng sổ cái; hạng tính theo ngưỡng |

## Điểm và hạng (sửa ở AdminWeb → Công dân & Tích điểm)

Đăng ký +5 · Giới thiệu +2 · Khảo sát +5 · Phản ánh +2 (khi được phản hồi) ·
Check-in sự kiện +5 · Thi trực tuyến +5.
Hạng: Công dân từ 5 · **Hội viên từ 20** · Công dân số từ 50.

Phản ánh được cộng điểm **một lần** khi lãnh đạo duyệt trả lời
(`routes/feedbacks.js`) hoặc khi 1022 trả kết quả (`cgy1022StatusService.js`) —
khoá duy nhất `(zaloUserId, type, refId)` trong `PointTransaction` chống cộng
trùng khi một phản ánh đi qua cả hai luồng.

## API

- Công khai: `GET /api/public/citizen/program` (thể lệ + `oaId`).
- Cần access token Zalo (`x-zalo-access-token`, verify bằng `requireZaloUser`):
  `POST /me`, `PUT /me/profile`, `POST /me/phone`, `POST /me/referral`,
  `GET /me/transactions`. Giới hạn 120 lượt/giờ mỗi người.
- AdminWeb (JWT): `GET /api/citizens`, `/stats`, `/program`, `/:zaloUserId`;
  `PUT /program` và `POST /:id/adjust` chỉ `superadmin`.

## Điểm chạm trong code

- Backend: `models/Citizen.js`, `models/PointTransaction.js`,
  `services/citizenRules.js` (thuần logic, không đụng DB),
  `services/citizenService.js`, `routes/publicCitizen.js`, `routes/citizens.js`.
- AdminWeb: `pages/CongDanPage.jsx` + route `/cong-dan` + mục nav trong `Sidebar.jsx`.
- MiniApp: `data/citizen.js`, `pages/cong-dan.jsx`, `pages/tich-diem.jsx`,
  tab thứ 4 trong `components/layout.jsx`, `captureReferral()` gọi ở `app.jsx`.

## Cấu hình riêng Trà Liên

- `ZALO_OA_ID` trong `Backend/.env` — **chưa điền**; trống thì ẩn hàng "Quan tâm
  Zalo OA", phần còn lại vẫn chạy.
- SĐT tự động cần bật quyền "Số điện thoại" trong Zalo Mini App Console →
  Quản lý quyền, cùng với `ZALO_APP_SECRET` đã có.
- Thumbnail khi chia sẻ dùng `${API_BASE_URL}/brand/logo-tralien.png`
  (`Backend/public/brand/`, phục vụ qua `express.static` trong `app.js`).

## Giai đoạn 2 (chưa làm)

Khảo sát, check-in sự kiện, thi trực tuyến: mỗi cái cần module riêng; sổ cái đã
có sẵn kiểu giao dịch `survey`, `event`, `exam` nên chỉ cần gọi
`citizenService.award()` khi làm tới.
