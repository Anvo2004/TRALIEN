// Quy tắc tích điểm / phân hạng Công dân số — thuần logic, không phụ thuộc DB
// để kiểm thử độc lập. Nội dung mặc định lấy theo thể lệ Đại Lộc; cán bộ sửa
// qua AdminWeb (lưu ở Setting "citizen_program"), không cần build lại.

const POINT_TYPES = ["register", "referrer", "referee", "survey", "feedback", "event", "exam", "adjust"];

const DEFAULT_PROGRAM = {
  target:
    "Tất cả công dân, người dân, cán bộ, đoàn viên, hội viên và người quan tâm sử dụng Zalo Mini App.",
  rules: {
    register: { points: 5, title: "Đăng ký", desc: "Đăng ký tài khoản lần đầu" },
    referrer: { points: 2, title: "Giới thiệu", desc: "Giới thiệu bạn bè thành công" },
    referee: { points: 2, title: "Được giới thiệu", desc: "Nhập mã giới thiệu của bạn bè" },
    survey: { points: 5, title: "Khảo sát", desc: "Hoàn thành khảo sát" },
    feedback: { points: 2, title: "Phản ánh", desc: "Phản ánh được tiếp nhận và phản hồi" },
    event: { points: 5, title: "Sự kiện", desc: "Tham gia check-in sự kiện" },
    exam: { points: 5, title: "Thi trực tuyến", desc: "Tham gia thi trực tuyến" },
  },
  tiers: [
    { key: "cong_dan", name: "Công dân", min: 5 },
    { key: "hoi_vien", name: "Hội viên", min: 20 },
    { key: "cong_dan_so", name: "Công dân số", min: 50 },
  ],
  benefits: [
    {
      title: "Đổi các vật phẩm và hình thức vinh danh, bao gồm:",
      items: [
        "Bằng khen, giấy chứng nhận vinh danh Công dân số theo từng phân hạng.",
        "Các vật phẩm, hiện vật quà tặng từ các cơ quan, tổ chức trên địa bàn.",
      ],
    },
    {
      title: "Ưu tiên tiếp cận các giá trị văn hóa - xã hội, như:",
      items: [
        "Giấy mời dự các sự kiện văn hóa, nghệ thuật, chính trị - xã hội của địa phương.",
      ],
    },
    {
      title: "Vinh danh, biểu dương:",
      items: [
        "Điểm Công dân số là căn cứ quan trọng để xét chọn, vinh danh cá nhân tích cực trong việc lan tỏa chủ trương và xây dựng hình ảnh địa phương hiện đại.",
      ],
    },
  ],
};

function cleanInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

function cleanText(v, fallback, max = 600) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : fallback;
}

// Trộn cấu hình đã lưu với mặc định; luôn trả cấu trúc đầy đủ, hợp lệ.
function normalizeProgram(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = { target: cleanText(src.target, DEFAULT_PROGRAM.target, 1000), rules: {}, tiers: [], benefits: [] };

  for (const [key, def] of Object.entries(DEFAULT_PROGRAM.rules)) {
    const r = (src.rules && src.rules[key]) || {};
    out.rules[key] = {
      points: cleanInt(r.points, def.points),
      title: cleanText(r.title, def.title, 80),
      desc: cleanText(r.desc, def.desc, 200),
    };
  }

  const tiers = Array.isArray(src.tiers) && src.tiers.length ? src.tiers : DEFAULT_PROGRAM.tiers;
  const seen = new Set();
  for (const t of tiers) {
    const name = cleanText(t?.name, "", 60);
    if (!name) continue;
    let key = cleanText(t?.key, "", 40).replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    if (!key || seen.has(key)) key = `tier_${out.tiers.length + 1}`;
    seen.add(key);
    out.tiers.push({ key, name, min: cleanInt(t?.min, 0) });
  }
  out.tiers.sort((a, b) => a.min - b.min);
  if (!out.tiers.length) out.tiers = DEFAULT_PROGRAM.tiers.map((t) => ({ ...t }));

  const benefits = Array.isArray(src.benefits) ? src.benefits : DEFAULT_PROGRAM.benefits;
  for (const b of benefits) {
    const title = cleanText(b?.title, "", 300);
    if (!title) continue;
    const items = (Array.isArray(b.items) ? b.items : [])
      .map((i) => cleanText(i, "", 600))
      .filter(Boolean)
      .slice(0, 20);
    out.benefits.push({ title, items });
  }
  if (!out.benefits.length && !Array.isArray(src.benefits)) {
    out.benefits = DEFAULT_PROGRAM.benefits.map((b) => ({ ...b, items: [...b.items] }));
  }
  return out;
}

// Hạng hiện tại, hạng kế tiếp và % tiến trình tới hạng kế tiếp.
function tierInfo(points, tiers) {
  const pts = Math.max(0, Number(points) || 0);
  let current = null;
  let next = null;
  for (const t of tiers) {
    if (pts >= t.min) current = t;
    else if (!next) next = t;
  }
  let progress = 100;
  let pointsNeeded = 0;
  if (next) {
    // Giống Đại Lộc: 5 điểm / ngưỡng 20 của hạng kế tiếp = 25%.
    progress = next.min > 0 ? Math.min(100, Math.round((pts / next.min) * 100)) : 100;
    pointsNeeded = next.min - pts;
  }
  return { current, next, progress, pointsNeeded };
}

// Mã giới thiệu 6 ký tự, bỏ ký tự dễ nhầm (0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function makeReferralCode(rand = Math.random) {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return s;
}
function normalizeReferralCode(v) {
  return String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Zalo trả số dạng 84xxxxxxxxx; hiển thị/lưu dạng 0xxxxxxxxx.
function normalizePhone(v) {
  const digits = String(v || "").replace(/[^\d]/g, "");
  if (digits.startsWith("84") && digits.length >= 11) return `0${digits.slice(2)}`;
  return digits;
}

module.exports = {
  POINT_TYPES,
  DEFAULT_PROGRAM,
  normalizeProgram,
  tierInfo,
  makeReferralCode,
  normalizeReferralCode,
  normalizePhone,
  CODE_ALPHABET,
};
