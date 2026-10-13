import React from "react";
import Icon3, { ICON3_NAMES } from "./ns-icons3d.jsx";

// Tên icon lưu trong AppLink (bộ Material cũ) → icon 3D tương ứng của bản thiết kế.
// Tên không có trong bảng (cán bộ tự thêm) thì nơi gọi rơi về icon phẳng cũ.
const MAP3 = {
  groups: "people", holiday_village: "village", map: "map", account_balance: "gov",
  description: "doc", theater_comedy: "gong", travel_explore: "mount", storm: "storm",
  vaccines: "medcal", rate_review: "bubble", campaign: "mega", call: "phone",
  qr_code_2: "qr", computer: "laptop", star: "clip", public: "db", schedule: "clock",
  storefront: "store", search: "folder", auto_awesome: "ai", folder_open: "folder",
  bolt: "power", volunteer_activism: "heart", smart_toy: "bot", badge: "id",
  language: "globe", forum: "bubble", mail: "mail", local_police: "shield",
};

export const name3 = (n) => {
  const k = MAP3[n] || n;
  return ICON3_NAMES.includes(k) ? k : null;
};

// Ô icon 3D (nền trắng bo góc, nổi nhẹ). `sm` = cỡ 52px dùng ở danh sách/dịch vụ.
const Glyph = ({ name, sm = false }) => {
  const k = name3(name);
  if (!k) return null;
  return (
    <span className={`ns-ic3 ${sm ? "ns-sm" : ""}`}>
      <Icon3 name={k} />
    </span>
  );
};

export default Glyph;
