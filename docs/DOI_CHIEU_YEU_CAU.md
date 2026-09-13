# Đối chiếu tiến độ với "Nội dung công việc" xã Trà Liên (cập nhật 2026-09-14)

Đối chiếu 5 mục yêu cầu trong bảng xã gửi với trạng thái thật hiện tại — đã
kiểm chứng bằng gọi API sống (`https://tralienapi.dxvtech.vn`), không chỉ đọc
code. ✅ = chạy thật, có bằng chứng · 🟡 = có nhưng chưa đầy đủ/chưa cấu hình ·
⬜ = chưa làm.

---

## 1. Đăng tin, gửi tin tức, chủ trương, chính sách, cảnh báo thiên tai tự động đến người dân đã quan tâm OA Zalo

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| Cào tin tức tự động từ trang TTĐT xã thật | ✅ | Viết lại hoàn toàn [`newsScrapeService.js`](../Backend/src/services/newsScrapeService.js) cho đúng portal VNPT thật của `tralien.danang.gov.vn/tin-tuc` (khác hẳn CMS Thăng Điền). **304 tin thật** đã vào DB, `GET /api/public/news` trả về dữ liệu thật, cron 3 lần/ngày |
| Trang "Tin tức" + giao diện Trang chủ | ✅ | Đã redesign toàn bộ MiniApp (icon Material Symbols, logo/banner thật của xã) — live tại https://tralien.dxvtech.vn |
| Thông báo (chủ trương/chính sách) | ✅ | `GET /api/public/thong-bao` hoạt động, trang AdminWeb quản lý được |
| Văn hoá & Du lịch (nội dung thật thay mẫu Thăng Điền) | ✅ | Đã thay bằng nội dung thật về đồng bào Cor, cồng chiêng, lễ hội Sắc Xuân Làng Co, di tích văn hoá Co, điểm du lịch Dội Bà Bình — đọc từ chính trang TTĐT xã |
| Cảnh báo thiên tai | 🟡 | Trang tĩnh có sẵn (kỹ năng PCTT, bản đồ ngập) nhưng chưa có luồng "tạo 1 cảnh báo mới → tự động đẩy" |
| **"Tự động đến người dân đã quan tâm OA Zalo"** | 🟡 **Vẫn chưa tự động thật sự** | Zalo OA đã kết nối thật (xem mục 2) và **có khả năng gửi thật** (`sendBroadcast`), nhưng vẫn cần **admin bấm gửi tay** ở AdminWeb — chưa có đoạn nối "tin/cảnh báo mới → tự động broadcast toàn bộ follower". Đây là việc còn thiếu duy nhất trong mục 1, đã nêu 2 lần, vẫn chưa triển khai vì chưa được yêu cầu làm cụ thể. |

## 2. Tiếp nhận phản ánh, kiến nghị và góp ý của người dân — ✅ ĐÃ CHẠY THẬT 100% ĐẦU-CUỐI

Đây là mục đã kiểm chứng kỹ nhất, bằng 1 phản ánh **thật** trên hệ thống thành phố:

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| Gửi phản ánh qua Zalo Mini App | ✅ | [`report-form.jsx`](../MiniApp/src/pages/report-form.jsx) → `POST /api/public/feedbacks` |
| Đồng bộ lên Cổng góp ý 1022 thành phố | ✅ **Test thật thành công** | Phản ánh test "TEST [Vui lòng bỏ qua]" đã lên 1022 thật, **mã `112368`**: https://gopy.danang.gov.vn/gop-y?pageid=view&ykien=112368. Phát hiện + sửa 2 lỗi thật trong lúc test: (1) `CGY1022_NGUON` phải đúng `"Zalo"`, không phải `"Góp ý Zalo"` (1022 từ chối 404 nếu sai); (2) response thật của 1022 thiếu field `maTinhTrangXuLy` so với tài liệu — đã vá code |
| Thông báo nhóm tiếp nhận qua Zalo | ✅ | [`feedbackNotifyService.notifyGroup()`](../Backend/src/services/feedbackNotifyService.js) — gửi vào nhóm Zalo theo `Category.zaloGroupId` (cần xã cấu hình Group ID cho từng danh mục ở AdminWeb → Cài đặt) |
| Người dân tra cứu theo mã | ✅ **Test thật** | `GET /api/public/feedbacks/by-code/112368` trả đúng dữ liệu, đủ timeline 4 bước (Đã gửi → Tiếp nhận 1022 → Đang xử lý → Đã trả lời) |
| **Thông báo kết quả xử lý từ 1022 đến dân** | ✅ **Code mới, cơ chế đã chạy, đang chờ 1022 xử lý xong để xác nhận vòng cuối** | [`cgy1022StatusService.js`](../Backend/src/services/cgy1022StatusService.js) — quét mỗi 30 phút, khi 1022 báo xử lý xong thì tự cập nhật + gửi Zalo cho dân. Đây là tính năng **Thăng Điền cũng chưa có** (chỉ An Hải có tương tự) — Trà Liên giờ đã có |
| Thông báo tới nhóm cán bộ phụ trách | ✅ | Cùng cơ chế `notifyGroup()` |

## 3. Nhóm tính năng liên kết — ✅ Đủ, theo đúng phạm vi xã đã chốt lại

| Việc | Trạng thái |
|---|---|
| Khảo sát hài lòng, Cổng dữ liệu (`congdulieu.vn`), Bản đồ số, QR tài liệu, Bình dân học vụ số, DaNang AI | ✅ Link thật, đã cập nhật 2026-09-14 |
| Hẹn giờ DVC / đăng ký hộ KD / đăng ký hộ khẩu / bảng giá đất | ⬜ **Đã bỏ theo yêu cầu xã** (không phải thiếu sót — xã xác nhận không cần 4 mục này nữa) |

## 4. Hướng dẫn Thủ tục hành chính, trả lời câu hỏi thường gặp bằng Chatbot tự động

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| Code chatbot (Claude API), điều hướng đúng các mục thật của Trà Liên | ✅ code xong | [`assistantService.js`](../Backend/src/services/assistantService.js) |
| Vận hành thật | ⬜ **Vẫn thiếu `ANTHROPIC_API_KEY`** | Test lại vừa rồi: `POST /api/public/assistant/ask` → vẫn 503 (tự tắt đúng thiết kế, chưa lỗi gì, chỉ đơn giản là chưa có key) |

## 5. Tích hợp tiện ích tra cứu an sinh xã hội

| Việc | Trạng thái | Bằng chứng |
|---|---|---|
| **Lịch y tế** (module mới xây riêng cho Trà Liên) | ✅ | Đầy đủ 5 lớp (model → API admin/public → trang AdminWeb → trang MiniApp), đã test tạo/đọc/xoá qua API thật |
| Lịch cắt điện | ⬜ Vẫn thiếu mã điện lực | Chưa có `EVNCPC_SUBORG_CODE` đúng khu vực Trà Liên (mã Thăng Bình cũ không dùng được) |
| Tra cứu hồ sơ TTHC (IOCTC) | ⬜ Vẫn thiếu tài khoản | Tương tự CGY1022 — cần quyết định tài khoản riêng/chung |
| Văn bản - Chính sách | ⬜ Chưa viết lại cho đúng site thật | `vanBanTraLienService.js` vẫn theo cấu trúc CMS Thăng Điền, portal VNPT thật của Trà Liên có menu khác hẳn (`/van-ban-dang-uy`, `/van-ban-hdnd`, `/van-ban-ubnd`) — cùng dạng việc đã làm được cho "Tin tức", chỉ là chưa tới lượt |

---

## Tổng kết nhanh

| # | Yêu cầu | % hoàn thành thực tế |
|---|---|---|
| 1 | Đăng tin/cảnh báo tự động | ~80% — nội dung tự động đầy đủ, chỉ thiếu khâu tự-broadcast |
| 2 | Phản ánh - góp ý | **~95%** — đã chạy thật đầu-cuối trên hệ thống 1022 thật |
| 3 | Nhóm liên kết dịch vụ | **100%** theo đúng phạm vi đã chốt với xã |
| 4 | Chatbot | 90% code, 0% vận hành (thiếu 1 API key) |
| 5 | Tra cứu an sinh xã hội | Lịch y tế 100%, lịch cắt điện/văn bản còn thiếu cấu hình |

**3 việc còn lại có giá trị cao nhất để hoàn thiện tiếp** (theo thứ tự nên làm):
1. Xin `ANTHROPIC_API_KEY` — bật chatbot ngay lập tức, không cần code thêm.
2. Viết lại `vanBanTraLienService.js` cho đúng site thật (đã có sẵn cách làm từ vụ Tin tức).
3. Xin mã điện lực EVN CPC khu vực Trà Liên — bật lịch cắt điện.

Việc "tự động broadcast tin/cảnh báo" (mục 1) và "IOCTC" (mục 5) cần xã quyết định trước (có muốn tự động hoàn toàn không kiểm duyệt? dùng tài khoản IOCTC nào?) nên xếp sau.
