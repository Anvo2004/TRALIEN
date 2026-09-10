import React from "react";
import { openExternal } from "../utils/open-external.js";

const NewsImage = ({ item, className }) => {
  if (item.image) {
    return <img className={className} src={item.image} alt={item.title} />;
  }
  return <div className={className}>🖼️</div>;
};

const NewsCard = ({ item, featured = false }) => {
  // Trong Zalo Mini App, <a target="_blank"> không mở được link ngoài — dùng
  // openWebview qua openExternal (van-ban.jsx cũng làm vậy).
  const clickProps = item.link
    ? {
        onClick: () => openExternal(item.link),
        onKeyDown: (e) => e.key === "Enter" && openExternal(item.link),
        role: "button",
        tabIndex: 0,
        style: { cursor: "pointer" },
      }
    : {};

  if (featured) {
    return (
      <div className="news-card news-card--featured" {...clickProps}>
        <NewsImage item={item} className="news-card__image news-card__image--large" />
        <div className="news-card__body">
          <div className="news-card__meta">
            <span className="news-card__tag">{item.tag}</span>
            <span className="news-card__date">{item.date}</span>
          </div>
          <div className="news-card__title">{item.title}</div>
          <div className="news-card__summary">{item.summary}</div>
          <div className="news-card__source">📰 {item.source}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-card news-card--compact" {...clickProps}>
      <NewsImage item={item} className="news-card__image" />
      <div className="news-card__body">
        <div className="news-card__title news-card__title--small">
          {item.title}
        </div>
        <div className="news-card__meta">
          <span className="news-card__tag">{item.tag}</span>
          <span className="news-card__date">{item.date}</span>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
