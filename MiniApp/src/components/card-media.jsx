import React from "react";

// Hiển thị ảnh thật (item.image) nếu có, ngược lại dùng fallback (icon/emoji) —
// cùng pattern với NewsImage ở news-card.jsx. Dùng cho mọi ô ảnh/icon ở trang
// Văn hóa và Du lịch để khi UBND bổ sung ảnh qua API, ảnh tự hiện lên mà không
// cần sửa code.
const CardMedia = ({ item, fallback }) => {
  if (item.image) {
    return (
      <img
        src={item.image}
        alt={item.title || item.name || ""}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return fallback;
};

export default CardMedia;
