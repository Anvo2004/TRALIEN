# Checklist chuẩn bị trước khi chạy thật (Trà Liên)

Dự án được dựng từ MINIAPP_THANGDIEN với credentials/URL đặc thù Thăng Điền đã
gỡ bỏ, thay bằng placeholder. Các mục dưới đây cần điền/quyết định trước khi
Backend chạy đầy đủ tính năng và lên production. Đánh dấu `[x]` khi xong.

## 1. Xác nhận thông tin cơ bản

- [ ] Tỉnh/thành, quận/huyện thực tế của xã Trà Liên (đang tạm để
      `"Thành phố Đà Nẵng"` trong `MiniApp/src/data/site.js` — xác nhận lại).
- [ ] Domain production: Backend (`https://tralienapi.dxvtech.vn` — placeholder
      trong `Backend/src/config/index.js`, `MiniApp/src/data/api-config.js`,
      `.github/workflows/sync-lich-cup-dien.yml`) và MiniApp/AdminWeb
      (`https://tralien.dxvtech.vn` — placeholder trong `MiniApp/vite.config.js`).
- [ ] VPS đích: dùng chung VPS với dự án khác (như Thăng Điền dùng chung với
      Đại Lộc) hay VPS riêng? Ảnh hưởng `/var/www/tralien` trong
      `.github/workflows/deploy.yml` và `pm2` process name `tralien`/`tralien-backend`.
- [ ] Logo, banner xã Trà Liên thật — hiện đang là ảnh placeholder 1×1 tại:
      `MiniApp/src/static/logo-tralien.png`, `banner-cong-so.jpg`, `banner-danang.jpg`,
      `Frontend/AdminWeb/src/images/logotralien.jpg`.

## 2. Hạ tầng dữ liệu

- [x] MongoDB Atlas: đã tạo cluster + database `tralien`, đã điền `MONGO_URI`
      trong `Backend/.env` và test kết nối OK (2026-09-11).
      **Cần làm sau:** đổi lại mật khẩu user này (đã bị dán vào chat) + sửa
      Network Access từ `0.0.0.0/0` thành chỉ IP của VPS + IP admin.
- [ ] Cloudinary (**tuỳ chọn**): nếu để trống `CLOUDINARY_*`, ảnh phản ánh +
      ảnh tin tức tự động lưu vào `Backend/public/images/` trên VPS và phục vụ
      qua `/images` (xem `Backend/src/utils/cloudinary.js`) — không cần tài
      khoản ngoài. Đánh đổi: không có CDN/resize ảnh, dung lượng ảnh tính vào
      đĩa VPS (cần backup định kỳ nếu quan trọng). Điền `CLOUDINARY_*` chỉ khi
      muốn dùng CDN/resize thật.
- [ ] Upstash Redis (**tuỳ chọn**): nếu để trống `UPSTASH_REDIS_REST_URL/TOKEN`,
      rate-limit tự động dùng bộ đếm trong RAM của Backend (xem
      `Backend/src/utils/rateLimit.js`) — đủ dùng khi Backend chạy 1 tiến
      trình PM2 (`fork` mode, đúng hiện trạng dự kiến trên VPS). Chỉ cần
      Upstash thật nếu sau này chạy nhiều tiến trình/instance Backend.

## 3. Zalo

- [ ] **Mini App**: đã tạo — App ID `311948135429512948` ("Mini App Xã Trà
      Liên", trạng thái Dev). Lấy thêm gì cần thiết từ Mini App Console (vd.
      domain xác minh) khi build production.
- [ ] **Zalo OA (Official Account)** — KHÁC Mini App, cần đăng ký/liên kết
      riêng: `ZALO_APP_ID`, `ZALO_APP_SECRET`, `ZALO_OA_TOKEN`,
      `ZALO_REFRESH_TOKEN`, `ZALO_OA_SECRET_KEY` (khoá xác thực chữ ký webhook,
      lấy tại oa.zalo.me → Cài đặt → Bảo mật) trong `Backend/.env`.
- [ ] Thẻ xác minh site `zalo-platform-site-verification` trong
      `Backend/src/app.js` — hiện đã bị xoá theo domain cũ, cần thẻ mới của
      domain Trà Liên khi đăng ký miền cho OA/Mini App.

## 4. Tích hợp thành phố (quyết định dùng chung hay tài khoản riêng)

- [ ] **Cổng góp ý 1022** (`gopy.danang.gov.vn`) — đồng bộ phản ánh sang hệ
      thống thành phố. Thăng Điền dùng chung tài khoản với Đại Lộc; Trà Liên
      dùng tài khoản riêng hay dùng chung với xã khác? Điền
      `CGY1022_BASE_URL/USERNAME/PASSWORD` trong `Backend/.env`. Để trống thì
      tính năng tự tắt (không đồng bộ, không mã theo dõi phản ánh).
      Sau khi có tài khoản, chạy `node scripts/cgy1022-map-categories.js` để
      map `CGY1022_LINHVUC_MAP`.
- [ ] **IOCTC** (`tctthc.1022.vn`, tra cứu hồ sơ TTHC) — tương tự, quyết định
      tài khoản riêng/chung, điền `IOCTC_USERNAME/PASSWORD`.
- [ ] **EVN CPC** (lịch cắt điện) — tra mã đơn vị điện lực phụ trách khu vực
      Trà Liên (Thăng Điền dùng `orgCode=PP`, `subOrgCode=PC05FF` — Điện lực
      Thăng Bình, KHÔNG áp dụng cho Trà Liên). Điền `EVNCPC_ORG_CODE`,
      `EVNCPC_SUBORG_CODE` trong `Backend/.env`, và `XENVN_URL` (nguồn thay thế
      cào từ xenvn.com — URL mẫu Thăng Điền trong comment của
      `Backend/.env.example`). Cũng cần sửa 2 dòng `ORG_CODE`/`SUBORG_CODE`
      placeholder trong `.github/workflows/sync-lich-cup-dien.yml` nếu dùng nút
      chạy tay khẩn cấp.
- [ ] **Trang TTĐT xã Trà Liên** (tin tức + văn bản-chính sách) — chưa xác
      nhận URL. Điền `NEWS_SOURCE_URL` và `VAN_BAN_SOURCE_URL` trong
      `Backend/.env`; nếu Trà Liên dùng cùng CMS với thangdien.danang.gov.vn
      thì regex parse có sẵn (`newsScrapeService.js`,
      `vanBanTraLienService.js`, `MiniApp/scripts/scrape-tralien.js`) nhiều
      khả năng chạy được ngay, khác CMS thì cần sửa lại `blockRe`/`itemRe`.

## 5. AI & tiện ích khác

- [ ] Anthropic API key cho Trợ lý số (`ANTHROPIC_API_KEY` trong
      `Backend/.env`, lấy tại console.anthropic.com). Để trống thì mục "Trợ lý
      số"/chatbot tự tắt (503).
- [ ] 4 link "Nhóm liên kết dịch vụ" còn thiếu URL thật trong
      `MiniApp/src/data/quick-links.js` (đánh dấu `TODO_LINK_...`): hẹn giờ
      Cổng Dịch vụ công, đăng ký hộ kinh doanh, đăng ký hộ khẩu, bảng giá đất.
      Link "UBND xã" trong `MiniApp/src/data/services.js`
      (`TODO_LINK_TRANG_TTDT_XA`) dùng chung URL với mục 4.

## 6. Seed dữ liệu ban đầu

- [ ] Sau khi có `MONGO_URI` thật: chạy `node Backend/scripts/seed.js` để tạo
      tài khoản superadmin đầu tiên (`admin` / `Admin@123` — **đổi mật khẩu
      ngay sau khi đăng nhập lần đầu**) + danh mục phản ánh mặc định.
- [ ] `node Backend/scripts/seed-site-content.js` nếu cần seed nội dung site
      (thông tin liên hệ, giới thiệu...).
