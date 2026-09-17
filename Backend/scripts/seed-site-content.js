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

// TODO: danh sách thôn thật của Trà Liên (sau sáp nhập Trà Đông + Trà Nú +
// Trà Kót) chưa có đủ tên bí thư/thôn trưởng/mặt trận để seed — 12 thôn cũ
// bên dưới là của Thăng Điền, đã xoá vì sai xã (xem git blame nếu cần đối
// chiếu). Để trống tới khi có danh sách thật, không suy đoán.
const VILLAGES = [];

// Nguồn: thông tin hành chính xã Trà Liên (Google, 2026-09) — xã sáp nhập từ
// Trà Đông + Trà Nú + Trà Kót (thuộc huyện Bắc Trà My cũ).
const DAN_SO = {
  tongDanSo: 7052,
  dienTichKm2: 178.15,
  soThon: null, // TODO: chưa xác nhận số thôn thực tế sau sáp nhập
  hoDan: null,
  gioiTinh: null,
  doTuoi: null,
};

// Nguồn: bài viết thật trên tralien.danang.gov.vn (chuyên mục "Y Tế - Văn
// Hóa - Xã Hội - KHCN"), đọc + tóm tắt lại 2026-09-14 — xem `link` mỗi mục để
// đối chiếu bài gốc. Trà Liên là xã miền núi, đồng bào dân tộc Cor chiếm hơn
// 49% dân số (tập trung tại Tăk Kót, Tăk Ngưi, Tăk Nú, Làng Gạch) — nội dung
// Du lịch/Văn hóa xoay quanh bản sắc Cor, KHÔNG áp dụng nội dung Thăng Điền
// (chợ/đình làng/lễ hội miền biển) đã xoá trước đó.
//
// Ảnh thật (KHÔNG phải icon tượng trưng) — lấy trực tiếp từ ảnh minh hoạ của
// từng bài viết gốc trên tralien.danang.gov.vn (storage-vnportal.vnpt.vn, đã
// xác nhận Content-Type image/jpeg, nhúng thẳng được — 2026-09-17).
const IMG = {
  trienLamVanHoaCo:
    "https://storage-vnportal.vnpt.vn/qnm-ubnd/7411/H%C3%ACnh%20%E1%BA%A3nh%202026/05/2026/z7848269291287_0f62296700f104f229498e0466f4aef6.jpg",
  doiBaBinh:
    "https://storage-vnportal.vnpt.vn/qnm-ubnd/7411/H%C3%ACnh%20%E1%BA%A3nh%202026/05/2026/z7841728682532_17daddd5a0ae6fdf05e01274c88177f1.jpg",
  sacXuanLangCo:
    "https://storage-vnportal.vnpt.vn/qnm-ubnd/7411/H%C3%ACnh%20%E1%BA%A3nh%202026/01/2026/DSC00143.JPG",
  ongPhamLamDanLat:
    "https://storage-vnportal.vnpt.vn/qnm-ubnd/7411/H%C3%ACnh%20%E1%BA%A3nh%202026/01/2026/01-008795.jpg",
  nghenhanDuongLai:
    "https://storage-vnportal.vnpt.vn/qnm-ubnd/7411/H%C3%ACnh%20%E1%BA%A2nh/12/2025/z7366674257822_707388c68be9686e0d8972517dbe00ae.jpg",
  baThuyDanLat:
    "https://storage-vnportal.vnpt.vn/qnm-ubnd/7411/H%C3%ACnh%20%E1%BA%A2nh/12/2025/01-584907.jpg",
};

const DU_LICH = {
  title: "Du lịch - Danh thắng",
  subtitle: "Khám phá thiên nhiên & bản sắc văn hóa Cor vùng cao Trà Liên",
  diemNoiBat: [
    { id: 1, icon: "🏞️", title: "Dội Bà Bình", subtitle: "Cảnh đẹp sinh thái, tiềm năng du lịch" },
    { id: 2, icon: "🏘️", title: "Bản làng đồng bào Cor", subtitle: "Tăk Kót - Tăk Ngưi - Tăk Nú - Làng Gạch" },
    { id: 3, icon: "🧺", title: "Làng nghề đan lát", subtitle: "Nghề thủ công truyền thống dân tộc Cor" },
  ],
  diemThamQuan: [
    {
      id: 1,
      title: "Dội Bà Bình",
      desc: "Cảnh đẹp sở hữu tiềm năng phát triển du lịch sinh thái lý tưởng của xã. Hạ tầng giao thông kết nối còn hạn chế — chính quyền xã đang vận động người dân hiến đất, mở đường để sớm đưa vào khai thác.",
      address: "Xã Trà Liên, TP. Đà Nẵng (đang hoàn thiện đường vào)",
      image: IMG.doiBaBinh,
      link: "https://tralien.danang.gov.vn/y-te-van-hoa-xa-hoi-khcn/xa-tra-lien-kiem-tra-phat-trien-du-lich-va-van-dong-hien-dat-mo-duong-tai-doi-ba-binh-339263",
    },
    {
      id: 2,
      title: "Bản làng đồng bào Cor Tăk Kót - Tăk Ngưi",
      desc: "Nơi cư trú tập trung của đồng bào dân tộc Cor (hơn 49% dân số xã), còn lưu giữ nghề đan lát thủ công, nghệ thuật cồng chiêng và các nghi lễ dân gian truyền thống như lễ cầu mưa, dựng cây nêu.",
      address: "Thôn Tăk Kót, Tăk Ngưi, xã Trà Liên, TP. Đà Nẵng",
      image: IMG.ongPhamLamDanLat,
      link: "https://tralien.danang.gov.vn/y-te-van-hoa-xa-hoi-khcn/trung-bay-chuyen-de-khong-gian-van-hoa-dong-bao-co-di-san-song-giua-dai-ngan-dien-ra-tu-ngay-29--340664",
    },
  ],
};

const VAN_HOA = {
  title: "Văn hóa - Nghệ thuật",
  subtitle: "Bản sắc văn hóa đồng bào Cor giữa đại ngàn Trà Liên",
  hoatDong: [
    {
      id: 1,
      icon: "🥁",
      title: "Cồng chiêng & đấu chiêng đôi",
      desc: "Nghệ thuật cồng chiêng, đàn, sáo, điệu múa k'đtấu và đấu chiêng đôi — di sản văn hóa đặc trưng gắn với lễ hội, nghi lễ dân gian của đồng bào Cor.",
      image: IMG.nghenhanDuongLai,
    },
    {
      id: 2,
      icon: "🧺",
      title: "Nghề đan lát truyền thống",
      desc: "Người Cor đan gùi, rổ, rá từ tre, giang, nứa, lùng, mây khai thác từ rừng địa phương — nghề thủ công gắn bó qua nhiều thế hệ tại thôn Tăk Kót.",
      image: IMG.ongPhamLamDanLat,
    },
    {
      id: 3,
      icon: "🎉",
      title: "Ngày hội Sắc Xuân Làng Co",
      desc: "Tái hiện nét đẹp văn hóa Tết cổ truyền của đồng bào Cor qua trò chơi dân gian và văn nghệ, giáo dục thế hệ trẻ tình yêu bản sắc dân tộc.",
      image: IMG.sacXuanLangCo,
    },
    {
      id: 4,
      icon: "🙏",
      title: "Nghi lễ dân gian truyền thống",
      desc: "Lễ cầu mưa, phục dựng cây nêu — các nghi lễ độc đáo phản ánh sự hài hòa giữa con người Cor với thiên nhiên núi rừng.",
    },
  ],
  diSan: [
    { id: 1, icon: "🏅", title: "Không gian văn hóa đồng bào Co", subtitle: "Di sản sống giữa đại ngàn • Tập trung tại thôn Tăk Kót, Tăk Ngưi, Tăk Nú, Làng Gạch", image: IMG.trienLamVanHoaCo },
    { id: 2, icon: "🏅", title: "Nghệ thuật cồng chiêng, múa k'đtấu", subtitle: "Di sản văn hóa phi vật thể • Nghệ nhân Ưu tú Dương Lai (thôn Tăk Kót) gìn giữ, truyền dạy", image: IMG.nghenhanDuongLai },
    { id: 3, icon: "🏅", title: "Nghề đan lát thủ công dân tộc Cor", subtitle: "Nghề truyền thống • Tiêu biểu: ông Phạm Lâm, bà Võ Thị Thủy (thôn Tăk Kót)", image: IMG.baThuyDanLat },
  ],
  diemNoiBat: [
    { id: 1, icon: "🥁", name: "Cồng chiêng Cor" },
    { id: 2, icon: "🧺", name: "Đan lát Tăk Kót" },
    { id: 3, icon: "🎊", name: "Sắc Xuân Làng Co" },
    { id: 4, icon: "⛰️", name: "Bản làng Tăk Ngưi" },
  ],
  tinTuc: [
    {
      id: 1,
      tag: "Văn hóa",
      date: "29/05/2026",
      title: "Trưng bày chuyên đề \"Không gian văn hóa đồng bào Co – Di sản sống giữa đại ngàn\"",
      summary: "Trưng bày diễn ra từ 29/5–1/6/2026 tại xã Trà Liên, giới thiệu không gian văn hóa của đồng bào Cor — dân tộc chiếm hơn 49% dân số xã.",
      source: "UBND xã Trà Liên",
      image: IMG.trienLamVanHoaCo,
      link: "https://tralien.danang.gov.vn/y-te-van-hoa-xa-hoi-khcn/trung-bay-chuyen-de-khong-gian-van-hoa-dong-bao-co-di-san-song-giua-dai-ngan-dien-ra-tu-ngay-29--340664",
    },
    {
      id: 2,
      tag: "Văn hóa",
      date: "",
      title: "Tôn vinh đóng góp của nghệ nhân dân gian Dương Lai ở xã Trà Liên",
      summary: "Nghệ nhân Ưu tú Dương Lai (62 tuổi, thôn Tăk Kót) — người gìn giữ nghệ thuật cồng chiêng, cây nêu và các làn điệu dân ca của đồng bào Cor.",
      source: "UBND xã Trà Liên",
      image: IMG.nghenhanDuongLai,
      link: "https://tralien.danang.gov.vn/y-te-van-hoa-xa-hoi-khcn/ton-vinh-dong-gop-cua-nghe-nhan-dan-gian-duong-lai-o-xa-tra-lien-324478",
    },
    {
      id: 3,
      tag: "Văn hóa",
      date: "",
      title: "Người phụ nữ dân tộc Cor giữ lửa nghề đan lát ở xã vùng cao Trà Liên",
      summary: "Bà Võ Thị Thủy (thôn 1, xã Trà Liên) gắn bó với nghề đan lát thủ công từ thuở nhỏ, gìn giữ nghề truyền thống của đồng bào Cor.",
      source: "UBND xã Trà Liên",
      image: IMG.baThuyDanLat,
      link: "https://tralien.danang.gov.vn/y-te-van-hoa-xa-hoi-khcn/nguoi-phu-nu-dan-toc-cor-giu-lua-nghe-dan-lat-o-xa-vung-cao-tra-lien-324356",
    },
  ],
};

// Địa chỉ trụ sở lấy theo trang "Giới thiệu chung" tại tralien.danang.gov.vn
// (nguồn chính thức của xã) — "Thôn Phương Đông", KHÁC với "Thôn Định Yên"
// trên thẻ thông tin Google trước đó. Ưu tiên trang chính thức, giữ lại
// Định Yên trong ngoặc để đối chiếu nếu cần xác minh thêm.
const SITE_INFO = {
  contact: {
    officeName: "UBND xã Trà Liên",
    address: "Thôn Phương Đông, xã Trà Liên, TP Đà Nẵng",
    phone: "0987368258",
    hotline: "0987368258",
    hotline2: "0368259119", // số thứ 2 của Trụ sở UBND và TT PV HCC
    email: "ubndxatralien@danang.gov.vn",
    website: "tralien.danang.gov.vn",
    workHours: "Thứ 2 - Thứ 6: 7h30 - 17h00\nSáng: 7h30-11h30 | Chiều: 13h30-17h00",
    chairman: {
      name: "Nguyễn Hồng Vương",
      title: "Chủ tịch UBND xã Trà Liên",
      phone: "0968078959",
    },
    policeStation: {
      name: "Công an xã Trà Liên",
      address: "Thôn 2 (Trà Nú), xã Trà Liên",
      phone: "02353893338",
    },
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

module.exports = { VILLAGES, DAN_SO, DU_LICH, VAN_HOA, SITE_INFO };

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

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
