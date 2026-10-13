import React from "react";

// Cảnh Rừng · Thác · Nhà truyền thống · Lúa của hero — lấy từ chính logo xã
// Trà Liên, theo bản thiết kế docs/TraLienSo-thiet-ke.zip (design/Main.dc.html).
// Mây trôi và thác nước chảy bằng CSS (ns.css: .ns-r1/.ns-rv). HeroSceneSmall
// dùng ĐÚNG path của HeroScene, chỉ đổi viewBox để chỉ hiện phần chân cảnh
// (nhà + ruộng lúa) — giống kỹ thuật của bản thiết kế gốc.
const SCENE_PATHS = (
  <>
    <path d="M-10 150 L70 66 L150 150Z" fill="#14603C" />
    <path d="M40 150 L120 52 L215 150Z" fill="#1C7A4C" />
    <path d="M120 52 L160 150 L215 150Z" fill="#14603C" fillOpacity=".55" />
    <path d="M180 150 L255 34 L345 150Z" fill="#2E9E66" />
    <path d="M255 34 L300 150 L345 150Z" fill="#1C7A4C" />
    <path d="M215 134 L252 62M236 142 L256 90" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeOpacity=".8" />
    <path d="M330 150 L395 70 L440 150Z" fill="#1C7A4C" />
    <path d="M286 78 C296 90 292 110 298 130 L330 130 C326 112 332 92 324 78Z" fill="#CFF3FF" />
    <path d="M292 80 C300 96 296 112 302 130" fill="none" stroke="#29A8DE" strokeWidth="3" strokeLinecap="round" className="ns-rv" />
    <path d="M308 80 C314 98 310 114 316 130" fill="none" stroke="#7FD3F2" strokeWidth="2.5" strokeLinecap="round" className="ns-rv" />
    <ellipse cx="312" cy="132" rx="26" ry="5" fill="#fff" fillOpacity=".7" />
    <g className="ns-r1" fill="#fff">
      <ellipse cx="90" cy="40" rx="28" ry="6" />
      <circle cx="80" cy="36" r="6" />
      <circle cx="98" cy="33" r="8" />
      <ellipse cx="380" cy="30" rx="22" ry="5" />
      <circle cx="374" cy="26" r="5" />
      <circle cx="388" cy="24" r="7" />
    </g>
    {/* Nhà truyền thống trên cột (nhà sàn) */}
    <path d="M20 112 L52 90 L84 112Z" fill="#8A3A1E" />
    <rect x="28" y="112" width="48" height="10" fill="#C98B4B" />
    <path d="M32 122v14M44 122v14M56 122v14M68 122v14" stroke="#6B3A1C" strokeWidth="3" />
    {/* Ruộng lúa vàng chân màn hình */}
    <path d="M0 140 C80 128 160 142 240 134 C320 126 380 140 440 132 V150 H0Z" fill="#E8A91C" />
    <path d="M0 146 C90 138 170 148 250 142 C330 136 390 146 440 140 V150 H0Z" fill="#C98B14" />
    <path d="M0 149 H440 V150 H0Z" fill="#F2F7EF" />
  </>
);

export const HeroScene = () => (
  <svg className="ns-scene" viewBox="0 0 430 150" style={{ height: 150 }} aria-hidden="true">
    {SCENE_PATHS}
  </svg>
);

export const HeroSceneSmall = () => (
  <svg className="ns-scene" viewBox="0 70 430 80" style={{ height: 80 }} aria-hidden="true">
    {SCENE_PATHS}
  </svg>
);
