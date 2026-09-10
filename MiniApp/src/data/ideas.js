export const IDEA_FIELDS = [
  "Y tế - Sức khỏe",
  "Hạ tầng - Giao thông",
  "Giáo dục",
  "Môi trường",
  "Nông nghiệp",
  "Khác",
];

export const IDEA_STATS = {
  total: 0,
  done: 0,
  inProgress: 0,
};

// TODO: dữ liệu mẫu - thay bằng dữ liệu thật khi có backend lưu trữ hiến kế
const IDEAS = [
  {
    id: 1,
    field: "Hạ tầng - Giao thông",
    status: "Đang triển khai",
    title: "Lắp đèn chiếu sáng tuyến đường liên thôn",
    content:
      "Đề xuất lắp thêm đèn chiếu sáng đoạn đường liên thôn để đảm bảo an toàn giao thông ban đêm.",
    author: "Người dân",
    date: "01/07/2026",
    likes: 0,
  },
];

export default IDEAS;
