const Anthropic = require("@anthropic-ai/sdk");
const config = require("../config");
const Category = require("../models/Category");
const Notice = require("../models/Notice");
const TroCapSchedule = require("../models/TroCapSchedule");
const VanBan = require("../models/VanBan");
const PowerOutage = require("../models/PowerOutage");
const LichYTe = require("../models/LichYTe");

// ============================================================
// Trợ lý số — trả lời câu hỏi của người dân bằng Claude API.
//
// Không phải RAG đầy đủ: để tránh gọi DB + nhồi ngữ cảnh cho MỌI câu hỏi (tốn
// token, tốn tiền), chỉ khi câu hỏi khớp từ khoá của một domain mới truy vấn
// dữ liệu thật của domain đó và đưa vào prompt. Câu hỏi chung chung (thủ tục,
// giấy tờ...) chỉ dùng system prompt tĩnh.
// ============================================================

let client = null;
function getClient() {
  if (!config.anthropic.apiKey) return null;
  if (!client) client = new Anthropic({ apiKey: config.anthropic.apiKey });
  return client;
}

function isConfigured() {
  return Boolean(config.anthropic.apiKey);
}

const SYSTEM_PROMPT = `Bạn là Trợ lý số của Mini App "Công dân số xã Trà Liên" (Đà Nẵng), giúp người dân hỏi đáp về thủ tục hành chính và thông tin của xã.

Mini App có các mục sau — khi câu hỏi liên quan, hãy chỉ người dân vào đúng mục thay vì tự đoán quy trình:
- "Tra cứu hồ sơ TTHC": tra cứu tiến độ hồ sơ đã nộp bằng mã hồ sơ.
- "Văn bản - Chính sách": văn bản chỉ đạo điều hành của xã.
- "Lịch cắt điện": lịch cúp điện của EVN khu vực xã.
- "Lịch y tế": lịch khám bệnh, tiêm chủng của trạm y tế xã.
- "Thông báo trợ cấp": lịch chi trả trợ cấp xã hội (người có công, bảo trợ xã hội, hộ nghèo, trẻ em).
- "Phản ánh - Kiến nghị": gửi phản ánh, kiến nghị tới UBND xã (đồng bộ lên Cổng góp ý 1022 Đà Nẵng).
- "Phòng chống thiên tai": kỹ năng, cảnh báo, bản đồ mưa ngập.

Với các thủ tục hành chính KHÔNG có backend riêng trong app (khai sinh, kết hôn, khai tử, lý lịch tư pháp, giấy phép xây dựng, xác nhận cư trú, chứng thực bản sao...), hãy trả lời bằng kiến thức chung về thủ tục hành chính công Việt Nam và hướng dẫn nộp qua Cổng Dịch vụ công Quốc gia (dichvucong.gov.vn) hoặc liên hệ trực tiếp UBND xã — KHÔNG bịa ra số điện thoại, địa chỉ, lệ phí hay thời gian xử lý cụ thể nếu không chắc chắn.

Trả lời ngắn gọn, thân thiện, bằng tiếng Việt. Nếu có dữ liệu thực tế được cung cấp bên dưới (đánh dấu "DỮ LIỆU THỰC TẾ"), hãy ưu tiên dùng đúng dữ liệu đó thay vì suy đoán.`;

const DOMAIN_KEYWORDS = {
  lich_cup_dien: ["cắt điện", "cúp điện", "mất điện", "điện lực", "evn"],
  lich_y_te: ["y tế", "khám bệnh", "tiêm chủng", "tiêm phòng", "trạm y tế"],
  tro_cap: ["trợ cấp", "bảo trợ", "người có công", "hộ nghèo", "chi trả", "trẻ em mồ côi"],
  van_ban: ["văn bản", "quyết định", "chỉ đạo", "công văn"],
  thong_bao: ["thông báo"],
  danh_muc: ["phản ánh", "kiến nghị", "lĩnh vực phản ánh"],
};

function detectDomains(question) {
  const q = question.toLowerCase();
  return Object.entries(DOMAIN_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => q.includes(kw)))
    .map(([domain]) => domain);
}

async function fetchContext(domains) {
  const blocks = [];

  if (domains.includes("lich_cup_dien")) {
    const items = await PowerOutage.find({ toDate: { $gte: new Date() } })
      .sort({ fromDate: 1 })
      .limit(5)
      .lean();
    if (items.length) {
      blocks.push(
        "Lịch cắt điện sắp tới:\n" +
          items
            .map((o) => `- ${o.stationName || "(chưa rõ trạm)"}: ${o.fromDateStr} → ${o.toDateStr}. Lý do: ${o.reason || "(không có)"}`)
            .join("\n")
      );
    } else {
      blocks.push("Lịch cắt điện: hiện không có lịch cắt điện nào sắp tới trong dữ liệu.");
    }
  }

  if (domains.includes("lich_y_te")) {
    const items = await LichYTe.find({ ngayKham: { $gte: new Date() } })
      .sort({ ngayKham: 1 })
      .limit(5)
      .lean();
    if (items.length) {
      blocks.push(
        "Lịch y tế sắp tới:\n" +
          items
            .map(
              (t) =>
                `- ${t.ngayKham.toLocaleDateString("vi-VN")}${t.khungGio ? " " + t.khungGio : ""} tại ${t.diaDiem}${
                  t.donViThucHien ? ` (${t.donViThucHien})` : ""
                }`
            )
            .join("\n")
      );
    } else {
      blocks.push("Lịch y tế: hiện chưa có lịch khám/tiêm chủng sắp tới trong dữ liệu.");
    }
  }

  if (domains.includes("tro_cap")) {
    const items = await TroCapSchedule.find({ ngayChiTra: { $gte: new Date() } })
      .sort({ ngayChiTra: 1 })
      .limit(5)
      .lean();
    if (items.length) {
      blocks.push(
        "Lịch chi trả trợ cấp sắp tới:\n" +
          items
            .map((t) => `- ${t.ngayChiTra.toLocaleDateString("vi-VN")}${t.khungGio ? " " + t.khungGio : ""} tại ${t.diaDiem}`)
            .join("\n")
      );
    } else {
      blocks.push("Trợ cấp xã hội: hiện chưa có lịch chi trả sắp tới trong dữ liệu.");
    }
  }

  if (domains.includes("van_ban")) {
    const items = await VanBan.find().sort({ crawledAt: -1 }).limit(5).lean();
    if (items.length) {
      blocks.push(
        "Văn bản mới nhất:\n" + items.map((v) => `- ${v.title}${v.soHieu ? ` (${v.soHieu})` : ""}`).join("\n")
      );
    }
  }

  if (domains.includes("thong_bao")) {
    const items = await Notice.find().sort({ createdAt: -1 }).limit(5).lean();
    if (items.length) {
      blocks.push("Thông báo mới nhất:\n" + items.map((n) => `- ${n.title}`).join("\n"));
    }
  }

  if (domains.includes("danh_muc")) {
    const items = await Category.find().sort({ order: 1 }).lean();
    if (items.length) {
      blocks.push(
        "Các lĩnh vực phản ánh - kiến nghị hiện có:\n" + items.map((c) => `- ${c.icon} ${c.name}`).join("\n")
      );
    }
  }

  return blocks.join("\n\n");
}

async function ask(question) {
  const anthropic = getClient();
  if (!anthropic) {
    const err = new Error("Trợ lý số chưa được cấu hình");
    err.status = 503;
    throw err;
  }

  const domains = detectDomains(question);
  const context = domains.length ? await fetchContext(domains) : "";

  const userContent = context ? `DỮ LIỆU THỰC TẾ:\n${context}\n\nCâu hỏi: ${question}` : question;

  const response = await anthropic.messages.create({
    model: config.anthropic.model,
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const answer = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return answer || "Xin lỗi, tôi chưa thể trả lời câu hỏi này. Vui lòng thử lại.";
}

module.exports = { ask, isConfigured };
