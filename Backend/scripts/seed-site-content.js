// Seeds the Village/DanSo/DuLich/VanHoa/SiteInfo collections with the content
// that used to live in MiniApp/src/data/*.js before those pages moved to
// fetching from the DB. Safe to re-run — skips any collection that already
// has data, so this is the source of truth for reconstructing this content on
// a fresh DB (e.g. disaster recovery, a new environment) instead of it only
// existing wherever it was manually seeded. Usage: node scripts/seed-site-content.js
const mongoose = require("mongoose");
const config = require("../src/config");
const Village = require("../src/models/Village");
const DanSo = require("../src/models/DanSo");
const DuLich = require("../src/models/DuLich");
const VanHoa = require("../src/models/VanHoa");
const SiteInfo = require("../src/models/SiteInfo");

const VILLAGES = [
  { ten: "Thôn Bình Trung", biThu: "Xa Hữu Hoàng", thonTruong: "Nguyễn Trung Phương", matTran: "Bùi Thị Tường" },
  { ten: "Thôn Kế Xuyên", biThu: "Võ Đăng Triều", thonTruong: "Ngô Thanh Tài", matTran: "Trần Hữu Lộc" },
  { ten: "Thôn Xuân Phú", biThu: "Ngô Thị Nguyện", thonTruong: "Nguyễn Thành Thu", matTran: "Ngô Thị Mỹ Lan" },
  { ten: "Thôn Trà Long", biThu: "Lý Ngọc Tuyến", thonTruong: "", matTran: "Ngô Thị Thùy Ngân" },
  { ten: "Thôn Bình An", biThu: "Nguyễn Thị Hợi", thonTruong: "Trần Ngọc Nhi", matTran: "Hồ Thị Tùng Thao" },
  { ten: "Thôn An Thành", biThu: "Phạm Văn Liên", thonTruong: "Ngô Ngọc Luyến", matTran: "Huỳnh Thị Ngọc Linh" },
  { ten: "Thôn An Thành 1", biThu: "Trần Văn Nhân", thonTruong: "Đỗ Thanh Trinh", matTran: "Trần Thị Hương" },
  { ten: "Thôn Phước Mỹ", biThu: "Đinh Hương", thonTruong: "Bùi Vương Quốc", matTran: "Nguyễn Tấn Lân" },
  { ten: "Thôn Phước An", biThu: "Trịnh Xuân A", thonTruong: "Kiều Thị Hoàng Ánh", matTran: "Phan Thị Kim Nguyệt" },
  { ten: "Thôn Tú Ngọc", biThu: "Võ Quốc Dũng", thonTruong: "Phan Tấn Mỹ", matTran: "Ngô Thị Hồng Tuyết" },
  { ten: "Thôn Bình Tú", biThu: "Nguyễn Văn Anh", thonTruong: "Nguyễn Minh Thắng", matTran: "Lê Thị Hồng Nhung" },
  { ten: "Thôn Nghĩa Phương", biThu: "Nguyễn Văn Phát", thonTruong: "Võ Đức Quý", matTran: "Trần Thị Diệu" },
];

const DAN_SO = {
  tongDanSo: 42280,
  dienTichKm2: 61.59,
  soThon: 12,
  hoDan: null,
  gioiTinh: null,
  doTuoi: null,
};

const DU_LICH = {
  title: "Du lịch - Danh thắng",
  subtitle: "Khám phá nét đẹp làng quê & tiềm năng du lịch sinh thái xã Trà Liên",
  diemNoiBat: [
    { id: 1, icon: "🏪", title: "Chợ Kế Xuyên", subtitle: "Trung tâm thương mại truyền thống" },
    { id: 2, icon: "🛣️", title: "Đường Võ Chí Công", subtitle: "Trục kết nối giao thông du lịch" },
    { id: 3, icon: "🌾", title: "Du lịch sinh thái", subtitle: "Trải nghiệm nông thôn Trà Liên" },
  ],
  diemThamQuan: [
    {
      id: 1,
      title: "Chợ Kế Xuyên & Khu trung tâm thương mại Trà Liên",
      desc: "Khu chợ truyền thống sầm uất gắn liền với lịch sử phát triển kinh tế - văn hóa của xã Trà Liên, tập trung nhiều nông sản OCOP và ẩm thực đặc trưng địa phương.",
      address: "Thôn Kế Xuyên, xã Trà Liên, TP. Đà Nẵng",
      image: null,
    },
    {
      id: 2,
      title: "Đình làng & Chùa Kế Xuyên",
      desc: "Quần thể di tích văn hóa tâm linh lâu đời, không gian yên bình mộc mạc lưu giữ nét đẹp kiến trúc cổ truyền thống.",
      address: "Thôn Kế Xuyên 1, xã Trà Liên, TP. Đà Nẵng",
      image: null,
    },
    {
      id: 3,
      title: "Khu di tích lịch sử Lăng Bà Phô Thị",
      desc: "Di tích lịch sử - văn hóa ghi dấu truyền thống tri ân tiền hiền, không gian thanh tịnh thu hút du khách tìm hiểu văn hóa dân gian.",
      address: "xã Trà Liên, TP. Đà Nẵng",
      image: null,
    },
    {
      id: 4,
      title: "Tuyến du lịch sinh thái - Nông nghiệp trải nghiệm",
      desc: "Không gian làng quê yên bình, vùng sản xuất nông nghiệp chất lượng cao kết hợp trải nghiệm cảnh quan cánh đồng và đời sống nông thôn Trà Liên.",
      address: "Các thôn trên địa bàn xã Trà Liên",
      image: null,
    },
  ],
};

const VAN_HOA = {
  title: "Văn hóa - Nghệ thuật",
  subtitle: "Bảo tồn & phát huy bản sắc văn hóa truyền thống xã Trà Liên",
  hoatDong: [
    {
      id: 1,
      icon: "🚣",
      title: "Lễ hội Đua thuyền truyền thống",
      desc: "Lễ hội văn hóa tín ngưỡng dân gian quy mô cấp xã, nét đẹp truyền thống cầu cho quốc thái dân an, mưa thuận gió hòa.",
    },
    {
      id: 2,
      icon: "🏛️",
      title: "Lễ cúng Kỳ Yên Đình làng Kế Xuyên",
      desc: 'Sự kiện văn hóa tâm linh sâu sắc, tôn vinh đạo lý "Uống nước nhớ nguồn" và tri ân các bậc tiền nhân khai hoang lập thôn.',
    },
    {
      id: 3,
      icon: "🎨",
      title: "Ngày hội Văn hóa - Thể thao Nông thôn mới",
      desc: "Sân chơi văn hóa thể thao quy tụ nghệ nhân, vận động viên các thôn thi tài, giao lưu văn nghệ dân gian.",
    },
    {
      id: 4,
      icon: "🌾",
      title: "Bảo tồn Làng nghề & Sản phẩm OCOP",
      desc: "Hoạt động duy trì, quảng bá các làng nghề thủ công và sản phẩm nông nghiệp OCOP đặc trưng xã Trà Liên.",
    },
  ],
  diSan: [
    { id: 1, icon: "🏅", title: "Đình làng Kế Xuyên", subtitle: "Di tích lịch sử - văn hóa cấp tỉnh • Kiến trúc nghệ thuật truyền thống" },
    { id: 2, icon: "🏅", title: "Khu di tích Lăng Bà Phô Thị", subtitle: "Di tích lịch sử công nhận • Văn hóa tâm linh lâu đời" },
    { id: 3, icon: "🏅", title: "Địa đạo & Căn cứ cách mạng Bình An", subtitle: "Di tích lịch sử kháng chiến • Ghi dấu truyền thống cách mạng" },
    { id: 4, icon: "🏅", title: "Lễ hội Đua thuyền & Cầu ngư truyền thống", subtitle: "Di sản văn hóa phi vật thể địa phương • Nét đẹp văn hóa sông nước" },
    { id: 5, icon: "🏅", title: "Nghệ thuật Bài chòi & Dân ca miền Trung", subtitle: "Di sản văn hóa phi vật thể • Sinh hoạt văn hóa cộng đồng" },
  ],
  diemNoiBat: [
    { id: 1, icon: "🏛️", name: "Đình làng Kế Xuyên" },
    { id: 2, icon: "🏪", name: "Chợ Kế Xuyên" },
    { id: 3, icon: "🏯", name: "Lăng Bà Phô Thị" },
    { id: 4, icon: "🚩", name: "Căn cứ Bình An" },
    { id: 5, icon: "⛩️", name: "Chùa Kế Xuyên" },
    { id: 6, icon: "🎭", name: "Trung tâm VH-TT Trà Liên" },
  ],
  tinTuc: [
    {
      id: 101,
      tag: "Văn hóa",
      date: "15/12/2026",
      title: "Xã Trà Liên tập huấn công tác chuyển đổi số, kỹ năng số cho cán bộ và tổ công nghệ số cộng đồng",
      summary: "Phòng Văn hóa - Xã hội, UBND xã Trà Liên tổ chức tập huấn nâng cao kỹ năng số, bảo tồn di sản và đẩy mạnh chính quyền số...",
      source: "UBND xã Trà Liên",
    },
    {
      id: 102,
      tag: "Văn hóa",
      date: "08/04/2026",
      title: "Hội LHPN xã Trà Liên tổ chức chương trình Mẹ đỡ đầu - Trao yêu thương",
      summary: "Hội LHPN xã Trà Liên tổ chức trao quà và nhận đỡ đầu các em nhỏ có hoàn cảnh khó khăn trên địa bàn xã...",
      source: "UBND xã Trà Liên",
    },
  ],
};

const SITE_INFO = {
  contact: {
    officeName: "Trụ sở UBND xã Trà Liên",
    address: "Thôn Kế Xuyên 2, xã Trà Liên, thành phố Đà Nẵng",
    phone: "0905129866",
    hotline: "0905129866",
    email: "TODO",
    website: "tralien.danang.gov.vn",
    workHours: "Thứ 2 - Thứ 6: 7h30 - 17h00\nSáng: 7h30-11h30 | Chiều: 13h30-17h00",
  },
  zaloOA: {
    name: "Zalo OA xã Trà Liên",
    description: "Nhận thông báo, tin tức mới nhất từ chính quyền.",
  },
  digitalTransform: {
    title: "Chuyển đổi số xã Trà Liên",
    tags: ["Chính quyền số", "Kinh tế số", "Xã hội số"],
  },
};

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");

  const villageCount = await Village.countDocuments();
  if (villageCount === 0) {
    await Village.insertMany(VILLAGES.map((v, i) => ({ ...v, thuTu: i + 1 })));
    console.log(`Seeded ${VILLAGES.length} villages.`);
  } else {
    console.log(`Village collection already has ${villageCount} documents, skipping.`);
  }

  for (const [name, Model, data] of [
    ["DanSo", DanSo, DAN_SO],
    ["DuLich", DuLich, DU_LICH],
    ["VanHoa", VanHoa, VAN_HOA],
    ["SiteInfo", SiteInfo, SITE_INFO],
  ]) {
    const existing = await Model.findOne();
    if (existing) {
      console.log(`${name} already has a document, skipping.`);
    } else {
      await Model.create(data);
      console.log(`Seeded ${name}.`);
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
