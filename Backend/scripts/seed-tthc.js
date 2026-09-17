// Seed 8 thủ tục hành chính cấp xã PHỔ BIẾN TOÀN QUỐC (tên thủ tục, giấy tờ
// cần nộp theo quy định chung — KHÔNG phải thông tin đặc thù của Trà Liên) để
// có nội dung khởi điểm cho trang "Danh mục TTHC". Đây CHỈ LÀ MẪU — cán bộ xã
// cần vào AdminWeb (mục "Thủ tục hành chính") kiểm tra, sửa thời gian xử lý/
// giấy tờ/link nộp cho đúng thực tế xã Trà Liên trước khi công bố chính thức.
// An toàn để chạy lại nhiều lần: xoá hết rồi seed lại (không phải dữ liệu
// công dân, không sợ mất dữ liệu thật khi re-run).
const mongoose = require("mongoose");
const config = require("../src/config");
const ThuTucHanhChinh = require("../src/models/ThuTucHanhChinh");

const DVCQG = "https://dichvucong.gov.vn";

const ITEMS = [
  {
    tenThuTuc: "Đăng ký khai sinh",
    linhVuc: "Tư pháp - Hộ tịch",
    mucDo: "4",
    thoiGianXuLy: "Trong ngày làm việc",
    giayToCanNop:
      "Tờ khai đăng ký khai sinh (theo mẫu)\nGiấy chứng sinh (hoặc giấy tờ thay thế)\nCCCD/hộ chiếu của cha, mẹ\nGiấy chứng nhận kết hôn (nếu có)",
    linkNopTrucTuyen: DVCQG,
    order: 1,
  },
  {
    tenThuTuc: "Đăng ký kết hôn",
    linhVuc: "Tư pháp - Hộ tịch",
    mucDo: "4",
    thoiGianXuLy: "Trong ngày làm việc",
    giayToCanNop: "Tờ khai đăng ký kết hôn (theo mẫu)\nCCCD/hộ chiếu của hai bên nam, nữ",
    linkNopTrucTuyen: DVCQG,
    order: 2,
  },
  {
    tenThuTuc: "Đăng ký khai tử",
    linhVuc: "Tư pháp - Hộ tịch",
    mucDo: "4",
    thoiGianXuLy: "Trong ngày làm việc",
    giayToCanNop:
      "Tờ khai đăng ký khai tử (theo mẫu)\nGiấy báo tử (hoặc giấy tờ thay thế)\nCCCD của người đi khai tử",
    linkNopTrucTuyen: DVCQG,
    order: 3,
  },
  {
    tenThuTuc: "Chứng thực bản sao từ bản chính",
    linhVuc: "Tư pháp - Hộ tịch",
    mucDo: "3",
    thoiGianXuLy: "Trong ngày làm việc (hồ sơ nhiều bản có thể hẹn ngày khác)",
    giayToCanNop: "Bản chính giấy tờ cần chứng thực\nBản chụp giấy tờ cần chứng thực",
    order: 4,
  },
  {
    tenThuTuc: "Chứng thực chữ ký",
    linhVuc: "Tư pháp - Hộ tịch",
    mucDo: "3",
    thoiGianXuLy: "Trong ngày làm việc",
    giayToCanNop: "CCCD/hộ chiếu của người yêu cầu chứng thực\nGiấy tờ, văn bản cần chứng thực chữ ký",
    order: 5,
  },
  {
    tenThuTuc: "Xác nhận tình trạng hôn nhân",
    linhVuc: "Tư pháp - Hộ tịch",
    mucDo: "4",
    thoiGianXuLy: "Tối đa 3 ngày làm việc",
    giayToCanNop: "Tờ khai xác nhận tình trạng hôn nhân (theo mẫu)\nCCCD/hộ chiếu của người yêu cầu",
    linkNopTrucTuyen: DVCQG,
    order: 6,
  },
  {
    tenThuTuc: "Cấp giấy phép xây dựng nhà ở riêng lẻ",
    linhVuc: "Đất đai - Xây dựng",
    mucDo: "4",
    thoiGianXuLy: "Tối đa 15 ngày làm việc",
    giayToCanNop:
      "Đơn đề nghị cấp giấy phép xây dựng\nGiấy tờ chứng minh quyền sử dụng đất\nBản vẽ thiết kế xây dựng",
    linkNopTrucTuyen: DVCQG,
    order: 7,
  },
  {
    tenThuTuc: "Xác nhận hộ nghèo, hộ cận nghèo",
    linhVuc: "Lao động - Xã hội",
    mucDo: "3",
    thoiGianXuLy: "Theo đợt rà soát hộ nghèo hằng năm của xã",
    giayToCanNop: "Đơn đề nghị (theo mẫu)\nCCCD/hộ khẩu của chủ hộ",
    order: 8,
  },
];

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");

  const count = await ThuTucHanhChinh.countDocuments();
  if (count > 0) {
    console.log(`ThuTucHanhChinh đã có ${count} bản ghi, bỏ qua (xoá tay trong AdminWeb nếu muốn seed lại).`);
  } else {
    await ThuTucHanhChinh.insertMany(
      ITEMS.map((it) => ({
        ...it,
        ghiChu: "Nội dung mẫu — cán bộ xã cần kiểm tra, cập nhật cho đúng thực tế trước khi công bố.",
      }))
    );
    console.log(`Seeded ${ITEMS.length} thủ tục hành chính (mẫu).`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
