import React from "react";
import { ICON_PATHS } from "../data/icon-paths.js";

// Thay cho <span className="ms i19 ...">tên_icon</span> (font Material
// Symbols Rounded) — SVG inline tự host, không phụ thuộc mạng nên chạy đúng
// trên WebView thật của Zalo Mini App. `className` giữ nguyên các lớp size
// (i12..i28) + màu (mint/amber/blue/pink/green/grey) đã có trong app.scss:
// width/height="1em" ăn theo font-size do class `.ms.iNN` đặt trên chính
// phần tử này, fill="currentColor" ăn theo class màu.
const Icon = ({ name, className = "" }) => {
  const d = ICON_PATHS[name];
  if (!d) return null;

  return (
    <svg
      className={`ms ${className}`}
      width="1em"
      height="1em"
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
};

export default Icon;
