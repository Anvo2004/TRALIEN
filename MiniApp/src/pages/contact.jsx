import React, { useEffect, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";

const ContactPage = () => {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/site-info`)
      .then((res) => res.json())
      .then((data) => setContact(data?.contact || {}))
      .catch(() => setContact({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Page className="page-contact">
        <Header title="Liên hệ" />
        <div className="lookup-empty">Đang tải...</div>
      </Page>
    );
  }

  const c = contact || {};

  return (
    <Page className="page-contact">
      <Header title="Liên hệ" />

      <div className="contact-hero">
        <div className="contact-hero__title">Liên hệ - Hỗ trợ</div>
        <div className="contact-hero__desc">
          Thông tin liên hệ UBND xã Trà Liên
        </div>
      </div>

      <Box className="section">
        <div className="office-card">
          <div className="office-card__title">🏛️ {c.officeName}</div>
          <div className="office-card__row">
            <span className="office-card__icon">📍</span>
            <div>
              <div className="office-card__label">Địa chỉ</div>
              <div className="office-card__value">{c.address}</div>
            </div>
          </div>
          <div className="office-card__row">
            <span className="office-card__icon">🌐</span>
            <div>
              <div className="office-card__label">Website</div>
              <button
                type="button"
                className="office-card__value office-card__value--link"
                onClick={() => openExternal(`https://${c.website}`)}
              >
                {c.website}
              </button>
            </div>
          </div>
          <div className="office-card__row">
            <span className="office-card__icon">🕒</span>
            <div>
              <div className="office-card__label">Giờ làm việc</div>
              <div className="office-card__value office-card__value--pre">
                {c.workHours}
              </div>
            </div>
          </div>
          <a className="office-card__call" href={`tel:${c.hotline}`}>
            📞 Gọi ngay: {c.hotline}
          </a>
        </div>
      </Box>
    </Page>
  );
};

export default ContactPage;
