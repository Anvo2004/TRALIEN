import React, { useEffect, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";

const VAN_BAN_CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "quy-dinh", label: "Quy định" },
  { key: "chinh-sach", label: "Chính sách" },
  { key: "thong-bao", label: "Thông báo" },
];

const CATEGORY_LABEL = Object.fromEntries(VAN_BAN_CATEGORIES.map((c) => [c.key, c.label]));

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const VanBanPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (q.trim()) params.set("q", q.trim());

    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/public/van-ban?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setItems(data.items || []);
          setError("");
        })
        .catch(() => setError("Không thể tải danh sách văn bản. Vui lòng thử lại sau."))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [activeCategory, q]);

  return (
    <Page className="page-lookup">
      <Header title="Văn bản - Chính sách" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon">📜</span>
        <div className="lookup-hero__title">Văn bản - Chính sách</div>
        <div className="lookup-hero__desc">
          Tra cứu văn bản, quy định, chính sách mới ban hành của xã Trà Liên
        </div>
      </div>

      <Box className="section">
        <input
          className="lookup-search"
          placeholder="Tìm theo tên văn bản..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="category-tabs">
          {VAN_BAN_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`category-tabs__item ${activeCategory === cat.key ? "is-active" : ""}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading && <div className="lookup-empty">Đang tải...</div>}
        {!loading && error && <div className="lookup-empty">{error}</div>}
        {!loading && !error && (
          <div className="vanban-list">
            {items.map((item) => (
              <div
                key={item._id}
                className="vanban-card"
                role="button"
                tabIndex={0}
                onClick={() => openExternal(item.detailUrl)}
                onKeyDown={(e) => e.key === "Enter" && openExternal(item.detailUrl)}
              >
                <div className="vanban-card__meta">
                  <span className="vanban-card__tag">{CATEGORY_LABEL[item.category] || "Khác"}</span>
                  {item.ngayBanHanh && (
                    <span className="vanban-card__date">{formatDate(item.ngayBanHanh)}</span>
                  )}
                </div>
                <div className="vanban-card__title">{item.title}</div>
                {item.soHieu && (
                  <div className="vanban-card__footer">
                    <span>Số: {item.soHieu}</span>
                  </div>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="lookup-empty">Không tìm thấy văn bản phù hợp.</div>
            )}
          </div>
        )}
      </Box>
    </Page>
  );
};

export default VanBanPage;
