import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header } from "zmp-ui";
import Icon from "../components/icon.jsx";
import { SERVICE_CATEGORIES } from "../data/services.js";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";

const STEPS = [
  "Chọn dịch vụ cần thực hiện bên dưới",
  "Đăng nhập bằng tài khoản VNeID hoặc CCCD",
  "Điền thông tin và nộp hồ sơ trực tuyến",
  "Nhận kết quả qua bưu điện hoặc tải về",
];

const ServicesPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [services, setServices] = useState([]);
  const [portalLinks, setPortalLinks] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/app-links?section=service`)
      .then((res) => res.json())
      .then((data) => setServices(data.items || []))
      .catch(() => setServices([]));

    fetch(`${API_BASE_URL}/api/public/app-links?section=portal`)
      .then((res) => res.json())
      .then((data) => setPortalLinks(data.items || []))
      .catch(() => setPortalLinks([]));
  }, []);

  const filteredServices = services.filter(
    (service) => activeCategory === "all" || service.type === activeCategory
  );

  return (
    <Page className="page-services">
      <Header title="Dịch vụ công" />

      <div className="services-hero">
        <h1 className="services-hero__title">
          Dịch vụ công
          <br />
          trực tuyến
        </h1>
        <p className="services-hero__desc">
          Thủ tục hành chính xã Trà Liên · nộp hồ sơ 24/7
        </p>
        <div className="services-hero__badges">
          <div className="services-hero__badge">
            <b className="services-hero__badge-value services-hero__badge-value--mint">
              100%
            </b>
            <span className="services-hero__badge-label">Mức độ 4</span>
          </div>
          <div className="services-hero__badge">
            <b className="services-hero__badge-value services-hero__badge-value--amber">
              24/7
            </b>
            <span className="services-hero__badge-label">Trực tuyến</span>
          </div>
          <div className="services-hero__badge">
            <b className="services-hero__badge-value">{services.length}</b>
            <span className="services-hero__badge-label">Nhóm dịch vụ</span>
          </div>
        </div>
      </div>

      <div className="services-steps">
        <div className="services-steps__head">
          <Icon name="tips_and_updates" className="i18 amber" />
          {STEPS.length} bước nộp hồ sơ trực tuyến
        </div>
        {STEPS.map((step, index) => (
          <div className="services-steps__step" key={step}>
            <span className="services-steps__step-n">{index + 1}</span>
            <span className="services-steps__step-t">{step}</span>
          </div>
        ))}
      </div>

      <div className="category-tabs">
        {SERVICE_CATEGORIES.map((category) => (
          <button
            key={category.key}
            type="button"
            className={activeCategory === category.key ? "is-active" : ""}
            onClick={() => setActiveCategory(category.key)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="service-list">
        {filteredServices.map((service) => {
          const Tag = service.path ? "button" : "div";
          return (
            <Tag
              key={service._id}
              type={service.path ? "button" : undefined}
              className="service-list__item"
              onClick={service.path ? () => navigate(service.path) : undefined}
            >
              <span className={`tile tile-${service.color || "b"}`}>
                <Icon name={service.icon} className="i22" />
              </span>
              <h3 className="service-list__title">{service.label}</h3>
              <span
                className={`service-list__badge service-list__badge--${service.type}`}
              >
                <Icon
                  name={service.type === "online" ? "cloud_done" : "storefront"}
                  className="i12"
                />
                {service.type === "online" ? "Trực tuyến" : "Trực tiếp"}
              </span>
            </Tag>
          );
        })}
      </div>

      <div className="sec-head">
        <span className="sec-title">
          <Icon name="hub" className="i19 blue" />Cổng dịch vụ công
        </span>
      </div>
      <div className="listcard">
        {portalLinks.map((link) => (
          <button
            key={link._id}
            type="button"
            className="prow"
            onClick={() =>
              link.path ? navigate(link.path) : openExternal(link.href)
            }
            disabled={!link.path && !link.href}
          >
            <span className={`tile sm tile-${link.color || "b"}`}>
              <Icon name={link.icon} className="i20" />
            </span>
            <span className="prow__body">
              <span className="prow__title">
                {link.label}
                {link.badge && (
                  <em className="prow__badge">{link.badge}</em>
                )}
              </span>
              <span className="prow__desc">{link.description}</span>
            </span>
            <Icon name="chevron_right" className="i18 grey" />
          </button>
        ))}
      </div>
    </Page>
  );
};

export default ServicesPage;
