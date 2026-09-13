import React from "react";
import Icon from "./icon.jsx";

const NoticeCard = ({ notice, onClick }) => {
  const clickable = typeof onClick === "function";

  return (
    <div
      className="notice-card"
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      style={clickable ? { cursor: "pointer" } : undefined}
    >
      <span className={`tile sm tile-${notice.iconColor || "p"}`}>
        <Icon name={notice.icon || "campaign"} className="i19" />
      </span>
      <div className="notice-card__body">
        <div className="notice-card__title">{notice.title}</div>
        <div className="notice-card__content">{notice.content}</div>
      </div>
      {clickable && <span className="notice-card__chevron">›</span>}
    </div>
  );
};

export default NoticeCard;
