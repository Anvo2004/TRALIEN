import React from "react";
import Icon3 from "./ns-icons3d.jsx";

// Emoji dùng làm biểu tượng ở hero/menu các trang cũ → icon 3D của bộ thiết kế.
// Emoji không có trong bảng (VD. icon kỹ năng PCTT do script sinh) giữ nguyên dạng emoji
// trong cùng khung để cả trang đồng bộ kiểu dáng.
const MAP = {
  "👥": "people", "🏘️": "village", "📋": "doc", "📜": "doc", "🏯": "gong", "⛰️": "mount",
  "🌪️": "storm", "🏥": "medcal", "📊": "folder", "⚡": "power", "🔔": "mega", "🎓": "clip",
  "🆘": "mega", "📞": "phone", "🗺️": "map", "💡": "ai",
};

const HeroIcon = ({ e }) => {
  const name = MAP[e];
  if (!name) return <span className="ns-heroicon is-emoji">{e}</span>;
  return (
    <span className="ns-heroicon">
      <Icon3 name={name} />
    </span>
  );
};

export default HeroIcon;
