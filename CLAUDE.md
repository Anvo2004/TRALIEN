# MINIAPP_TRALIEN

Mini App Zalo "Công dân số xã Trà Liên" — xem [docs/README.md](docs/README.md)
cho mô tả tính năng và [docs/SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md) cho
danh sách credentials/quyết định còn thiếu trước khi chạy production.

Dự án được dựng (fork + rebrand) từ MINIAPP_THANGDIEN, một dự án cùng kiến
trúc cho xã Thăng Điền — xem [.claude/rules/branding-and-config.md](.claude/rules/branding-and-config.md)
nếu cần fork dự án này sang một xã khác lần nữa.

## Kiến trúc

3 app độc lập, dùng chung 1 MongoDB — chi tiết:
[.claude/rules/architecture.md](.claude/rules/architecture.md).

- `Backend/` — Node.js/Express + Mongoose (MongoDB), cổng 4000.
- `Frontend/AdminWeb/` — React + Vite, dashboard cho cán bộ xã.
- `MiniApp/` — Zalo Mini App (React + `zmp-sdk`/`zmp-ui`, build bằng `zmp-vite-plugin`).

## Chạy local

Mỗi app có `.env` riêng (đã tạo từ `.env.example` với placeholder — điền giá
trị thật theo `docs/SETUP_CHECKLIST.md` trước khi test tính năng cần DB/API
ngoài).

```
cd Backend && npm install && npm run dev        # http://localhost:4000
cd Frontend/AdminWeb && npm install && npm run dev
cd MiniApp && npm install && npm run start       # Zalo Mini App dev server
```

Hoặc `docker-compose up` từ root (build cả 3 image, không có container DB —
Mongo là Atlas ngoài).

## Quy ước thêm 1 module "tra cứu" mới

Các mục tra cứu (lịch cắt điện, trợ cấp, lịch y tế...) đều theo cùng 1 pattern
5 lớp — xem ví dụ đầy đủ ở "Lịch y tế": `Backend/src/models/LichYTe.js`,
`Backend/src/routes/lichYTe.js` (CRUD admin), khối `/lich-y-te` trong
`Backend/src/routes/publicLookup.js` (đọc public, tra theo tháng/năm),
`Frontend/AdminWeb/src/pages/LichYTePage.jsx` + mục nav trong `Sidebar.jsx`,
`MiniApp/src/pages/lich-y-te.jsx` + route trong `MiniApp/src/app.jsx` + icon
trong `MiniApp/src/data/quick-links.js`. Thêm module mới thì copy đúng 5 điểm
chạm này.

## Quy ước khác

- Tích hợp ngoài (Cloudinary, Upstash, Zalo OA, CGY1022, IOCTC, Anthropic...)
  luôn tự tắt gracefully khi thiếu config (`isConfigured()` hoặc guard đầu
  hàm) thay vì throw — xem `Backend/src/services/assistantService.js`,
  `Backend/src/services/hoSoService.js` làm ví dụ. Theo đúng pattern này khi
  thêm tích hợp mới.
- Không hardcode domain/URL của bên thứ ba (cổng thông tin xã, mã điện lực...)
  — luôn qua `Backend/src/config/index.js` với fallback rỗng `""`, không đoán
  giá trị. Xem [.claude/rules/secrets.md](.claude/rules/secrets.md).
- MiniApp dùng `memoryRouter` (không phải browser URL router) — lý do giải
  thích trong comment ở `MiniApp/src/app.jsx`.
- **`Frontend/AdminWeb/.env` (`VITE_API_URL`) được Vite build vào bundle tĩnh
  lúc `npm run build`, không đọc lại lúc chạy.** Trên VPS, file này PHẢI là
  domain API thật (`https://tralienapi.dxvtech.vn`), KHÔNG phải
  `http://localhost:4000` (giá trị đúng cho dev local nhưng sai khi build
  production — gây lỗi "Đăng nhập thất bại" vì trình duyệt người dùng gọi
  `localhost` của chính máy họ, không phải server). Đổi `.env` xong phải
  `npm run build` lại thì mới có hiệu lực (Nginx serve tĩnh, không có gì để
  restart).
- **Không bao giờ SFTP/ghi trực tiếp 1 file CODE lên `/var/www/tralien` trên
  VPS trước khi commit nó vào git** (chỉ `.env` — vốn gitignore, không git
  quản lý — mới an toàn để ghi thẳng). Nếu file đó sau này được commit + push,
  `git pull` trên VPS sẽ báo lỗi *"untracked working tree files would be
  overwritten by merge"* và **toàn bộ job deploy CI/CD fail** (đã gặp thật
  2026-09-15, `.github/workflows/deploy.yml` dùng `set -e` nên 1 bước fail là
  dừng hết, MiniApp/Backend/AdminWeb đều không được build/restart dù GitHub
  Actions báo "failure" rõ ràng — cần đọc đúng `conclusion`, không chỉ
  `status: completed`, khi kiểm tra kết quả run). Cách sửa khi đã lỡ dính:
  SSH vào, xoá các file untracked trùng tên trên VPS, `git pull` lại, rồi tự
  chạy lại đúng trình tự trong `deploy.yml`.
