# Checklist chuẩn bị trước khi chạy thật (Trà Liên)

Dự án được dựng từ MINIAPP_THANGDIEN với credentials/URL đặc thù Thăng Điền đã
gỡ bỏ, thay bằng placeholder. Các mục dưới đây cần điền/quyết định trước khi
Backend chạy đầy đủ tính năng và lên production. Đánh dấu `[x]` khi xong.

## 1. Xác nhận thông tin cơ bản

- [ ] Tỉnh/thành, quận/huyện thực tế của xã Trà Liên (đang tạm để
      `"Thành phố Đà Nẵng"` trong `MiniApp/src/data/site.js` — xác nhận lại).
- [x] Domain production: `tralien.dxvtech.vn` (MiniApp web mirror),
      `tralienapi.dxvtech.vn` (Backend), `tralienadmin.dxvtech.vn` (AdminWeb) —
      DNS đã trỏ về VPS, SSL Let's Encrypt đã cấp cho cả 3 (2026-09-11, hết hạn
      2026-12-10, tự gia hạn).
- [x] VPS đích: dùng chung VPS với 12 dự án xã khác (như Thăng Điền dùng chung
      với Đại Lộc) — `123.30.48.104`. Đã tạo `/var/www/tralien` (owner
      `deploy`), PM2 `tralien` (cổng 3013) + `tralien-backend` (cổng 4000),
      Nginx 3 site đã cấu hình (2026-09-11).
- [x] Logo MiniApp thật — đã cắt tròn từ banner chính thức của xã
      (`MiniApp/src/images/tralien2.png`, ảnh gốc `TRANG THÔNG TIN ĐIỆN TỬ XÃ
      TRÀ LIÊN`), thay placeholder 1×1 tại `MiniApp/src/static/logo-tralien.png`
      (2026-09-13). Đã thêm `MiniApp/src/static/banner-tralien-portal.jpg`
      (đoạn banner bên phải logo, cùng nguồn) hiển thị trong hero Trang chủ.
- [ ] `banner-cong-so.jpg`, `banner-danang.jpg` (component `Banner`, hiện
      không hiển thị ở Trang chủ sau redesign) và
      `Frontend/AdminWeb/src/images/logotralien.jpg` vẫn là ảnh placeholder.

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

- [x] **Mini App**: đã tạo — App ID `3119481354295122948` ("Mini App Xã Trà
      Liên", trạng thái Dev), đã điền đúng vào `MiniApp/zmp-cli.json` (giá trị
      cũ bị thiếu 1 chữ số nên extension VSCode báo lỗi "Liên kết Mini App ID"
      — đã sửa 2026-09-12). Lấy thêm gì cần thiết từ Mini App Console (vd.
      domain xác minh) khi build production.
- [x] **Zalo OA (Official Account)**: đã điền `ZALO_APP_ID/APP_SECRET/OA_TOKEN/
      REFRESH_TOKEN` vào `Backend/.env` (local + VPS) và test kết nối thật
      OK — `POST /api/broadcast/followers/sync` đồng bộ được danh sách
      follower thật của OA Trà Liên (2026-09-13). `requireZaloUser` (chặn
      "Phản ánh của tôi") cũng đã chuyển từ tự tắt (503) sang xác thực thật
      (401 khi token sai) — xác nhận hoạt động đúng.
      **Chưa có**: `ZALO_OA_SECRET_KEY` (khoá xác thực chữ ký webhook, lấy tại
      oa.zalo.me → Cài đặt → Bảo mật — không bắt buộc, thiếu thì webhook vẫn
      nhận bình thường, chỉ bỏ qua bước xác thực chữ ký).
- [ ] Thẻ xác minh site `zalo-platform-site-verification` trong
      `Backend/src/app.js` — hiện đã bị xoá theo domain cũ, cần thẻ mới của
      domain Trà Liên khi đăng ký miền cho OA/Mini App.

## 4. Tích hợp thành phố (quyết định dùng chung hay tài khoản riêng)

- [x] **Cổng góp ý 1022** (`gopy.danang.gov.vn`): đã điền
      `CGY1022_BASE_URL/USERNAME/PASSWORD` (local + VPS), test kết nối thật
      OK từ cả 2 nơi — `node scripts/probe-cgy1022.js` đọc được dữ liệu thật
      (2026-09-15). Tài khoản `appdnsmartcity` — **có vẻ là tài khoản dùng
      chung toàn thành phố** (probe thấy cả dữ liệu phường Hội An), không
      phải tài khoản riêng của Trà Liên — nên xác nhận lại với đơn vị cấp có
      đúng ý định dùng chung không. Đã chạy `cgy1022-map-categories.js` và
      điền `CGY1022_LINHVUC_MAP` (6 danh mục — 2 mục "Y tế - Sức khỏe",
      "Giáo dục" tạm map về 22 "Lĩnh vực khác" vì script đoán theo từ khoá
      không khớp, nên rà lại thủ công qua `GET /public/gopy/chude` nếu cần
      chính xác hơn). **Chưa test đẩy 1 phản ánh thật lên 1022** (cố tình —
      đây là hệ thống chính quyền thật, không tự ý POST dữ liệu test, xem
      cảnh báo trong `probe-cgy1022.js`) — sẽ xác nhận qua phản ánh thật đầu
      tiên của dân, hoặc xã chủ động gửi 1 phản ánh thật để kiểm tra.
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
- [x] **Trang TTĐT xã Trà Liên — Tin tức**: đã xác nhận URL
      `https://tralien.danang.gov.vn` (2026-09-14). Trang này dùng portal
      VNPT (theme "qnm-ubnd", hạ tầng cũ Quảng Nam) — **KHÁC HẲN** CMS
      "CMS14" của Thăng Điền, nên đã **viết lại toàn bộ** `newsScrapeService.js`
      (Cheerio, khớp đúng cấu trúc `div.ArticleCat`/`ul.ArticleOfCat` của
      trang thật) thay vì dùng regex cũ. Đã điền `NEWS_SOURCE_URL=
      https://tralien.danang.gov.vn/tin-tuc` và chạy sync thật — 304 tin thật
      đã vào DB, ảnh nhúng thẳng từ nguồn (không cần re-host Cloudinary, ảnh
      nguồn khai đúng Content-Type).
- [ ] **Trang TTĐT xã Trà Liên — Văn bản**: `vanBanTraLienService.js` vẫn viết
      cho pattern DotNetNuke/Telerik RadGrid (`tr.rgRow`) của CMS Thăng Điền —
      **chưa kiểm chứng/viết lại** cho portal VNPT của Trà Liên (ngoài phạm vi
      lần sửa 2026-09-14, chỉ mới làm Tin tức/Văn hóa/Du lịch). Menu "Văn Bản"
      thật có các mục `/van-ban-dang-uy`, `/van-ban-hdnd`, `/van-ban-ubnd` —
      cần đọc cấu trúc HTML thật trước khi viết lại, như đã làm với Tin tức.
- [x] **Văn hóa & Du lịch**: nội dung mẫu Thăng Điền (chợ/đình làng/lễ hội
      miền biển) đã bị xoá (không áp dụng cho Trà Liên — xã miền núi, đồng
      bào Cor >49% dân số). Đã thay bằng nội dung thật đọc từ chuyên mục
      "Y Tế - Văn Hóa - Xã Hội - KHCN" của trang TTĐT (2026-09-14): cồng
      chiêng, nghề đan lát Tăk Kót, lễ hội Sắc Xuân Làng Co, di tích/di sản
      "Không gian văn hóa đồng bào Co", điểm du lịch Dội Bà Bình — xem
      `Backend/scripts/seed-site-content.js` (`DU_LICH`/`VAN_HOA`, có kèm
      `link` bài gốc để đối chiếu).
- [ ] **Thôn xóm**: `Village` collection đang để **trống** — 12 thôn mẫu của
      Thăng Điền đã xoá vì sai xã, nhưng chưa có danh sách thôn thật của Trà
      Liên kèm tên bí thư/thôn trưởng/mặt trận để seed lại (mới biết tên 1 số
      thôn qua tin tức: Tăk Kót, Tăk Ngưi, Tăk Nú, Làng Gạch, Phương Đông,
      Định Yên, Ba Hương — chưa đủ dữ liệu lãnh đạo thôn).
- [x] **Địa chỉ trụ sở UBND**: phát hiện lệch giữa thẻ thông tin Google
      ("Thôn Định Yên... Trụ sở Xã Trà Đông cũ") và trang "Giới thiệu chung"
      chính thức ("Thôn Phương Đông") — đã ưu tiên dùng nguồn chính thức
      (2026-09-14). Đã thêm email thật `ubndxatralien@danang.gov.vn` (thay
      `TODO`) và thông tin Chủ tịch UBND (Nguyễn Hồng Vương) vào
      `SiteInfo.contact` — **chưa có UI hiển thị** tên chủ tịch ở MiniApp,
      chỉ mới lưu dữ liệu.

## 5. AI & tiện ích khác

- [ ] Anthropic API key cho Trợ lý số (`ANTHROPIC_API_KEY` trong
      `Backend/.env`, lấy tại console.anthropic.com). Để trống thì mục "Trợ lý
      số"/chatbot tự tắt (503).
- [x] Đã điền link thật cho các mục "Tiện ích nhanh" trong
      `MiniApp/src/data/quick-links.js` (2026-09-14): Khảo sát hài lòng, Cổng
      dữ liệu (`congdulieu.vn`), thêm mới "DaNang AI". Bỏ hẳn 4 icon "Hẹn giờ
      DVC"/"Đăng ký hộ KD"/"Đăng ký hộ khẩu"/"Bảng giá đất" theo yêu cầu xã
      (không dùng nữa, không phải thiếu link).
      Link "UBND xã" trong `MiniApp/src/data/services.js`
      (`TODO_LINK_TRANG_TTDT_XA`) dùng chung URL với mục 4.

## 6. Seed dữ liệu ban đầu

- [x] `node Backend/scripts/seed.js` đã chạy (2026-09-11) — tài khoản
      superadmin `admin` / `Admin@123` (**đổi mật khẩu ngay** — đăng nhập tại
      https://tralienadmin.dxvtech.vn) + 6 danh mục phản ánh mặc định.
- [ ] `node Backend/scripts/seed-site-content.js` nếu cần seed nội dung site
      (thông tin liên hệ, giới thiệu...).

## 7. CI/CD

- [x] `.github/workflows/deploy.yml` đã cấu hình đủ secret (`VPS_HOST`,
      `VPS_DEPLOY_SSH_KEY` — SSH key riêng cho user `deploy`, không dùng mật
      khẩu root) — mỗi lần `git push` lên `main` tự động `git pull` + build +
      `pm2 restart` trên VPS (2026-09-11).
