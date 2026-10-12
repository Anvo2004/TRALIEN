# Bộ icon 3D – Tiện ích nhanh (19 icon)

| Thư mục | Nội dung | Dùng khi |
|---|---|---|
| `svg/` | Icon có nền ô bo góc, vector, 64×64 | Dùng trực tiếp trong app/web, nét ở mọi kích thước |
| `svg-no-tile/` | Chỉ phần hình 3D, không có nền ô | Muốn tự đặt nền, hoặc dùng trên nền màu khác |
| `png-192/`, `png-512/` | PNG nền trong suốt, có nền ô | Mini app/Zalo OA cần ảnh raster (192 = @3x của 64pt) |
| `png-no-tile-192/`, `png-no-tile-512/` | PNG nền trong suốt, không nền ô | Như trên nhưng không có ô |
| `icons.json` | Danh sách id, tên file, nhãn tiếng Việt, màu nền ô | Map icon vào menu bằng code |

Mỗi file SVG tự chứa gradient của nó, copy riêng lẻ vẫn chạy.

## Dùng nhanh
```html
<img src="svg/01-dan-so.svg" width="64" height="64" alt="Dân số">
```
- Hiển thị khuyến nghị: 56–64 px, bo góc đã nằm trong SVG (rx = 20/64).
- Bóng đổ dưới ô trong bản thiết kế là CSS, thêm nếu muốn:
  `filter: drop-shadow(0 6px 8px rgba(40,70,140,.28))`
- Lưu ý khi nhúng nhiều SVG inline vào cùng một trang: id gradient (gb, gc, ...) trùng nhau nhưng giống hệt nhau nên không lỗi. Dùng `<img>` thì không cần lo.

---

## Dùng trong dự án Trà Liên Số

Bộ này là icon **riêng của xã** (không phải Icons8), dùng cho 19 mục của lưới
"Tiện ích nhanh" trên Trang chủ MiniApp.

- Bản đang dùng thật: `png-no-tile-192/` — lưới hiện tại không có ô nền, icon
  nổi trực tiếp trên thẻ trắng.
- Nạp vào hệ thống: `node Backend/scripts/import-icon-pack.js` (xem trước bằng
  `--dry-run`). Script khớp icon với mục trong MongoDB theo `label` trong
  `icons.json`, nên đổi tên mục ở AdminWeb thì phải sửa `icons.json` theo.
- Ảnh sau khi nạp nằm trên Cloudinary/VPS và được lưu ở `AppLink.iconUrl`; đổi
  icon lẻ từng mục thì làm thẳng trong AdminWeb, không cần chạy lại script.
