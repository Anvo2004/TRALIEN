import React from "react";

const NoticeCard = ({ notice }) => {
  return (
    <div className={`notice-card notice-card--${notice.tone || "info"}`}>
      <span className="notice-card__icon">{notice.icon || "📢"}</span>
      <div>
        <div className="notice-card__title">{notice.title}</div>
        <div className="notice-card__content">{notice.content}</div>
      </div>
    </div>
  );
};

export default NoticeCard;
