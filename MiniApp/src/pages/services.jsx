import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header, Box } from "zmp-ui";
import SERVICES, {
  SERVICE_CATEGORIES,
  SERVICE_PORTAL_LINKS,
} from "../data/services.js";
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

  const filteredServices = SERVICES.filter(
    (service) => activeCategory === "all" || service.type === activeCategory
  );

  return (
    <Page className="page-services">
      <Header title="Dịch vụ công" />

      <div className="services-hero">
        <span className="services-hero__icon">🏛️</span>
        <div className="services-hero__title">Dịch vụ công</div>
        <div className="services-hero__desc">
          Thủ tục hành chính &amp; dịch vụ công trực tuyến xã Trà Liên
        </div>
        <div className="services-hero__badges">
          <div className="services-hero__badge">
            <div className="services-hero__badge-value">100%</div>
            <div className="services-hero__badge-label">Mức độ 4</div>
          </div>
          <div className="services-hero__badge">
            <div className="services-hero__badge-value">24/7</div>
            <div className="services-hero__badge-label">Trực tuyến</div>
          </div>
        </div>
      </div>

      <Box className="section">
        <div className="instruction-box">
          <div className="instruction-box__title">
            💡 Hướng dẫn sử dụng dịch vụ công trực tuyến
          </div>
          <ol className="instruction-box__list">
            {STEPS.map((step, index) => (
              <li key={step}>
                <span className="instruction-box__index">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="category-tabs">
          {SERVICE_CATEGORIES.map((category) => (
            <button
              key={category.key}
              type="button"
              className={`category-tabs__item ${
                activeCategory === category.key ? "is-active" : ""
              }`}
              onClick={() => setActiveCategory(category.key)}
            >
              {category.icon ? `${category.icon} ` : ""}
              {category.label}
            </button>
          ))}
        </div>

        <div className="service-list">
          {filteredServices.map((service) => {
            const Tag = service.path ? "button" : "div";
            return (
              <Tag
                key={service.title}
                type={service.path ? "button" : undefined}
                className="service-list__item"
                onClick={service.path ? () => navigate(service.path) : undefined}
              >
                <span className="service-list__icon">{service.icon}</span>
                <div className="service-list__title">{service.title}</div>
                <span
                  className={`service-list__badge service-list__badge--${service.type}`}
                >
                  {service.type === "online" ? "🌐 Trực tuyến" : "🏛️ Trực tiếp"}
                </span>
              </Tag>
            );
          })}
        </div>
      </Box>

      <Box className="section">
        <div className="section__title">🔗 Cổng dịch vụ công</div>
        <div className="portal-list">
          {SERVICE_PORTAL_LINKS.map((link) =>
            link.path ? (
              <button
                key={link.title}
                type="button"
                className="portal-list__item"
                onClick={() => navigate(link.path)}
              >
                <span className="portal-list__icon">{link.icon}</span>
                <div>
                  <div className="portal-list__title">
                    {link.title}
                    {link.badge && (
                      <span className="portal-list__badge">{link.badge}</span>
                    )}
                  </div>
                  <div className="portal-list__desc">{link.description}</div>
                </div>
                <span className="portal-list__arrow">›</span>
              </button>
            ) : (
              <button
                key={link.title}
                type="button"
                className="portal-list__item"
                onClick={() => openExternal(link.href)}
              >
                <span className="portal-list__icon">{link.icon}</span>
                <div>
                  <div className="portal-list__title">
                    {link.title}
                    {link.badge && (
                      <span className="portal-list__badge">{link.badge}</span>
                    )}
                  </div>
                  <div className="portal-list__desc">{link.description}</div>
                </div>
                <span className="portal-list__arrow">›</span>
              </button>
            )
          )}
        </div>
      </Box>
    </Page>
  );
};

export default ServicesPage;
