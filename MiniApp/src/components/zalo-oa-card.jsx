import React from "react";
import Icon from "./icon.jsx";

const ZaloOACard = ({ oa }) => {
  const name = oa?.name || "Zalo OA xã Trà Liên";
  const description = oa?.description || "Nhận thông báo, tin tức mới nhất từ chính quyền.";

  return (
    <div className="oa-card">
      <span className="oa-card__blob" />
      <div className="oa-card__icon">
        <Icon name="forum" className="i22 mint" />
      </div>
      <div className="oa-card__body">
        <div className="oa-card__title">Theo dõi {name}</div>
        <div className="oa-card__desc">{description}</div>
      </div>
      <button type="button" className="oa-card__button">
        Quan tâm
      </button>
    </div>
  );
};

export default ZaloOACard;
