import React from "react";
import SITE from "../data/site.js";
import logo from "../static/logo-tralien.png";

const HeroCard = () => {
  return (
    <div className="hero-card">
      <img className="hero-card__logo" src={logo} alt="Quốc huy" />
      <div className="hero-card__info">
        <div className="hero-card__title">{SITE.appName}</div>
        <div className="hero-card__subtitle">{SITE.province}</div>
      </div>
      <div className="hero-card__badge">
        <span>🌐</span> {SITE.badge}
      </div>
    </div>
  );
};

export default HeroCard;
