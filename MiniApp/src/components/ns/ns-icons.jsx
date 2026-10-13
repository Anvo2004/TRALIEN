import React from "react";

// Bộ icon Nông Sơn Số (nét tròn 1,8px, mảng màu 20%) — khoá = tên icon lưu trong
// collection AppLink (AdminWeb → Icon & liên kết MiniApp). Mỗi icon kèm tông màu
// (khớp lớp .ns-tn-*). Tên icon lạ → NsIcon trả null để nơi gọi rơi về Icon cũ.
export const NS_ICONS = {
  groups: { tone: "teal", svg: (<><circle className="ns-t" cx="12" cy="8.2" r="3.2"/><path d="M5.8 19.5c.5-3.4 3-5.2 6.2-5.2s5.7 1.8 6.2 5.2"/><circle cx="5.2" cy="10" r="1.9"/><circle cx="18.8" cy="10" r="1.9"/></>) },
  holiday_village: { tone: "green", svg: (<><path className="ns-t" d="M4 20v-7.5l4-3 4 3V20z"/><path d="M12 20v-5.2l4-3 4 3V20"/><path d="M2.5 20h19"/><path d="M7 20v-3h2v3"/></>) },
  map: { tone: "blue", svg: (<><path className="ns-t" d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/></>) },
  account_balance: { tone: "teal", svg: (<><path className="ns-t" d="M3.2 9.6L12 4l8.8 5.6z"/><path d="M6.5 12.2v5.3M12 12.2v5.3M17.5 12.2v5.3M3.5 20h17"/></>) },
  description: { tone: "green", svg: (<><path className="ns-t" d="M7.5 3.5h6.5l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1.5-1.5z"/><path d="M14 3.5V8h4M9 12.5h6M9 16h4"/></>) },
  theater_comedy: { tone: "coral", svg: (<><path className="ns-t" d="M2.5 11.5c4.5-.7 7.2-2.9 9.5-6.5 2.3 3.6 5 5.8 9.5 6.5z"/><path d="M6 11.5V19M12 11.5V19M18 11.5V19M4 19.5h16"/></>) },
  travel_explore: { tone: "gold", svg: (<><path className="ns-t" d="M2.5 19.5L9 8l4.5 7.5 2.5-4 5.5 8z"/><circle cx="17.5" cy="6" r="1.8"/></>) },
  storm: { tone: "blue", svg: (<><path className="ns-t" d="M7 15.5a4 4 0 0 1-.4-7.98A5.5 5.5 0 0 1 17.2 8.8 3.4 3.4 0 0 1 17.5 15.5z"/><path d="M9 18.5l-1 2.5M13 18.5l-1 2.5M17 18.5l-1 2.5"/></>) },
  vaccines: { tone: "green", svg: (<><path className="ns-t" d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/><path d="M7.8 12.4h2l1.2-2.2 2 4.2 1.2-2h2"/></>) },
  rate_review: { tone: "gold", svg: (<><path className="ns-t" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 4v-4h-1A1.5 1.5 0 0 1 4 14.5z"/><path d="M8 8.5h8M8 12h5"/></>) },
  campaign: { tone: "coral", svg: (<><path className="ns-t" d="M4 10.2v3.6a1 1 0 0 0 1 1h2.5l7.5 4.2V5L7.5 9.2H5a1 1 0 0 0-1 1z"/><path d="M18 9.5a3.6 3.6 0 0 1 0 5M20.4 7.2a6.8 6.8 0 0 1 0 9.6"/></>) },
  call: { tone: "coral", svg: (<><path className="ns-t" d="M6.6 3.5h2.7l1.4 3.9-1.8 1.2a11 11 0 0 0 5.5 5.5l1.2-1.8 3.9 1.4v2.7a1.8 1.8 0 0 1-2 1.8A15.5 15.5 0 0 1 4.8 5.5a1.8 1.8 0 0 1 1.8-2z"/></>) },
  qr_code_2: { tone: "teal", svg: (<><rect className="ns-t" x="4" y="4" width="6.5" height="6.5" rx="1.3"/><rect className="ns-t" x="13.5" y="4" width="6.5" height="6.5" rx="1.3"/><rect className="ns-t" x="4" y="13.5" width="6.5" height="6.5" rx="1.3"/><path d="M14 14h2.5v2.5H14zM19.5 14v.01M14 19.5h2.5M19.5 17v3.5"/></>) },
  computer: { tone: "violet", svg: (<><rect className="ns-t" x="4.5" y="5" width="15" height="10.5" rx="1.8"/><path d="M2.5 19h19M8.7 8.7l2.3 1.8-2.3 1.8M12.8 12.4h2.6"/></>) },
  star: { tone: "gold", svg: (<><path className="ns-t" d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8 6.9 19.5l1-5.7-4.1-4 5.7-.8z"/></>) },
  public: { tone: "violet", svg: (<><ellipse className="ns-t" cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6"/></>) },
  schedule: { tone: "blue", svg: (<><circle className="ns-t" cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>) },
  storefront: { tone: "gold", svg: (<><path className="ns-t" d="M5.5 12v7.5h13V12z"/><path d="M4 9.5l1.5-5h13l1.5 5c0 1.4-1.2 2.4-2.7 2.4S13.6 10.9 13.6 9.5c0 1.4-.7 2.4-1.6 2.4s-1.6-1-1.6-2.4c0 1.4-1.2 2.4-2.7 2.4S4 10.9 4 9.5z"/><path d="M10 19.5v-4.5h4v4.5"/></>) },
  search: { tone: "teal", svg: (<><circle className="ns-t" cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></>) },
  auto_awesome: { tone: "violet", svg: (<><path className="ns-t" d="M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></>) },
  folder_open: { tone: "blue", svg: (<><path className="ns-t" d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4l2 2.5h8A1.5 1.5 0 0 1 20.5 9.5v8.5A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z"/></>) },
  bolt: { tone: "violet", svg: (<><path className="ns-t" d="M13 3L5.5 13.5H11L10 21l7.5-10.5H12z"/></>) },
  volunteer_activism: { tone: "coral", svg: (<><path className="ns-t" d="M12 10s-3-1.8-3-4a1.9 1.9 0 0 1 3-1.4A1.9 1.9 0 0 1 15 6c0 2.2-3 4-3 4z"/><path d="M4 14h3.5l3.2 1.6H14a1.4 1.4 0 0 1 0 2.8h-3.2M14 17.3l4.2-1.8a1.4 1.4 0 0 1 1.2 2.5L12.5 21H7.5V14"/></>) },
  smart_toy: { tone: "violet", svg: (<><rect className="ns-t" x="5" y="8" width="14" height="10" rx="3"/><path d="M12 8V5.2M3.5 12.5v2M20.5 12.5v2"/><circle cx="12" cy="4.2" r="1"/><circle cx="9.5" cy="13" r=".9" fill="currentColor"/><circle cx="14.5" cy="13" r=".9" fill="currentColor"/></>) },
  badge: { tone: "green", svg: (<><rect className="ns-t" x="3.5" y="5.5" width="17" height="13" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 1.7-2.2 3-2.2s2.5.7 3 2.2M14.5 10h3.5M14.5 13.5h3"/></>) },
  language: { tone: "blue", svg: (<><circle className="ns-t" cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.5 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.5-3.5-8.5S9.5 6.1 12 3.5z"/></>) },
};

export const hasNsIcon = (name) => Boolean(NS_ICONS[name]);
export const nsTone = (name, fallback = "teal") => NS_ICONS[name]?.tone || fallback;

const NsIcon = ({ name, size = 27 }) => {
  const def = NS_ICONS[name];
  if (!def) return null;
  return (
    <svg className="ns-sv" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {def.svg}
    </svg>
  );
};

export default NsIcon;
