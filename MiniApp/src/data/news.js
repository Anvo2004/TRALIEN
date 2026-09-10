// Danh sách tĩnh dùng làm dự phòng ban đầu cho useNews() (xem use-news.js) —
// khi backend (/api/public/news) có dữ liệu thật thì danh sách này bị thay thế.
// Trống cho tới khi có tin tức Trà Liên thật (chạy `node scripts/scrape-tralien.js`
// sau khi điền SOURCE_URL, hoặc nhập tay qua AdminWeb).
const NEWS = [];

export default NEWS;
