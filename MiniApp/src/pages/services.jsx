import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "zmp-ui";
import Icon from "../components/icon.jsx";
import { SERVICE_CATEGORIES } from "../data/services.js";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";
import { nsTone } from "../components/ns/ns-icons.jsx";
import Glyph, { name3 } from "../components/ns/ns-glyph.jsx";
import { HeroSceneSmall } from "../components/ns/ns-scenes.jsx";
import { css } from "../components/ns/ns-util.js";
import SITE from "../data/site.js";

// Giao diện port từ Mini App Nông Sơn; dữ liệu giữ nguyên của Trà Liên
// (app-links section=service/portal từ MongoDB, không phải "guide" động như
// Nông Sơn — xem ghi chú ở pages/cong-dan.jsx về site.js tĩnh thay useSite()).
// Icon trong DB là tên Material cũ (vd. "campaign") — quy sang icon 3D mới
// nếu có bảng ánh xạ (ns-glyph.jsx), còn tên lạ (cán bộ tự thêm) thì rơi về
// icon phẳng cũ, không vỡ layout.
const IconBox = ({ name }) =>
  name3(name) ? (
    <Glyph name={name} sm />
  ) : (
    <span className="ns-ic ns-sm">
      <Icon name={name} className="i22" />
    </span>
  );

const STEPS = [
  "Chọn dịch vụ cần thực hiện bên dưới",
  "Đăng nhập bằng tài khoản VNeID hoặc CCCD",
  "Điền thông tin và nộp hồ sơ trực tuyến",
  "Nhận kết quả qua bưu điện hoặc tải về",
];

const ServicesPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
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

  const shown = services.filter((s) => filter === "all" || s.type === filter);
  const fi = SERVICE_CATEGORIES.findIndex((f) => f.key === filter);

  return (
    <Page className="ns-page">
      <div className="ns-root">
        <div className="ns-scr">
          <div
            className="ns-hero"
            style={css("height:276px;padding:24px 20px 0;background:linear-gradient(180deg,#0F5A3A 0%,#1E8A57 58%,#7BC99A 100%)")}
          >
            <div className="ns-dots" />
            <HeroSceneSmall />
            <div style={css("position:relative;display:flex;align-items:center;gap:8px;color:#DDF1E3;font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase")}>
              <span className="ns-live" />Dịch vụ công
            </div>
            <h1 style={css("position:relative;margin:10px 0 0;max-width:250px;font-size:30px;font-weight:800;letter-spacing:-.025em;line-height:1.1;color:#fff")}>
              Dịch vụ công trực tuyến
            </h1>
            <p style={css("position:relative;margin:10px 0 0;font-size:13px;font-weight:500;color:#DDF1E3")}>
              Thủ tục hành chính {SITE.heroCaption.toLowerCase()} · nộp hồ sơ 24/7
            </p>
            <div style={css("position:relative;margin-top:16px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px")}>
              <div className="ns-glass" style={css("border-radius:18px;padding:11px 12px")}>
                <div className="ns-num" style={css("color:#8AD6F7;font-size:20px")}>100%</div>
                <div style={css("font-size:11.5px;font-weight:500;color:#DDF1E3")}>Mức độ 4</div>
              </div>
              <div className="ns-glass" style={css("border-radius:18px;padding:11px 12px")}>
                <div className="ns-num" style={css("color:#EDA91C;font-size:20px")}>24/7</div>
                <div style={css("font-size:11.5px;font-weight:500;color:#DDF1E3")}>Trực tuyến</div>
              </div>
              <div className="ns-glass" style={css("border-radius:18px;padding:11px 12px")}>
                <div className="ns-num" style={css("color:#fff;font-size:20px")}>{services.length || "—"}</div>
                <div style={css("font-size:11.5px;font-weight:500;color:#DDF1E3")}>Nhóm dịch vụ</div>
              </div>
            </div>
          </div>

          <div className="ns-card ns-rs" style={css("position:relative;z-index:2;margin:-12px 16px 0;padding:18px 18px 20px")}>
            <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:14px")}>
              <span className="ns-ic ns-xs ns-tn-gold">
                <svg className="ns-sv" viewBox="0 0 24 24" width="18" height="18">
                  <path className="ns-t" d="M12 3.5a5.5 5.5 0 0 0-3.2 10c.7.6 1.2 1.3 1.2 2.2V17h4v-1.3c0-.9.5-1.6 1.2-2.2a5.5 5.5 0 0 0-3.2-10z" />
                  <path d="M10 20.5h4" />
                </svg>
              </span>
              <h2 style={css("margin:0;font-size:16px;font-weight:800")}>{STEPS.length} bước nộp hồ sơ trực tuyến</h2>
            </div>
            <div style={css("position:relative;display:flex;flex-direction:column;gap:14px")}>
              <div className="ns-tl" />
              {STEPS.map((step, i) => (
                <div className="ns-step" key={step}>
                  <span className="ns-stn" style={i === STEPS.length - 1 ? css("background:#EDA91C;color:#3A2600") : undefined}>
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={css("padding:18px 16px 14px")}>
            <div className="ns-seg">
              <div className="ns-th" style={{ transform: `translateX(${Math.max(fi, 0) * 100}%)` }}><i /></div>
              {SERVICE_CATEGORIES.map((c) => (
                <button key={c.key} type="button" className={filter === c.key ? "ns-on" : ""} onClick={() => setFilter(c.key)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ns-st" style={css("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:0 16px")}>
            {shown.map((s) => {
              const Tag = s.path ? "button" : "div";
              return (
                <Tag
                  key={s._id}
                  type={s.path ? "button" : undefined}
                  className={`ns-svc ns-rs ns-tn-${nsTone(s.icon, "blue")}`}
                  onClick={s.path ? () => navigate(s.path) : undefined}
                >
                  <IconBox name={s.icon} />
                  <span className="ns-nm">{s.label}</span>
                  <span className={`ns-pill ${s.type === "online" ? "ns-on" : "ns-off"}`}>
                    <i />{s.type === "online" ? "Trực tuyến" : "Trực tiếp"}
                  </span>
                </Tag>
              );
            })}
          </div>

          <div style={css("display:flex;align-items:center;gap:10px;padding:26px 20px 12px")}>
            <span className="ns-ic ns-xs ns-tn-teal">
              <svg className="ns-sv" viewBox="0 0 24 24" width="18" height="18">
                <circle cx="12" cy="12" r="2.6" /><circle cx="5" cy="6" r="1.8" /><circle cx="19" cy="6" r="1.8" />
                <circle cx="5" cy="18" r="1.8" /><circle cx="19" cy="18" r="1.8" />
                <path d="M10 10.2L6.3 7.2M14 10.2l3.7-3M10 13.8l-3.7 3M14 13.8l3.7 3" />
              </svg>
            </span>
            <h2 style={css("margin:0;font-size:17px;font-weight:800;letter-spacing:-.01em")}>Cổng dịch vụ công</h2>
          </div>
          <div className="ns-card" style={css("margin:0 16px 110px;overflow:hidden")}>
            {portalLinks.map((link) => (
              <button
                key={link._id}
                type="button"
                className={`ns-row ns-tn-${nsTone(link.icon, "teal")}`}
                onClick={() => (link.path ? navigate(link.path) : openExternal(link.href))}
                disabled={!link.path && !link.href}
              >
                <IconBox name={link.icon} />
                <span style={css("flex:1;display:flex;flex-direction:column")}>
                  <span>
                    <span className="ns-nm">{link.label}</span>
                    {link.badge && <span className="ns-beta">{link.badge}</span>}
                  </span>
                  <span className="ns-sb">{link.description}</span>
                </span>
                <svg className="ns-sv" viewBox="0 0 24 24" width="18" height="18" style={css("color:#7F9686")}>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
};

export default ServicesPage;
