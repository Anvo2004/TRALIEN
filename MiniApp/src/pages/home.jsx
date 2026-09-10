import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Box, Text } from "zmp-ui";
import HeroCard from "../components/hero-card.jsx";
import Banner from "../components/banner.jsx";
import StatsRow from "../components/stats-row.jsx";
import QuickLinksGrid from "../components/quick-links-grid.jsx";
import NewsCard from "../components/news-card.jsx";
import ZaloOACard from "../components/zalo-oa-card.jsx";
import NoticeCard from "../components/notice-card.jsx";
import API_BASE_URL from "../data/api-config.js";
import useNews from "../data/use-news.js";

const HomePage = () => {
  const navigate = useNavigate();
  const news = useNews();
  const [firstNews, ...restNews] = news;

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

  return (
    <Page className="page-home">
      <HeroCard />
      <Banner />
      <StatsRow />

      <Box className="section">
        <Text.Title size="small" className="section__title">
          ⚡ Tiện ích nhanh
        </Text.Title>
        <QuickLinksGrid />
      </Box>

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

      <Box className="section">
        <div className="section__header">
          <Text.Title size="small" className="section__title">
            📰 Tin tức mới nhất
          </Text.Title>
          <button
            type="button"
            className="section__more"
            onClick={() => navigate("/tin-tuc")}
          >
            Xem thêm ›
          </button>
        </div>

        <div className="news-list">
          {firstNews && <NewsCard item={firstNews} featured />}
          {restNews.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </Box>

      <Box className="section">
        <ZaloOACard oa={siteInfo.zaloOA} />
      </Box>

      <Box className="section">
        <Text.Title size="small" className="section__title">
          📢 Thông báo quan trọng
        </Text.Title>
        <div className="notice-list">
          {notices.map((notice) => (
            <NoticeCard
              key={notice._id}
              notice={{ title: notice.title, content: notice.content }}
            />
          ))}
        </div>

        <div className="support-card">
          <div className="support-card__title">
            Cần hỗ trợ từ UBND xã?
          </div>
          <div className="support-card__row">
            <span>☎️</span>
            <a href={`tel:${contact.hotline}`} className="support-card__hotline">
              Hotline: {contact.hotline}
            </a>
          </div>
          <div className="support-card__address">
            Địa chỉ: {contact.address}
          </div>
          <button
            type="button"
            className="support-card__link"
            onClick={() => navigate("/lien-he")}
          >
            Chi tiết ›
          </button>
        </div>
      </Box>
    </Page>
  );
};

export default HomePage;
