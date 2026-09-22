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
- [x] Thẻ xác minh site `zalo-platform-site-verification` trong
      `Backend/src/app.js` — đã điền thật (2026-09-22), xác thực thành công
      domain `tralienapi.dxvtech.vn` trên Zalo Developers Console (cần thiết
      để `redirect_uri` hoạt động khi cấp lại access_token/refresh_token).
- [x] **Sự cố production 2026-09-22 — refresh_token Zalo chết, đã khắc phục**:
      phát hiện `[zaloToken] proactive refresh failed: ... -14014 Invalid
      refresh token` lặp lại liên tục trên VPS (không rõ từ khi nào — có thể
      đã âm thầm làm hỏng đăng bài/báo tin phản ánh/thông báo 1022 một thời
      gian trước khi phát hiện). Đã khắc phục bằng luồng cấp quyền lại thủ
      công: (1) xác thực domain `tralienapi.dxvtech.vn` (mục trên), (2) OA
      admin truy cập `https://oauth.zaloapp.com/v4/oa/permission?app_id=...
      &redirect_uri=https://tralienapi.dxvtech.vn/` → lấy `code` từ URL
      redirect, (3) đổi `code` lấy access_token/refresh_token mới qua
      `POST https://oauth.zaloapp.com/v4/oa/access_token`, (4) lưu vào DB
      Setting (`tralien_zalo_access_token`/`refresh_token`) + restart backend.
      **Lưu ý cho lần sau**: KHÔNG chạy script test gọi Zalo API từ máy local
      khi backend production đang chạy cùng lúc — 2 tiến trình cùng đọc
      refresh_token cũ từ DB rồi cùng thử refresh sẽ đá nhau (refresh_token
      chỉ dùng được 1 lần, Zalo xoay token mỗi lần đổi) và tự xoá sạch cache
      trong DB (`redisSet(..., "")` khi gặp lỗi -14014) — đây là nguyên nhân
      trực tiếp khiến sự cố bị phát hiện (không phải nguyên nhân gốc, token
      đã chết từ trước, nhưng test cục bộ đã dọn sạch cache DB đang hỏng sẵn).
- [x] **Tự động đăng tin lên Zalo OA (Article API)**: đã bật
      `ZALO_ARTICLE_ENABLED=true` (2026-09-15, sau khi chạy backfill đánh dấu
      skip 304 tin cũ) — tin cào mới sẽ tự tạo thành "Bài viết" trên OA (ẩn,
      chưa gửi cho ai), đúng mẫu tự động của TIENICHOAZALO_THUONGDUC. Đã test
      thật 1 bài, tạo thành công (`articleId: cace2c2c1268fb36a279`).
- [ ] **Broadcast bài viết tới người quan tâm (gửi tự động) — CODE ĐÃ XONG,
      đang tắt vì thiếu quyền/gói dịch vụ Broadcast**: đã nối
      `broadcastArticle()` vào luồng tự động trong `zaloNewsService.js`
      (`broadcastPendingArticles()` — gộp tối đa 5 bài/lượt, tự giãn cách 35
      phút/lượt qua Setting `tralien_zalo_last_broadcast_at`), bật/tắt qua
      `ZALO_BROADCAST_ENABLED` (đang **false**). Test thật 2026-09-22 (sau khi
      đã fix token) vẫn báo lỗi `-201 Params is invalid` — đã đối chiếu payload
      giống hệt code TIENICHOAZALO_THUONGDUC (đã chạy thật thành công bên đó)
      nên KHÔNG phải lỗi định dạng — xác nhận app vẫn thiếu quyền Broadcast
      thật sự. Ảnh chụp Zalo Developers Console 2026-09-22 cho thấy nhóm
      "Gửi tin nhắn" (individual/CS message) và "Article API" đều đã duyệt đủ,
      nhưng KHÔNG có dòng "Broadcast" riêng trong danh sách hiển thị — nghi
      ngờ Broadcast gắn với mục **"Mua sản phẩm dịch vụ OA"** (gói dịch vụ trả
      phí/kích hoạt riêng, không phải xin quyền API thông thường), **đang chờ
      xã kiểm tra mục này**. Khi xác nhận có quyền: chỉ cần đặt
      `ZALO_BROADCAST_ENABLED=true` trong `.env` (VPS) + restart backend, code
      không cần sửa gì thêm.
- [ ] **Gửi thẻ tin qua tin nhắn** (thay cho broadcast — code xong 2026-09-22,
      AdminWeb → Gửi tin nhắn Zalo → tab "Gửi thẻ tin"): gửi 1 tin tức tới
      từng người dạng thẻ (ảnh + tiêu đề + mô tả, bấm vào mở bài viết OA hoặc
      trang tin gốc) bằng **tin tư vấn** list template — cùng cơ chế
      HOATIEN/QUESON đang chạy thật; KHÔNG cần quyền Broadcast (nhóm quyền
      "Gửi tin nhắn" đã được duyệt — xem mục trên). Xem
      `Backend/src/services/newsCardService.js`.
      Luật Zalo (oa.zalo.me → Tổng quan các loại tin nhắn / Tin Tư vấn): chỉ
      gửi được qua OpenAPI tới người **tương tác với OA trong 7 ngày**; miễn phí
      trong 48 giờ, sau đó tính phí (~55đ/tin sau khi hết hạn mức gói); quá 7
      ngày Zalo từ chối. Việc cần làm trước khi dùng thật (gửi thử qua
      AdminWeb **production**, KHÔNG chạy script gọi Zalo từ máy local — xem
      sự cố token ở mục trên):
      1. **Cấu hình Webhook** app OA trên Zalo Developers: URL
         `https://tralienapi.dxvtech.vn/api/zalo/webhook`, bật các sự kiện
         người dùng gửi tin (`user_send_*`), `follow`/`unfollow`,
         `user_click_chatnow`, `user_submit_info`. Sau đó kiểm tra log PM2 có
         dòng `[zaloWebhook] Nhận sự kiện` và đối chiếu payload thật với
         `eventUserId()` trong `zaloActivityService.js` (sender.id /
         follower.id / user_id). Chưa có webhook thì mọi follower ở nhóm "Chưa rõ".
      2. Gắn **Zalo User ID** cho tài khoản admin của mình (Tài khoản Admin →
         Sửa) rồi nhắn 1 tin vào OA → bấm **"Gửi thử cho tôi"** để xem thẻ thật
         và bấm thử link.
      3. Lần gửi thật đầu tiên: ghi lại mã lỗi Zalo trả về cho người quá 7 ngày
         (hiện ở tiến độ gửi + lịch sử) để gắn tên tiếng Việt cho mã đó.
      4. Xác nhận với Zalo/bảng giá gói OA: "miễn phí trong 48h" có giới hạn 8
         tin/người hay không (hệ thống đang tính theo giới hạn 8 cho an toàn).

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
      chính xác hơn).
      **Đã test đẩy 1 phản ánh thật lên 1022** theo yêu cầu/uỷ quyền của anh
      (2026-09-15) — tiêu đề "TEST [Vui lòng bỏ qua]", nội dung "Test chức
      năng", đánh dấu rõ để cán bộ thành phố bỏ qua. Kết quả: **thành công**,
      `gopyId=112368` (xem https://gopy.danang.gov.vn/gop-y?pageid=view&ykien=112368).
      Trong lúc test phát hiện `CGY1022_NGUON="Góp ý Zalo"` bị 1022 từ chối
      (`404 NguonGopY ... does not exist` — đúng cảnh báo đã ghi trong
      `config/index.js`) — **đã đổi lại thành `"Zalo"`** (giống Thăng
      Điền/Đại Lộc), test lại thành công. Cũng phát hiện response thật của
      `GET /public/gopy/{id}` lúc "Đang xử lý" **không có field
      `maTinhTrangXuLy`** (khác ví dụ trong tài liệu) — đã sửa
      `cgy1022StatusService.js` để không phụ thuộc riêng field này (kiểm tra
      thêm `tinhTrangXuLy === "Đã xử lý"`).
- [ ] **IOCTC** (`tctthc.1022.vn`, tra cứu hồ sơ TTHC) — tương tự, quyết định
      tài khoản riêng/chung, điền `IOCTC_USERNAME/PASSWORD`.
- [x] **EVN CPC** (lịch cắt điện) — đã xác nhận (2026-09-14): Trà Liên do
      **Điện lực Trà My (PC05NN)** phụ trách. Đã điền
      `XENVN_URL=https://xenvn.com/lich-cup-dien/dien-luc-tra-my-pc05nn/` và
      `EVNCPC_SUBORG_CODE=PC05NN` trong `Backend/.env`. **Lưu ý**: nguồn xenvn
      này gộp chung NHIỀU xã (Trà Liên, Trà Giáp, Trà My, Trà Đốc...) trong
      cùng 1 feed — ban đầu có thử lọc chỉ giữ khu vực xác nhận thuộc Trà
      Liên, nhưng theo yêu cầu xã (2026-09-14) đã đổi lại lấy **TOÀN BỘ**
      trạm của khu vực Trà My (giống cách Thăng Điền dùng chung feed Thăng
      Bình) — dân tự chọn khu vực mình qua bộ lọc "chọn trạm" có sẵn trong
      `lich-cup-dien.jsx`. Không còn cần EVN CPC API trực tiếp
      (`EVNCPC_ORG_CODE`) hay workflow ingest GitHub Actions nữa — xenvn.com
      cào thẳng được từ VPS.
- [x] **Trang TTĐT xã Trà Liên — Tin tức**: đã xác nhận URL
      `https://tralien.danang.gov.vn` (2026-09-14). Trang này dùng portal
      VNPT (theme "qnm-ubnd", hạ tầng cũ Quảng Nam) — **KHÁC HẲN** CMS
      "CMS14" của Thăng Điền, nên đã **viết lại toàn bộ** `newsScrapeService.js`
      (Cheerio, khớp đúng cấu trúc `div.ArticleCat`/`ul.ArticleOfCat` của
      trang thật) thay vì dùng regex cũ. Đã điền `NEWS_SOURCE_URL=
      https://tralien.danang.gov.vn/tin-tuc` và chạy sync thật — 304 tin thật
      đã vào DB, ảnh nhúng thẳng từ nguồn (không cần re-host Cloudinary, ảnh
      nguồn khai đúng Content-Type).
- [x] **Trang TTĐT xã Trà Liên — Văn bản**: đã viết lại `vanBanTraLienService.js`
      đúng cấu trúc HTML thật của `tralien.danang.gov.vn/van-ban-chi-dao-dieu-hanh`
      (`ul.ArticleList > li.row`, ngày ban hành lấy trực tiếp từ `.Ngaydang`
      thay vì đoán từ tiêu đề như bản cũ theo pattern DotNetNuke/RadGrid của
      Thăng Điền — không khớp gì với site thật nên trước đó luôn trả về rỗng).
      Đã điền `VAN_BAN_SOURCE_URL` + chạy sync thật trên production
      (2026-09-14): văn bản thật đã vào DB, `GET /api/public/van-ban` trả kết
      quả đúng.
- [x] **Kỹ năng PCTT — video không hiển thị**: nguyên nhân là `Backend/media/`
      bị loại khỏi lần copy fork ban đầu từ Thăng Điền (đúng chủ đích, tránh
      copy nội dung đặc thù xã cũ) nhưng 14 video PCTT (id 01/02/05/06/13,
      166MB) lại là video kỹ năng phổ quát (không đặc thù theo xã) nên đáng
      lẽ phải giữ lại — đã copy từ `MINIAPP_THANGDIEN/Backend/media/pctt-videos`
      sang, SFTP thẳng lên VPS (`Backend/media/` nằm trong `.gitignore`, không
      qua git — giống ngoại lệ `.env`) và xác nhận phát được qua
      `GET /media/pctt-videos/...` trên production (2026-09-14).
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
- [x] **Trang Liên hệ — bản đồ + logo** (2026-09-14): tab "Liên hệ" trước chỉ
      hiện placeholder text "bản đồ vị trí UBND xã" — đã nhúng iframe Bản đồ
      số Đà Nẵng lọc sẵn theo địa giới xã
      (`https://bando.danang.gov.vn/?ward=Trà Liên`, cùng URL đã dùng ở
      quick-link "Bản đồ" trên Trang chủ). Đã xác nhận `bando.danang.gov.vn`
      không chặn iframe (không có header `X-Frame-Options`/CSP
      `frame-ancestors`). Cũng đổi icon "UBND xã" (Material icon chung
      chung) thành logo thật của xã (`static/logo-tralien.png`, cùng ảnh
      dùng ở Trang chủ) cho đồng bộ nhận diện thương hiệu.

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
