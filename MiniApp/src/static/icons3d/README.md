# Icon 3D cho màn Công dân số & Liên hệ

Hai nguồn, cùng một ngôn ngữ hình (bóng đổ + lớp đùn tối + thân gradient +
nét highlight trắng):

- `*.png` — lấy từ bộ icon riêng của xã, bản không nền ô
  (`assets/icons-tien-ich-nhanh/png-no-tile-192`). Cần thêm icon nào từ bộ đó
  thì copy sang đây rồi `import` trong trang.
- `*.svg` — bộ bổ sung cho các mục bộ kia chưa có (chia sẻ, mã giới thiệu,
  tích điểm, chuông, ghim app, thông tin, địa chỉ, website, email, giờ làm
  việc, công an, chat). Sinh bằng `node scripts/gen-icons3d.mjs`; sửa hình
  thì sửa trong script đó rồi chạy lại, đừng sửa tay file SVG.

Khác với `src/static/icons/` (icon Icons8 cho thanh tab và 2 màn PCTT/trợ cấp):
thư mục này không vướng giấy phép bên thứ ba nên commit thẳng vào repo.

Cỡ hiển thị: `.icon3d--xs` 28px (hàng trang Liên hệ), `--sm` 36px (hàng trang
Công dân số), `--md` 44px (thẻ dịch vụ).
