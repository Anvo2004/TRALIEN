import React from "react";

// Icon bổ sung cho tab Công dân, cùng phong cách bộ icon Nông Sơn Số
// (nét tròn 1,8px, mảng màu 20%). Khoá → { tone, svg }. Dùng qua <XIcon name="..." />.
const ICONS = {
  chat: {
    tone: "blue",
    svg: (
      <>
        <path className="ns-t" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 4v-4h-1A1.5 1.5 0 0 1 4 14.5z" />
        <path d="M8 8.5h8M8 12h5" />
      </>
    ),
  },
  copy: {
    tone: "blue",
    svg: (
      <>
        <rect x="8.5" y="8.5" width="11" height="11" rx="2.2" />
        <path d="M15.5 8.5V6.7a2.2 2.2 0 0 0-2.2-2.2H6.7a2.2 2.2 0 0 0-2.2 2.2v6.6a2.2 2.2 0 0 0 2.2 2.2h1.8" />
      </>
    ),
  },
  send: {
    tone: "gold",
    svg: <path className="ns-t" d="M14 4l7 7-7 7v-4c-5 0-8 1.5-10 5 .5-6 4-10 10-10z" />,
  },
  adduser: {
    tone: "blue",
    svg: (
      <>
        <circle className="ns-t" cx="9.5" cy="8" r="3.5" />
        <path className="ns-t" d="M3 20c.6-3.8 3.2-5.8 6.5-5.8S15.4 16.2 16 20z" />
        <path d="M19 8v6M16 11h6" />
      </>
    ),
  },
  award: {
    tone: "gold",
    svg: (
      <>
        <circle className="ns-t" cx="12" cy="9" r="5.5" />
        <path d="M8.8 13.6L7.5 21l4.5-2.6 4.5 2.6-1.3-7.4M12 6.6l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" />
      </>
    ),
  },
  bell: {
    tone: "teal",
    svg: (
      <>
        <path className="ns-t" d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" />
        <path d="M10 20.5a2 2 0 0 0 4 0" />
      </>
    ),
  },
  share: {
    tone: "green",
    svg: (
      <>
        <circle className="ns-t" cx="6.5" cy="12" r="2.4" />
        <circle cx="17.5" cy="6" r="2.4" />
        <circle cx="17.5" cy="18" r="2.4" />
        <path d="M8.7 10.8l6.6-3.6M8.7 13.2l6.6 3.6" />
      </>
    ),
  },
  gift: {
    tone: "violet",
    svg: (
      <>
        <rect className="ns-t" x="4" y="9" width="16" height="11" rx="2" />
        <path d="M3.5 9h17v-2.5h-17zM12 6.5V20M12 6.5C10.5 3.5 7 4 7.5 6.2 8 7.5 10 6.5 12 6.5zM12 6.5C13.5 3.5 17 4 16.5 6.2 16 7.5 14 6.5 12 6.5z" />
      </>
    ),
  },
  megaphone: {
    tone: "coral",
    svg: (
      <>
        <path className="ns-t" d="M4 10.2v3.6a1 1 0 0 0 1 1h2.5l7.5 4.2V5L7.5 9.2H5a1 1 0 0 0-1 1z" />
        <path d="M18 9.5a3.6 3.6 0 0 1 0 5M20.4 7.2a6.8 6.8 0 0 1 0 9.6" />
      </>
    ),
  },
  pin: {
    tone: "blue",
    svg: (
      <>
        <path className="ns-t" d="M9 4h6l-1 6 3 3v1.5H7V13l3-3z" />
        <path d="M12 14.5V20" />
      </>
    ),
  },
  book: {
    tone: "teal",
    svg: (
      <>
        <path className="ns-t" d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
        <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7.5h6M9 11h4" />
      </>
    ),
  },
  user: {
    tone: "teal",
    svg: (
      <>
        <circle className="ns-t" cx="12" cy="8.5" r="3.6" />
        <path d="M5 20c.6-3.8 3.4-6 7-6s6.4 2.2 7 6" />
      </>
    ),
  },
  refresh: {
    tone: "blue",
    svg: (
      <>
        <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5" />
      </>
    ),
  },
  phone: {
    tone: "coral",
    svg: (
      <path
        className="ns-t"
        d="M6.6 3.5h2.7l1.4 3.9-1.8 1.2a11 11 0 0 0 5.5 5.5l1.2-1.8 3.9 1.4v2.7a1.8 1.8 0 0 1-2 1.8A15.5 15.5 0 0 1 4.8 5.5a1.8 1.8 0 0 1 1.8-2z"
      />
    ),
  },
  check: {
    tone: "green",
    svg: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  },
  clock: {
    tone: "blue",
    svg: (
      <>
        <circle className="ns-t" cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
  },
  info: {
    tone: "teal",
    svg: (
      <>
        <circle className="ns-t" cx="12" cy="12" r="8.5" />
        <path d="M12 11v5M12 8v.01" />
      </>
    ),
  },
  medal: {
    tone: "gold",
    svg: (
      <>
        <circle className="ns-t" cx="12" cy="14.5" r="5.5" />
        <path d="M8.5 3.5L12 9.5l3.5-6M12 12v5" />
      </>
    ),
  },
};

export const xTone = (name) => ICONS[name]?.tone || "teal";

const XIcon = ({ name, size = 25 }) => {
  const def = ICONS[name];
  if (!def) return null;
  return (
    <svg className="ns-sv" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {def.svg}
    </svg>
  );
};

export default XIcon;
