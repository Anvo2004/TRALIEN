import React, { useEffect, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";
import CardMedia from "../components/card-media.jsx";
import DetailSheet from "../components/detail-sheet.jsx";

const DuLichPage = () => {
  const [duLich, setDuLich] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/du-lich`)
      .then((res) => res.json())
      .then((data) => setDuLich(data || {}))
      .catch(() => setDuLich({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Page className="page-tourism">
        <Header title="Du lịch - Danh thắng" />
        <div className="lookup-empty">Đang tải...</div>
      </Page>
    );
  }

  const DU_LICH = duLich || {};
  const diemNoiBat = Array.isArray(DU_LICH.diemNoiBat) ? DU_LICH.diemNoiBat : [];
  const diemThamQuan = Array.isArray(DU_LICH.diemThamQuan) ? DU_LICH.diemThamQuan : [];

  return (
    <Page className="page-tourism">
      <Header title="Du lịch - Danh thắng" />

      <div className="tourism-hero">
        <span className="tourism-hero__icon">⛰️</span>
        <div className="tourism-hero__title">{DU_LICH.title}</div>
        <div className="tourism-hero__desc">{DU_LICH.subtitle}</div>
      </div>

      {/* Điểm nổi bật */}
      <Box className="section">
        <div className="section__title">✨ Điểm nổi bật</div>
        <div className="tourism-highlights">
          {diemNoiBat.map((item) => (
            <button
              key={item.id}
              type="button"
              className="tourism-hl-card"
              onClick={() => setSelected(item)}
            >
              <div className="tourism-hl-card__icon-box">
                <CardMedia item={item} fallback={<span>{item.icon}</span>} />
              </div>
              <div className="tourism-hl-card__title">{item.title}</div>
              <div className="tourism-hl-card__subtitle">{item.subtitle}</div>
            </button>
          ))}
        </div>
      </Box>

      {/* Địa điểm tham quan */}
      <Box className="section">
        <div className="section__title">📍 Địa điểm tham quan</div>
        <div className="tourism-attractions">
          {diemThamQuan.map((spot) => (
            <button
              key={spot.id}
              type="button"
              className="tourism-spot-card"
              onClick={() => setSelected(spot)}
            >
              <div className="tourism-spot-card__img-wrapper">
                <CardMedia item={spot} fallback={<div className="tourism-spot-card__ph">🏔️</div>} />
              </div>
              <div className="tourism-spot-card__body">
                <div className="tourism-spot-card__title">{spot.title}</div>
                <div className="tourism-spot-card__desc">{spot.desc}</div>
                <div className="tourism-spot-card__location">
                  <span className="tourism-spot-card__pin">📍</span>
                  <span className="tourism-spot-card__address">
                    {spot.address}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Box>

      <DetailSheet item={selected} fallbackIcon="⛰️" onClose={() => setSelected(null)} />
    </Page>
  );
};

export default DuLichPage;
