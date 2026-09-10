import React from "react";
import { Sheet } from "zmp-ui";
import CardMedia from "./card-media.jsx";

// Dùng Sheet của zmp-ui (thay vì overlay position:fixed tự viết) — overlay tự
// viết bị BottomNavigation (z-index riêng của zmp-ui, nằm ngoài stacking
// context của trang do route-transition dùng transform) đè lên, làm phần dưới
// của sheet bị che mất. Sheet built-in xử lý đúng việc này.
const DetailSheet = ({ item, fallbackIcon, onClose }) => {
  return (
    <Sheet visible={!!item} onClose={onClose} autoHeight swipeToClose>
      {item && (
        <div className="detail-sheet-body">
          <button type="button" className="detail-sheet__close" onClick={onClose}>
            ✕
          </button>
          <div className="detail-sheet__media">
            <CardMedia
              item={item}
              fallback={<span className="detail-sheet__media-ph">{item.icon || fallbackIcon}</span>}
            />
          </div>
          <div className="detail-sheet__text">
            <div className="detail-sheet__title">{item.title || item.name}</div>
            {item.subtitle && <div className="detail-sheet__subtitle">{item.subtitle}</div>}
            {item.desc && <div className="detail-sheet__desc">{item.desc}</div>}
            {item.address && <div className="detail-sheet__address">📍 {item.address}</div>}
          </div>
        </div>
      )}
    </Sheet>
  );
};

export default DetailSheet;
