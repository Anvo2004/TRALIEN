// Phân loại nhóm đối tượng trợ cấp — dùng chung cho chip lọc + card kết quả
// (khớp với enum loaiTroCap trong Backend/src/models/TroCapSchedule.js)
export const TRO_CAP_CATEGORIES = {
  cong: {
    label: "Người có công với cách mạng",
    shortLabel: "Người có công",
    icon: "🎖️",
    color: "#f59e0b",
    soft: "#fff7ed",
    ink: "#c2410c",
  },
  baotro: {
    label: "Bảo trợ xã hội hàng tháng",
    shortLabel: "Bảo trợ XH",
    icon: "🤝",
    color: "#3b82f6",
    soft: "#eff6ff",
    ink: "#1d4ed8",
  },
  ngheo: {
    label: "Hỗ trợ hộ nghèo, cận nghèo",
    shortLabel: "Hộ nghèo",
    icon: "🏠",
    color: "#10b981",
    soft: "#ecfdf5",
    ink: "#047857",
  },
  treem: {
    label: "Trợ cấp trẻ em & chính sách khác",
    shortLabel: "Trẻ em",
    icon: "👶",
    color: "#f43f5e",
    soft: "#fff1f2",
    ink: "#be123c",
  },
};

export function statusOf(ngayChiTra) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(ngayChiTra);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() < today.getTime()) return "Hoàn thành";
  if (d.getTime() === today.getTime()) return "Đang diễn ra";
  return "Sắp diễn ra";
}

export function statusColor(status) {
  if (status === "Sắp diễn ra") return { bg: "#f5f3ff", color: "#7c3aed" };
  if (status === "Đang diễn ra") return { bg: "#eff6ff", color: "#2563eb" };
  return { bg: "#ecfdf5", color: "#059669" };
}

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export function weekday(iso) {
  return WEEKDAYS[new Date(iso).getDay()];
}

export function ddmm(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
}
