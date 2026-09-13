import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "zmp-ui";
import Icon from "../components/icon.jsx";
import StatsRow from "../components/stats-row.jsx";
import QuickLinksGrid from "../components/quick-links-grid.jsx";
import NewsCard from "../components/news-card.jsx";
import ZaloOACard from "../components/zalo-oa-card.jsx";
import NoticeCard from "../components/notice-card.jsx";
import API_BASE_URL from "../data/api-config.js";
import useNews from "../data/use-news.js";
import SITE from "../data/site.js";
import logo from "../static/logo-tralien.png";
import bannerPortal from "../static/banner-tralien-portal.jpg";

const HomePage = () => {
  const navigate = useNavigate();
  const news = useNews();

  const [siteInfo, setSiteInfo] = useState({});
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/site-info`)
      .then((res) => res.json())
      .then((data) => setSiteInfo(data || {}))
      .catch(() => setSiteInfo({}));

    fetch(`${API_BASE_URL}/api/public/thong-bao`)
      .then((res) => res.json())
      .then((data) => setNotices((data.items || []).slice(0, 2)))
      .catch(() => setNotices([]));
  }, []);

  const contact = siteInfo.contact || {};
  const digitalTransform = siteInfo.digitalTransform || {};

  const newsTagColors = ["b", "g", "p"];

  return (
    <Page className="page-home">
      <div className="home-hero">
        <span className="home-hero__blob home-hero__blob--mint" />
        <span className="home-hero__blob home-hero__blob--amber" />
        <div className="home-hero__top">
          <div className="home-hero__logo">
            <img src={logo} alt="Quốc huy" />
          </div>
          <div>
            <h1 className="home-hero__title">{SITE.heroCaption}</h1>
            <p className="home-hero__subtitle">
              {SITE.province} · {SITE.badge}
            </p>
          </div>
        </div>
        <div className="home-hero__search">
          <div className="home-hero__search-input">
            <Icon name="search" className="i18 mint" />
            <input readOnly placeholder="Tìm dịch vụ, thủ tục, thông báo…" />
          </div>
          <button type="button" className="home-hero__qr" aria-label="Tạo mã QR">
            <Icon name="qr_code_scanner" className="i20" />
          </button>
        </div>
        <div className="home-hero__banner">
          <img src={bannerPortal} alt="Trang thông tin điện tử xã Trà Liên" />
        </div>
      </div>

      <StatsRow />

      <div className="sec-head">
        <span className="sec-title">
          <Icon name="bolt" className="i19 amber" />Tiện ích nhanh
        </span>
        <span className="sec-link">Tất cả</span>
      </div>
      <QuickLinksGrid />

      {(digitalTransform.title || digitalTransform.tags) && (
        <div className="digital-banner">
          <span className="digital-banner__icon">🚀</span>
          <div className="digital-banner__body">
            <div className="digital-banner__title">{digitalTransform.title}</div>
            <div className="digital-banner__tags">
              {(digitalTransform.tags || []).join(" • ")}
            </div>
          </div>
          <span className="digital-banner__arrow">›</span>
        </div>
      )}

      <div className="sec-head">
        <span className="sec-title">
          <Icon name="newspaper" className="i19 blue" />Tin tức mới nhất
        </span>
        <button type="button" className="sec-link" onClick={() => navigate("/tin-tuc")}>
          Xem thêm
        </button>
      </div>
      <div className="news-carousel">
        {news.slice(0, 4).map((item, index) => (
          <NewsCard
            key={item.id}
            item={{ ...item, tagColor: newsTagColors[index % newsTagColors.length] }}
            variant="carousel"
          />
        ))}
      </div>

      <ZaloOACard oa={siteInfo.zaloOA} />

      <div className="sec-head">
        <span className="sec-title">
          <Icon name="notifications_active" className="i19 pink" />Thông báo quan trọng
        </span>
      </div>
      <div className="notice-list">
        <NoticeCard
          notice={{
            icon: "headset_mic",
            iconColor: "b",
            title: "Cần hỗ trợ từ UBND xã?",
            content: `Hotline: ${contact.hotline}`,
          }}
          onClick={() => navigate("/lien-he")}
        />
        {notices.map((notice) => (
          <NoticeCard
            key={notice._id}
            notice={{
              icon: "warning",
              iconColor: "a",
              title: notice.title,
              content: notice.content,
            }}
          />
        ))}
      </div>
    </Page>
  );
};

export default HomePage;
