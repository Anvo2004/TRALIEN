# Đối chiếu tiến độ với "Nội dung công việc" xã Trà Liên

Đối chiếu 5 mục yêu cầu trong bảng xã gửi với trạng thái code hiện tại.
✅ = đã code xong và có bằng chứng chạy thật · 🟡 = code xong nhưng chưa đầy đủ /
chưa cấu hình / chưa deploy · ⬜ = chưa làm.

**Lưu ý quan trọng về trạng thái deploy**: nhiều thay đổi ở MiniApp (redesign
icon, tin tức thật, logo thật...) hiện **mới có trên máy local, CHƯA push lên
GitHub / CHƯA lên VPS** (`git status` cho thấy 18 file đã sửa, chưa commit —
tính tới 2026-09-13). Cột "Deploy" ghi rõ cái nào đã lên `https://tralien.dxvtech.vn`
thật, cái nào chỉ mới ở local.

---

## 1. Đăng tin, gửi tin tức, chủ trương, chính sách, cảnh báo thiên tai tự động đến người dân đã quan tâm OA Zalo

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| Cào tin tức tự động từ trang TTĐT xã | ✅ | [`Backend/src/services/newsScrapeService.js`](../Backend/src/services/newsScrapeService.js) — viết lại hoàn toàn cho đúng cấu trúc HTML thật của `tralien.danang.gov.vn` (portal VNPT, khác CMS Thăng Điền). Đã chạy sync thật: **304 tin** vào MongoDB, cron 3 lần/ngày (`startAutoSync`, dòng 154-158) |
| Trang "Tin tức" trong Mini App | ✅ | [`MiniApp/src/pages/news.jsx`](../MiniApp/src/pages/news.jsx), hiển thị qua `useNews()` gọi `/api/public/news` |
| Thông báo (chủ trương/chính sách) | ✅ | Model [`Notice`](../Backend/src/models/Notice.js), route admin [`notices.js`](../Backend/src/routes/notices.js), public `GET /api/public/thong-bao` trong [`publicLookup.js:106`](../Backend/src/routes/publicLookup.js), trang Mini App [`thong-bao.jsx`](../MiniApp/src/pages/thong-bao.jsx) |
| Cảnh báo thiên tai | 🟡 | Trang "Phòng chống thiên tai" + bản đồ mưa ngập có sẵn ([`phong-chong-thien-tai.jsx`](../MiniApp/src/pages/phong-chong-thien-tai.jsx), [`ban-do-mua-ngap.jsx`](../MiniApp/src/pages/ban-do-mua-ngap.jsx)) nhưng là nội dung tĩnh/kỹ năng — chưa có luồng "tạo 1 cảnh báo → tự động đẩy tới toàn bộ người theo dõi" |
| **"Tự động đến người dân đã quan tâm OA Zalo"** | 🟡 **Chưa thật sự tự động** | Có 2 cơ chế, cả 2 đều KHÔNG tự bắn thông báo cho toàn bộ follower: (1) [`zaloNewsService.js:8`](../Backend/src/services/zaloNewsService.js#L8) — tự động đăng tin đã cào thành "Bài viết" trên OA, nhưng comment chính chủ ghi rõ *"CHỈ tạo bài, KHÔNG broadcast — không bắn thông báo tới người theo dõi"*; đang tắt mặc định (`ZALO_ARTICLE_ENABLED=false`). (2) [`broadcastService.js`](../Backend/src/services/broadcastService.js) + trang AdminWeb "Gửi tin nhắn Zalo" (`MessagesPage.jsx`) gửi được tới follower/nhóm thật — nhưng là **admin bấm gửi tay**, không tự động khi có tin/cảnh báo mới. **Muốn đúng nghĩa "tự động"** cần nối: tin mới / cảnh báo mới → gọi `sendBroadcast()` tới danh sách follower — hiện chưa có đoạn nối này. |

## 2. Tiếp nhận phản ánh, kiến nghị và góp ý của người dân

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| Gửi phản ánh qua Zalo Mini App | ✅ | [`MiniApp/src/pages/report-form.jsx`](../MiniApp/src/pages/report-form.jsx) → `POST /api/public/feedbacks` ([`publicFeedback.js:35`](../Backend/src/routes/publicFeedback.js#L35)) |
| Đồng bộ lên Cổng góp ý thành phố (1022) | 🟡 code xong, chưa có tài khoản | [`cgy1022Service.js`](../Backend/src/services/cgy1022Service.js) — cơ chế auth/payload viết đủ theo API thật của `gopy.danang.gov.vn`; tự tắt (`isConfigured()` dòng 35-37) vì `CGY1022_USERNAME/PASSWORD` còn trống trong `Backend/.env` — cần xã quyết định dùng tài khoản riêng hay chung (xem `docs/SETUP_CHECKLIST.md` mục 4) |
| Thông báo tới Nhóm tiếp nhận phản ánh (qua Zalo) | ✅ | [`feedbackNotifyService.notifyGroup()`](../Backend/src/services/feedbackNotifyService.js#L67) — gửi tin nhắn đầy đủ (tiêu đề, người gửi, ảnh, mã) vào nhóm Zalo gắn với từng lĩnh vực (`Category.zaloGroupId`) |
| Người dân theo dõi tiến độ theo mã phản ánh | ✅ | Endpoint mới `GET /api/public/feedbacks/by-code/:code` ([`publicFeedback.js`](../Backend/src/routes/publicFeedback.js)) + tab "Tra cứu theo mã" trong [`phan-anh-cua-toi.jsx`](../MiniApp/src/pages/phan-anh-cua-toi.jsx) (không cần đăng nhập Zalo, có rate-limit theo IP) |
| Thông báo kết quả xử lý đến người dân | ✅ | `POST /:id/approve` ([`feedbacks.js:137-153`](../Backend/src/routes/feedbacks.js#L137)) — lãnh đạo duyệt trả lời → gửi thẳng `sendZaloText` cho người dân. **Lưu ý**: đây là luồng duyệt **nội bộ của xã** trên AdminWeb, không phải đồng bộ ngược trạng thái xử lý thật từ hệ thống 1022 của thành phố (1022 hiện chỉ dùng 1 chiều: đẩy lên lấy mã, chưa có cơ chế đọc lại trạng thái xử lý từ 1022) |
| Thông báo tới Nhóm cán bộ phụ trách | ✅ | Cùng cơ chế `notifyGroup()` ở trên — nhóm Zalo theo lĩnh vực chính là "nhóm cán bộ phụ trách tiếp nhận" |

## 3. Nhóm tính năng liên kết

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| Khảo sát mức độ hài lòng | ✅ | [`MiniApp/src/data/quick-links.js:34-39`](../MiniApp/src/data/quick-links.js#L34) — link thật (Google Form) |
| Cổng dữ liệu | ✅ | `quick-links.js:40-45` → `congdulieu.vn` |
| Bản đồ số | ✅ | `quick-links.js:6-12` → `bando.danang.gov.vn` (đã tham số hoá đúng tên xã Trà Liên) |
| QR Code quản lý tài liệu | ✅ | `quick-links.js:22-27` → `qrcode.danangportal.gov.vn` |
| Bình dân học vụ số | ✅ | `quick-links.js:28-33` → `binhdanhocvuso.danang.gov.vn` |
| Hẹn giờ Cổng Dịch vụ công / đăng ký hộ KD / đăng ký hộ khẩu / bảng giá đất | ⬜ **Đã bỏ theo yêu cầu xã** | Theo `docs/SETUP_CHECKLIST.md` mục 5: xã xác nhận không dùng 4 mục này nữa — đã gỡ khỏi `quick-links.js`, không phải thiếu sót |
| **Lưu ý ghi chú đỏ trong ảnh** ("giống An Hải, nguồn chỉ ghi chung 'Góp ý qua Zalo'") | ⬜ chưa đối chiếu | Chưa kiểm tra lại theo mẫu xã An Hải — cần xã cung cấp cụ thể muốn field "nguồn" hiển thị ra sao trên 1022 |

## 4. Hướng dẫn Thủ tục hành chính và trả lời câu hỏi thường gặp bằng Chatbot tự động

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| Chatbot Trợ lý số (Claude API) | 🟡 code xong, chưa có API key | [`assistantService.js`](../Backend/src/services/assistantService.js) — `SYSTEM_PROMPT` (dòng 29+) đã điều hướng đúng các mục thật của Mini App Trà Liên (tra cứu hồ sơ, văn bản, lịch cắt điện, **lịch y tế**, trợ cấp, phản ánh, PCTT); tự tắt (503) vì `ANTHROPIC_API_KEY` còn trống |
| Trả lời câu hỏi hành chính chung (không có backend riêng) | ✅ | Cùng file, dòng 39: hướng dẫn theo kiến thức chung + dẫn ra Cổng DVC Quốc gia, không bịa số liệu |
| Giao diện chat trong Mini App | ✅ | [`MiniApp/src/pages/assistant.jsx`](../MiniApp/src/pages/assistant.jsx), route `/tro-ly-so` |

## 5. Tích hợp tiện ích tra cứu an sinh xã hội (lịch cúp điện, lịch y tế...)

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| Lịch cắt điện | 🟡 code xong, chưa có mã điện lực | [`catDienService.js`](../Backend/src/services/catDienService.js), trang [`lich-cup-dien.jsx`](../MiniApp/src/pages/lich-cup-dien.jsx) — tự bỏ qua đồng bộ vì `EVNCPC_SUBORG_CODE`/`XENVN_URL` chưa xác nhận (mã của Thăng Điền không dùng được cho Trà Liên) |
| **Lịch y tế** (mới, xã yêu cầu riêng) | ✅ | Model [`LichYTe.js`](../Backend/src/models/LichYTe.js), CRUD admin [`lichYTe.js`](../Backend/src/routes/lichYTe.js), API public `/api/public/lich-y-te`, trang AdminWeb [`LichYTePage.jsx`](../Frontend/AdminWeb/src/pages/LichYTePage.jsx), trang Mini App [`lich-y-te.jsx`](../MiniApp/src/pages/lich-y-te.jsx) — module hoàn chỉnh 5 lớp, đã build/test qua |
| Tra cứu hồ sơ TTHC | ✅ (baseline sẵn có) | [`hoSoService.js`](../Backend/src/services/hoSoService.js), trang [`tra-cuu-ho-so.jsx`](../MiniApp/src/pages/tra-cuu-ho-so.jsx) |
| Văn bản - Chính sách | 🟡 cần viết lại | `vanBanTraLienService.js` vẫn theo cấu trúc CMS Thăng Điền (RadGrid), **chưa kiểm chứng** với portal VNPT thật của Trà Liên (menu thật: `/van-ban-dang-uy`, `/van-ban-hdnd`, `/van-ban-ubnd`) |

---

## Hạ tầng đã triển khai thật (không nằm trong 5 mục nhưng là nền tảng)

- **Backend + AdminWeb + MongoDB**: chạy thật tại VPS `123.30.48.104`, PM2 `tralien-backend`/`tralien`, đã seed tài khoản admin, đã nối MongoDB Atlas.
- **Domain + SSL**: https://tralien.dxvtech.vn (MiniApp mirror), https://tralienapi.dxvtech.vn (API), https://tralienadmin.dxvtech.vn (AdminWeb) — Let's Encrypt, tự gia hạn.
- **CI/CD**: `git push` lên `main` tự động build + deploy (đã test thành công, xem `docs/SETUP_CHECKLIST.md` mục 7).
- **Mini App ID Zalo thật**: `3119481354295122948`, đã điền đúng `MiniApp/zmp-cli.json` (còn thiếu bước `zmp-cli deploy` để lên hẳn trong app Zalo — không tự làm được, cần đăng nhập Zalo Console).

## Việc nên làm tiếp theo (ưu tiên đề xuất)

1. **Nối "tin/cảnh báo mới" → tự động broadcast** cho đúng nghĩa "tự động" của mục 1 (hiện chỉ push tay).
2. Commit + push 18 file đang sửa dở ở local (redesign UI, tin tức thật) rồi để CI/CD tự deploy.
3. Xin `ANTHROPIC_API_KEY` để bật Chatbot thật.
4. Xin tài khoản CGY1022/IOCTC + mã điện lực EVN CPC khu vực Trà Liên.
5. Viết lại `vanBanTraLienService.js` cho đúng cấu trúc Văn bản thật (đã có sẵn cách làm mẫu từ Tin tức).
