import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header } from "zmp-ui";
import Icon from "../components/icon.jsx";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";
import logo from "../static/logo-tralien.png";

// Suy ra trạng thái "đang làm việc" từ chuỗi workHours dạng
// "Thứ 2 - Thứ 6 · 07:30-11:30, 13:30-17:00". Trả về null nếu không tách
// được khung giờ — khi đó KHÔNG hiển thị badge, tránh báo sai giờ làm việc
// cho người dân (an toàn hơn là đoán bừa).
function getOpenStatus(workHours) {
  if (!workHours) return null;
  const ranges = [...workHours.matchAll(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/g)];
  if (!ranges.length) return null;

  const day = new Date().getDay(); // 0 = CN
  if (day === 0 || day === 6) return { open: false };

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const [, h1, m1, h2, m2] of ranges) {
    const start = Number(h1) * 60 + Number(m1);
    const end = Number(h2) * 60 + Number(m2);
    if (nowMinutes >= start && nowMinutes <= end) {
      return { open: true, closeLabel: `${h2.padStart(2, "0")}:${m2}` };
    }
  }
  return { open: false };
}

// Bản đồ số Đà Nẵng, lọc sẵn theo địa giới xã Trà Liên — cùng URL đã dùng ở
// quick-link "Bản đồ" trên Trang chủ (data/quick-links.js). Nhúng iframe thay
// vì mở tab ngoài để dân thấy ngay vị trí UBND xã trong tab Liên hệ.
const WARD_MAP_URL = "https://bando.danang.gov.vn/?ward=Tr%C3%A0%20Li%C3%AAn";

const ContactPage = () => {
  const navigate = useNavigate();
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
  const openStatus = getOpenStatus(c.workHours);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    c.address || ""
  )}`;

  return (
    <Page className="page-contact">
      <Header title="Liên hệ" />

      <div className="contact-hero">
        <h1 className="contact-hero__title">Liên hệ &amp; Hỗ trợ</h1>
        <p className="contact-hero__desc">
          {c.officeName || "UBND xã Trà Liên"} · Thành phố Đà Nẵng
        </p>
      </div>

      <div className="contact-card">
        <div className="contact-card__head">
          <div className="contact-card__crest">
            <img src={logo} alt="Logo xã Trà Liên" />
          </div>
          <div>
            <div className="contact-card__name">{c.officeName}</div>
            {openStatus && (
              <div
                className={`contact-card__open ${
                  openStatus.open ? "" : "contact-card__open--closed"
                }`}
              >
                <i />
                {openStatus.open
                  ? `Đang làm việc · đến ${openStatus.closeLabel}`
                  : "Ngoài giờ làm việc"}
              </div>
            )}
          </div>
        </div>

        <div className="contact-card__row">
          <span className="tile xs tile-p">
            <Icon name="location_on" className="i18" />
          </span>
          <span className="contact-card__body">
            <div className="contact-card__key">Địa chỉ</div>
            <div className="contact-card__value">{c.address}</div>
          </span>
        </div>

        <div className="contact-card__row">
          <span className="tile xs tile-b">
            <Icon name="language" className="i18" />
          </span>
          <span className="contact-card__body">
            <div className="contact-card__key">Website</div>
            <button
              type="button"
              className="contact-card__value contact-card__value--link"
              onClick={() => openExternal(`https://${c.website}`)}
            >
              {c.website}
            </button>
          </span>
          <Icon name="north_east" className="i17 grey contact-card__action" />
        </div>

        <div className="contact-card__row">
          <span className="tile xs tile-g">
            <Icon name="mail" className="i18" />
          </span>
          <span className="contact-card__body">
            <div className="contact-card__key">Email</div>
            <div className="contact-card__value">{c.email}</div>
          </span>
          <Icon name="content_copy" className="i17 grey contact-card__action" />
        </div>

        <div className="contact-card__row">
          <span className="tile xs tile-a">
            <Icon name="schedule" className="i18" />
          </span>
          <span className="contact-card__body">
            <div className="contact-card__key">Giờ làm việc</div>
            <div className="contact-card__value contact-card__value--pre">
              {c.workHours}
            </div>
          </span>
        </div>

        <a className="contact-card__call" href={`tel:${c.hotline}`}>
          <Icon name="call" className="i20" />Gọi ngay {c.hotline}
        </a>
        {c.hotline2 && (
          <a className="contact-card__call2" href={`tel:${c.hotline2}`}>
            <Icon name="call" className="i16" />Hoặc gọi số {c.hotline2}
          </a>
        )}
      </div>

      {c.policeStation?.address && (
        <div className="listcard">
          <div className="contact-card__row" style={{ paddingTop: 4 }}>
            <span className="tile xs tile-b">
              <Icon name="local_police" className="i18" />
            </span>
            <span className="contact-card__body">
              <div className="contact-card__key">
                {c.policeStation.name || "Công an xã"}
              </div>
              <div className="contact-card__value">
                {c.policeStation.address}
              </div>
            </span>
          </div>
          {c.policeStation.phone && (
            <a
              className="contact-card__row"
              style={{
                paddingBottom: 4,
                textDecoration: "none",
                color: "inherit",
              }}
              href={`tel:${c.policeStation.phone}`}
            >
              <span className="tile xs tile-p">
                <Icon name="call" className="i18" />
              </span>
              <span className="contact-card__body">
                <div className="contact-card__key">Điện thoại trực ban</div>
                <div className="contact-card__value">
                  {c.policeStation.phone}
                </div>
              </span>
              <Icon name="call" className="i17 green contact-card__action" />
            </a>
          )}
        </div>
      )}

      <div className="sec-head">
        <span className="sec-title">
          <Icon name="support_agent" className="i19 green" />Kênh hỗ trợ nhanh
        </span>
      </div>
      <div className="service-list">
        <div className="service-list__item">
          <span className="tile tile-b">
            <Icon name="forum" className="i21" />
          </span>
          <h3 className="service-list__title">Zalo OA</h3>
          <p className="service-list__desc">Chat trực tiếp với cán bộ xã</p>
        </div>
        <button
          type="button"
          className="service-list__item"
          onClick={() => navigate("/phan-anh")}
        >
          <span className="tile tile-o">
            <Icon name="campaign" className="i21" />
          </span>
          <h3 className="service-list__title">Gửi phản ánh</h3>
          <p className="service-list__desc">Kèm ảnh, vị trí hiện tại</p>
        </button>
        <button
          type="button"
          className="service-list__item"
          onClick={() => navigate("/tro-ly-so")}
        >
          <span className="tile tile-v">
            <Icon name="smart_toy" className="i21" />
          </span>
          <h3 className="service-list__title">Hỏi đáp AI</h3>
          <p className="service-list__desc">Giải đáp thủ tục 24/7</p>
        </button>
      </div>

      <div className="mapcard">
        <div className="mapcard__img">
          <iframe
            className="mapcard__iframe"
            src={WARD_MAP_URL}
            title="Bản đồ vị trí UBND xã Trà Liên"
            loading="lazy"
          />
        </div>
        <div className="mapcard__row">
          <Icon name="location_on" className="i20 pink" />
          <span className="mapcard__address">{c.address}</span>
          <a
            className="pill-soft"
            href={mapsHref}
            onClick={(e) => {
              e.preventDefault();
              openExternal(mapsHref);
            }}
          >
            Chỉ đường
          </a>
        </div>
      </div>
    </Page>
  );
};

export default ContactPage;
