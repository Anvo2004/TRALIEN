import React, { useEffect, useState } from "react";
import SITE from "../data/site.js";
import congSoImg from "../static/banner-cong-so.jpg";
import danangImg from "../static/banner-danang.jpg";

// Ảnh thật lấy từ tralien.danang.gov.vn (trụ sở UBND xã + TP. Đà Nẵng về đêm)
const SLIDES = [congSoImg, danangImg];

const Banner = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="banner">
      {SLIDES.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={SITE.heroCaption}
          className={`banner__image ${index === active ? "is-active" : ""}`}
        />
      ))}
      <div className="banner__caption">
        <span className="banner__caption-icon">📍</span>
        {SITE.heroCaption}
      </div>
      <div className="banner__dots">
        {SLIDES.map((src, index) => (
          <span
            key={src}
            className={`banner__dot ${index === active ? "is-active" : ""}`}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;
