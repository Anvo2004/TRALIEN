# Rebrand sang một xã khác (fork lần nữa)

Dự án này bản thân là kết quả fork từ MINIAPP_THANGDIEN — codebase này KHÔNG
multi-tenant (không có `tenantId`/field phân biệt xã trong model), mỗi xã là
1 checkout riêng. Nếu cần fork MINIAPP_TRALIEN này sang xã khác, các điểm
chạm cần sửa (đã áp dụng khi tạo dự án này từ Thăng Điền):

| File | Cần sửa |
|---|---|
| `docker-compose.yml` | `container_name`, tên network |
| `.github/workflows/deploy.yml`, `sync-lich-cup-dien.yml` | tên workflow, đường dẫn VPS (`/var/www/...`), tên PM2 process, mã `EVNCPC_ORG_CODE`/`SUBORG_CODE` |
| `Backend/package.json`, `MiniApp/package.json`, `Frontend/AdminWeb/package.json` | trường `name` |
| `Backend/src/config/index.js` | `jwtSecret` fallback, `publicUrl` fallback, `vanBanSourceUrl`, `newsSourceUrl`, `evncpc.*`, `cgy1022.defaultEmail` — **không đoán URL/mã của xã mới, để rỗng + TODO nếu chưa xác nhận** |
| `Backend/src/app.js` | thẻ `zalo-platform-site-verification` (riêng theo domain, không tái dùng) |
| `MiniApp/zmp-cli.json`, `MiniApp/.env.example` | `appId` (Zalo Mini App ID — đăng ký mới trong Zalo Mini App Console) |
| `MiniApp/app-config.json` | `title`/`headerTitle` |
| `MiniApp/src/data/site.js` | `appName`, `shortName`, `province`, `heroCaption` |
| `MiniApp/src/data/api-config.js` | domain Backend production (hardcode, không qua .env) |
| `MiniApp/src/data/services.js`, `quick-links.js` | href URL của xã cũ (trang TTĐT, bản đồ `?ward=...`) |
| `MiniApp/vite.config.js` | `preview.allowedHosts` |
| `MiniApp/src/static/*`, `Frontend/AdminWeb/src/images/*` | logo, banner |
| `Backend/src/services/assistantService.js` | tên xã trong `SYSTEM_PROMPT` |
| `Frontend/AdminWeb/src/components/layout/Sidebar.jsx`, `LoginPage.jsx`, `DashboardPage.jsx` | chuỗi hiển thị tên xã |

## Nguyên tắc khi rebrand

- Chuỗi nhận diện xã (tên, slug container/package) — tìm-thay an toàn, mechanical.
- URL/mã của bên thứ ba đặc thù theo xã (cổng thông tin điện tử, mã điện lực
  EVN CPC, tài khoản CGY1022/IOCTC) — **KHÔNG suy ra bằng tìm-thay** (vd.
  `thangdien.danang.gov.vn` → `tralien.danang.gov.vn` gần như chắc chắn sai,
  domain đó có thể không tồn tại). Để rỗng + comment TODO, dựa vào
  `docs/SETUP_CHECKLIST.md` để xác nhận với xã trước khi điền.
- Nội dung mẫu/dữ liệu đã cào (tin tức, ảnh) của xã cũ — xoá hẳn, không đổi
  tên rồi giữ lại (nội dung KHÔNG áp dụng cho xã mới, kể cả sau khi đổi tên).
