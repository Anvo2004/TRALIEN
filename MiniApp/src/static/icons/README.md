# Icon 3D đóng gói trong MiniApp

Nguồn: **Icons8 "3D Fluency"** — https://icons8.com/icons/3d-fluency

Các file `*.png` trong thư mục này **không nằm trong git**: chúng được
`scripts/fetch-icons.mjs` tải về tự động trước mỗi `npm run build` /
`npm run dev` (hook `prebuild`/`prestart` trong `package.json`).

Lý do: repo này public, mà giấy phép miễn phí của Icons8 **cấm phát tán icon
dưới dạng file rời** — để ảnh trong repo công khai thì ai cũng tải về được như
một bộ icon. Nếu xã mua gói Icons8 hoặc chuyển repo sang private thì bỏ dòng
`src/static/icons/*.png` trong `.gitignore`, commit thẳng ảnh và xoá hai hook
đó cho pipeline bớt phụ thuộc mạng.

## Những ảnh nào nằm ở đây

Chỉ các icon **bắt buộc có sẵn trong bundle**:

- `tab-*.png` — thanh tab dưới cùng, phải hiện ngay khi mở app, không chờ mạng.
- `pctt-*.png`, `trocap-*.png` — 2 màn có danh mục cố định
  (`src/data/pctt.js`, `src/data/tro-cap-categories.js`), không quản lý qua
  AdminWeb.

Icon của lưới "Tiện ích nhanh" và trang "Dịch vụ" **không** nằm ở đây: chúng
lưu trong MongoDB (`AppLink.iconUrl`), ảnh host trên Cloudinary, đổi được qua
AdminWeb mà không cần build lại MiniApp — xem
`Backend/scripts/seed-app-icons.js`.

## Ghi công

Giấy phép miễn phí của Icons8 yêu cầu có link tới icons8.com nơi hiển thị
icon. Trong app, dòng ghi công nằm ở màn "Thông tin ứng dụng"
(`src/pages/thong-tin-ung-dung.jsx`, vào từ cuối trang Liên hệ). Mua gói
Icons8 thì xoá dòng đó, phần còn lại giữ nguyên.
