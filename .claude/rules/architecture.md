# Kiến trúc hệ thống

```
Công dân (Zalo Mini App)  ──┐
                             ├── HTTPS/JSON ──▶ Backend API (Node/Express) ──▶ MongoDB Atlas
Cán bộ xã (AdminWeb)     ──┘                              │
                                                            ├──▶ Cloudinary (ảnh phản ánh, ảnh tin)
                                                            ├──▶ Upstash Redis (rate-limit)
                                                            ├──▶ Zalo OpenAPI (OA: gửi tin, webhook)
                                                            └──▶ Tích hợp ngoài: EVN CPC (lịch cắt điện),
                                                                 Cổng góp ý 1022 + IOCTC (thành phố),
                                                                 Anthropic API (Trợ lý số)
```

## Backend (`Backend/`)

- `src/app.js` — Express app: CORS, body parsing (giữ `rawBody` để verify chữ
  ký webhook Zalo), static `/media` + `/images`, mount `/api`, error handler.
- `src/routes/` — không có tầng `controllers/` riêng, handler nằm thẳng trong
  route file. `routes/index.js` mount:
  - Public (không auth): `/api/public/*` (gọi từ Mini App), `/api/auth`,
    `/api/zalo` (webhook OA).
  - Sau `requireAuth` (JWT admin): `/api/stats`, `/api/feedbacks`,
    `/api/users`, `/api/categories`, `/api/broadcast`, `/api/tro-cap`,
    `/api/notices`, `/api/lich-cup-dien`, `/api/lich-y-te`, `/api/van-ban`,
    `/api/thon-xom`, ...
- `src/models/` — Mongoose schema, 1 file/model.
- `src/services/` — tích hợp ngoài + logic nghiệp vụ tách khỏi route
  (scraping, sync, Zalo API, AI assistant...).
- `src/middleware/auth.js` — `requireAuth` (JWT) + `requireRole(...roles)`.
- `src/utils/` — helper dùng chung (Zalo API client, Cloudinary upload,
  rate-limit, xác thực Zalo Mini App access token).

## AdminWeb (`Frontend/AdminWeb/`)

React + Vite + React Query + Tailwind (shadcn-style components trong
`src/components/ui/`). Auth: JWT lưu `localStorage`, `AuthContext` +
`ProtectedRoute`. `lib/api.js` là axios instance dùng chung, tự gắn
`Authorization: Bearer <token>`, tự logout khi 401.

## MiniApp (`MiniApp/`)

React + `zmp-sdk`/`zmp-ui`, build bằng `zmp-vite-plugin` → `www/`. Không dùng
hệ JWT admin — công dân định danh qua Zalo user id (`zmp-sdk` access token,
verify server-side bằng `requireZaloUser`, xem `src/utils/zaloMiniApp.js`
phía Backend). `src/data/api-config.js` chứa `API_BASE_URL` (không qua .env —
xem comment trong file).

## Auth 2 tầng, không dùng chung

- **AdminWeb**: JWT tự phát hành (`jsonwebtoken`, hash mật khẩu
  `bcryptjs`), role `superadmin`/`dept_leader`/`officer`/`staff`.
- **MiniApp**: không có tài khoản — danh tính = Zalo user id. Endpoint public
  ghi dữ liệu (gửi phản ánh) tin tưởng `userId` client gửi lên; endpoint đọc
  dữ liệu riêng tư (vd. "phản ánh của tôi") bắt buộc verify qua access token
  thật (`requireZaloUser`), KHÔNG lấy `userId` từ query/body.
