import React from "react";
import Icon from "./icon.jsx";

// Chỗ duy nhất quyết định kiểu icon của một mục AppLink:
//   - có `iconUrl` (ảnh 3D cán bộ chọn/tải lên trong AdminWeb) -> ảnh nổi trực
//     tiếp, không ô nền, giống mẫu thiết kế;
//   - chưa có -> giữ nguyên ô .tile + icon vector như trước.
// Nhờ vậy đổi dần từng mục sang ảnh mới mà lưới không bị vỡ giữa chừng.
const AppIcon = ({
  iconUrl,
  name,
  color = "n",
  imgClass = "",
  tileClass = "",
  vectorClass = "i24",
}) => {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        loading="lazy"
        className={`icon3d ${imgClass}`.trim()}
      />
    );
  }

  return (
    <span className={`tile ${tileClass} tile-${color}`.replace(/\s+/g, " ").trim()}>
      <Icon name={name} className={vectorClass} />
    </span>
  );
};

export default AppIcon;
