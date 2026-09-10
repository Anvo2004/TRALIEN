import { useEffect, useState } from "react";
import API_BASE_URL from "./api-config.js";
import STATIC_NEWS from "./news.js";

// Lấy tin tức từ backend (cào tralien.danang.gov.vn, ảnh re-host qua Cloudinary).
// Khởi tạo bằng danh sách tĩnh để có sẵn nội dung; nếu backend trả dữ liệu thì
// thay bằng dữ liệu mới. Lỗi/rỗng → giữ danh sách tĩnh làm dự phòng.
export default function useNews() {
  const [news, setNews] = useState(STATIC_NEWS);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/news`)
      .then((res) => res.json())
      .then((data) => {
        const items = (data.items || []).map((it) => ({
          id: it.nid,
          tag: it.tag || "Tin tức",
          title: it.title,
          date: it.date,
          summary: it.summary,
          source: it.source || "UBND xã Trà Liên",
          image: it.imageUrl || null,
          link: it.link,
        }));
        if (items.length > 0) setNews(items);
      })
      .catch(() => {
        /* giữ STATIC_NEWS làm dự phòng */
      });
  }, []);

  return news;
}
