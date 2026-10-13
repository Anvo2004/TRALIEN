// Sinh bộ icon 3D cho màn Công dân số và Liên hệ, dựng theo đúng ngôn ngữ hình
// của bộ icon xã trong assets/icons-tien-ich-nhanh (bóng đổ + lớp đùn tối +
// thân gradient + nét highlight trắng), khác ở chỗ không có nền ô.
import fs from "node:fs/promises";
import path from "node:path";

const OUT = "D:/TRALIEN/MiniApp/src/static/icons3d";

// Bảng gradient lấy nguyên từ bộ icon xã để hai bộ cùng tông màu.
const DEFS = `<linearGradient id="gb" x1="0.25" y1="0" x2="0.65" y2="1"><stop offset="0" stop-color="#9FD0FF"/><stop offset="0.5" stop-color="#4C97FF"/><stop offset="1" stop-color="#2358D8"/></linearGradient>
<linearGradient id="gbl" x1="0.25" y1="0" x2="0.65" y2="1"><stop offset="0" stop-color="#D4EAFF"/><stop offset="1" stop-color="#84BDFF"/></linearGradient>
<linearGradient id="gc" x1="0.25" y1="0" x2="0.65" y2="1"><stop offset="0" stop-color="#A9EFFF"/><stop offset="0.5" stop-color="#36BDF2"/><stop offset="1" stop-color="#1481C9"/></linearGradient>
<linearGradient id="gg" x1="0.25" y1="0" x2="0.65" y2="1"><stop offset="0" stop-color="#9DF3CB"/><stop offset="0.5" stop-color="#22C68C"/><stop offset="1" stop-color="#0C8D66"/></linearGradient>
<linearGradient id="ga" x1="0.25" y1="0" x2="0.65" y2="1"><stop offset="0" stop-color="#FFE794"/><stop offset="0.5" stop-color="#FFBA33"/><stop offset="1" stop-color="#F58A12"/></linearGradient>
<linearGradient id="gy" x1="0.25" y1="0" x2="0.65" y2="1"><stop offset="0" stop-color="#FFF3A0"/><stop offset="0.55" stop-color="#FFD23F"/><stop offset="1" stop-color="#F7A81B"/></linearGradient>
<linearGradient id="gr" x1="0.25" y1="0" x2="0.65" y2="1"><stop offset="0" stop-color="#FFAFA6"/><stop offset="0.5" stop-color="#FF5C60"/><stop offset="1" stop-color="#D52B3F"/></linearGradient>
<linearGradient id="gv" x1="0.25" y1="0" x2="0.65" y2="1"><stop offset="0" stop-color="#DEC9FF"/><stop offset="0.5" stop-color="#9470FF"/><stop offset="1" stop-color="#5D3CD8"/></linearGradient>
<linearGradient id="gw" x1="0.25" y1="0" x2="0.65" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#F1F5FC"/><stop offset="1" stop-color="#CBD7EC"/></linearGradient>
<linearGradient id="gs" x1="0.25" y1="0" x2="0.65" y2="1"><stop offset="0" stop-color="#C7D0E1"/><stop offset="0.5" stop-color="#8A96B0"/><stop offset="1" stop-color="#55617F"/></linearGradient>
<filter id="bl" x="-40%" y="-150%" width="180%" height="400%"><feGaussianBlur stdDeviation="1.7"/></filter>`;

// Màu lớp "đùn" (mặt bên khối 3D) theo từng tông.
const DARK = {
  gb: "#1F4CB8", gc: "#0E6FAD", gg: "#0A7653", ga: "#C96D06",
  gy: "#C98A08", gr: "#B21F33", gv: "#4B2DB5", gw: "#A9B8D4", gs: "#45506B",
};

// Mỗi icon: paths = các hình chính (có lớp đùn + viền), extras = nét phụ vẽ sau.
const ICONS = {
  "share": {
    label: "Chia sẻ",
    shade: "gb",
    body: `<circle cx="46" cy="16" r="7"/><circle cx="18" cy="32" r="7"/><circle cx="46" cy="48" r="7"/>`,
    extras: `<path d="M24 29 L40 20 M24 35 L40 44" stroke="#2358D8" stroke-width="3.4" stroke-linecap="round" fill="none"/>
<circle cx="46" cy="16" r="7" fill="url(#gb)"/><circle cx="18" cy="32" r="7" fill="url(#gb)"/><circle cx="46" cy="48" r="7" fill="url(#gb)"/>
<path d="M43 12.5 a5 5 0 0 1 3.5 -1.5" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round" fill="none"/>
<path d="M15 28.5 a5 5 0 0 1 3.5 -1.5" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  "referral": {
    label: "Nhập mã giới thiệu",
    shade: "gc",
    body: `<rect x="10" y="18" width="44" height="30" rx="7"/>`,
    extras: `<circle cx="25" cy="31" r="5.5" fill="#fff" opacity=".95"/>
<path d="M17 42 c1.6-4.6 4.4-6.6 8-6.6 s6.4 2 8 6.6 Z" fill="#fff" opacity=".95"/>
<path d="M38 29 h10 M38 36 h10" stroke="#fff" stroke-opacity=".85" stroke-width="3" stroke-linecap="round" fill="none"/>
<path d="M13 23 a4 4 0 0 1 4 -3" stroke="#fff" stroke-opacity=".65" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  "points": {
    label: "Tích điểm",
    shade: "gy",
    body: `<path d="M32 10 l6.6 13.4 14.8 2.1 -10.7 10.4 2.5 14.7 -13.2-6.9 -13.2 6.9 2.5-14.7 -10.7-10.4 14.8-2.1 Z"/>`,
    extras: `<path d="M24 20 q4-5 9-6" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" fill="none"/>
<circle cx="52" cy="14" r="2.6" fill="#FFE794"/><circle cx="12" cy="18" r="2" fill="#FFE794"/>`,
  },
  "bell": {
    label: "Quan tâm OA",
    shade: "ga",
    body: `<path d="M32 10 c-7.5 0-13 5.5-13 13 v9 l-4 6.5 c-0.8 1.3 0.2 2.9 1.7 2.9 h30.6 c1.5 0 2.5-1.6 1.7-2.9 L45 32 v-9 c0-7.5-5.5-13-13-13 Z"/>`,
    extras: `<path d="M26 44 h12 a6 6 0 0 1 -12 0 Z" fill="#F58A12"/>
<path d="M24 20 q3-4 8-4.5" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
  },
  "pin-app": {
    label: "Ghim ứng dụng",
    shade: "gs",
    body: `<rect x="16" y="8" width="32" height="46" rx="6"/>`,
    extras: `<rect x="20" y="14" width="24" height="32" rx="3" fill="#EEF3FC"/>
<circle cx="32" cy="50" r="2.2" fill="#fff" opacity=".9"/>
<path d="M32 20 l2.6 5.3 5.8 0.8 -4.2 4.1 1 5.8 -5.2-2.7 -5.2 2.7 1-5.8 -4.2-4.1 5.8-0.8 Z" fill="url(#gy)"/>
<path d="M19 13 a4 4 0 0 1 4 -3" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  "info": {
    label: "Thông tin ứng dụng",
    shade: "gb",
    body: `<circle cx="32" cy="32" r="22"/>`,
    extras: `<circle cx="32" cy="21.5" r="3.4" fill="#fff"/>
<rect x="28.6" y="28" width="6.8" height="18" rx="3.4" fill="#fff"/>
<path d="M18 26 a16 16 0 0 1 10 -9" stroke="#fff" stroke-opacity=".55" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
  },
  "location": {
    label: "Địa chỉ",
    shade: "gr",
    body: `<path d="M32 8 c-9.4 0-17 7.6-17 17 c0 12.7 17 31 17 31 s17-18.3 17-31 c0-9.4-7.6-17-17-17 Z"/>`,
    extras: `<circle cx="32" cy="25" r="6.6" fill="#fff" opacity=".95"/>
<path d="M21 20 a13 13 0 0 1 8 -7" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
  },
  "globe": {
    label: "Website",
    shade: "gc",
    body: `<circle cx="32" cy="32" r="22"/>`,
    extras: `<path d="M10 32 h44 M32 10 c6 6 9 14 9 22 s-3 16-9 22 c-6-6-9-14-9-22 s3-16 9-22 Z" stroke="#fff" stroke-opacity=".8" stroke-width="2.4" fill="none"/>
<path d="M14 22 q18 7 36 0 M14 42 q18-7 36 0" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>
<path d="M18 26 a16 16 0 0 1 10 -9" stroke="#fff" stroke-opacity=".6" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
  },
  "mail": {
    label: "Email",
    shade: "gg",
    body: `<rect x="8" y="16" width="48" height="33" rx="7"/>`,
    extras: `<path d="M11 21 L32 36 L53 21" stroke="#fff" stroke-opacity=".9" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M11 21 a4 4 0 0 1 4 -2" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  "clock": {
    label: "Giờ làm việc",
    shade: "ga",
    body: `<circle cx="32" cy="33" r="21"/>`,
    extras: `<circle cx="32" cy="33" r="15.5" fill="#FFF7E4"/>
<path d="M32 23 v10.5 l7 4.5" stroke="#C96D06" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path d="M19 26 a16 16 0 0 1 9 -8" stroke="#fff" stroke-opacity=".6" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
  },
  "shield": {
    label: "Công an xã",
    shade: "gv",
    body: `<path d="M32 8 l20 7 v15 c0 13-8.5 22-20 26 c-11.5-4-20-13-20-26 V15 Z"/>`,
    extras: `<path d="M32 21 l3.4 6.9 7.6 1.1 -5.5 5.3 1.3 7.5 -6.8-3.5 -6.8 3.5 1.3-7.5 -5.5-5.3 7.6-1.1 Z" fill="#fff" opacity=".95"/>
<path d="M17 19 l10-3.5" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
  },
  "chat": {
    label: "Zalo OA",
    shade: "gb",
    body: `<path d="M12 14 h32 a6 6 0 0 1 6 6 v14 a6 6 0 0 1 -6 6 H26 l-11 8 v-8 h-3 a6 6 0 0 1 -6-6 V20 a6 6 0 0 1 6-6 Z"/>`,
    extras: `<circle cx="22" cy="27" r="3" fill="#fff"/><circle cx="31" cy="27" r="3" fill="#fff"/><circle cx="40" cy="27" r="3" fill="#fff"/>
<path d="M15 19 a4 4 0 0 1 4 -3" stroke="#fff" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round" fill="none"/>`,
  },
};

await fs.mkdir(OUT, { recursive: true });

for (const [name, icon] of Object.entries(ICONS)) {
  const grad = `url(#${icon.shade})`;
  const dark = DARK[icon.shade];
  // Lớp đùn: chính hình đó, tô màu tối, đẩy xuống 2.4 — tạo cảm giác khối dày.
  const extrude = icon.body.replace(/\/>/g, ` fill="${dark}"/>`);
  const body = icon.body.replace(/\/>/g, ` fill="${grad}" stroke="${grad}" stroke-width="2" stroke-linejoin="round"/>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${icon.label}">
<defs>
${DEFS}
</defs>
<ellipse cx="32" cy="56" rx="15" ry="2.4" fill="#1B2A52" opacity=".22" filter="url(#bl)"/>
<g transform="translate(0 2.4)">${extrude}</g>
${body}
${icon.extras}
</svg>
`;
  await fs.writeFile(path.join(OUT, `${name}.svg`), svg);
}

const files = await fs.readdir(OUT);
let bytes = 0;
for (const f of files) bytes += (await fs.stat(path.join(OUT, f))).size;
console.log(`${files.length} icon -> ${OUT}`);
console.log(`tong ${(bytes / 1024).toFixed(1)}KB, trung binh ${(bytes / files.length / 1024).toFixed(1)}KB/icon`);
