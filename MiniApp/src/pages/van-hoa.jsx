import React, { useEffect, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";
import CardMedia from "../components/card-media.jsx";
import DetailSheet from "../components/detail-sheet.jsx";
import { openExternal } from "../utils/open-external.js";

const VanHoaPage = () => {
  const [vanHoa, setVanHoa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/van-hoa`)
      .then((res) => res.json())
      .then((data) => setVanHoa(data || {}))
      .catch(() => setVanHoa({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Page className="page-culture">
        <Header title="Văn hóa - Nghệ thuật" />
        <div className="lookup-empty">Đang tải...</div>
      </Page>
    );
  }

  const VAN_HOA = vanHoa || {};
  const hoatDong = Array.isArray(VAN_HOA.hoatDong) ? VAN_HOA.hoatDong : [];
  const diSan = Array.isArray(VAN_HOA.diSan) ? VAN_HOA.diSan : [];
  const diemNoiBat = Array.isArray(VAN_HOA.diemNoiBat) ? VAN_HOA.diemNoiBat : [];
  const tinTuc = Array.isArray(VAN_HOA.tinTuc) ? VAN_HOA.tinTuc : [];

  return (
    <Page className="page-culture">
      <Header title="Văn hóa - Nghệ thuật" />

      <div className="culture-hero">
        <span className="culture-hero__icon">🏯</span>
        <div className="culture-hero__title">{VAN_HOA.title}</div>
        <div className="culture-hero__desc">{VAN_HOA.subtitle}</div>
      </div>

      {/* Hoạt động văn hóa */}
      <Box className="section">
        <div className="section__title">⭐ Hoạt động văn hóa</div>
        <div className="culture-activities">
          {hoatDong.map((act) => (
            <button
              key={act.id}
              type="button"
              className="culture-act-card"
              onClick={() => setSelected(act)}
            >
              <div className="culture-act-card__icon-box">
                <CardMedia item={act} fallback={<span>{act.icon}</span>} />
              </div>
              <div className="culture-act-card__title">{act.title}</div>
              <div className="culture-act-card__desc">{act.desc}</div>
            </button>
          ))}
        </div>
      </Box>

      {/* Di sản văn hóa được công nhận */}
      <Box className="section">
        <div className="section__title">🏅 Di sản văn hóa được công nhận</div>
        <div className="heritage-list">
          {diSan.map((item) => (
            <button
              key={item.id}
              type="button"
              className="heritage-item"
              onClick={() => setSelected(item)}
            >
              <div className="heritage-item__icon-badge">
                <CardMedia item={item} fallback={<span>{item.icon}</span>} />
              </div>
              <div className="heritage-item__content">
                <div className="heritage-item__title">{item.title}</div>
                <div className="heritage-item__subtitle">{item.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
      </Box>

      {/* Điểm văn hóa - tâm linh nổi bật */}
      <Box className="section">
        <div className="culture-spots-container">
          <div className="culture-spots-container__title">
            🏔️ Điểm văn hóa - tâm linh nổi bật
          </div>
          <div className="culture-spots-grid">
            {diemNoiBat.map((spot) => (
              <button
                key={spot.id}
                type="button"
                className="culture-spot-btn"
                onClick={() => setSelected(spot)}
              >
                <span className="culture-spot-btn__icon">
                  <CardMedia item={spot} fallback={<span>{spot.icon}</span>} />
                </span>
                <span className="culture-spot-btn__name">{spot.name}</span>
              </button>
            ))}
          </div>
        </div>
      </Box>

      {/* Tin tức văn hóa */}
      <Box className="section">
        <div className="section__title">📰 Tin tức văn hóa</div>
        <div className="culture-news-list">
          {tinTuc.map((news) => {
            const clickable = Boolean(news.link);
            return (
              <div
                key={news.id}
                className="culture-news-card"
                onClick={clickable ? () => openExternal(news.link) : undefined}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                style={clickable ? { cursor: "pointer" } : undefined}
              >
                <div className="culture-news-card__banner">
                  <CardMedia item={news} fallback={<div className="culture-news-card__ph">🏛️</div>} />
                </div>
                <div className="culture-news-card__body">
                  <div className="culture-news-card__meta">
                    <span className="culture-news-card__tag">{news.tag}</span>
                    <span className="culture-news-card__date">{news.date}</span>
                  </div>
                  <div className="culture-news-card__title">{news.title}</div>
                  <div className="culture-news-card__summary">{news.summary}</div>
                  <div className="culture-news-card__source">
                    📰 {news.source}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Box>

      <DetailSheet item={selected} fallbackIcon="🏯" onClose={() => setSelected(null)} />
    </Page>
  );
};

export default VanHoaPage;
