import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "./icon.jsx";
import tabHome from "../static/icons/tab-home.png";
import tabServices from "../static/icons/tab-services.png";
import tabContact from "../static/icons/tab-contact.png";
import tabCitizen from "../static/icons/tab-citizen.png";

// Tab bar dùng icon 3D (Icons8) thay icon tuyến đơn sắc. Ở 26px chi tiết 3D
// dễ bị rối, nên để sau cờ này: đổi về false là quay lại icon vector cũ ngay,
// không phải sửa thêm chỗ nào khác.
const USE_3D_TABS = true;

// "Hiến kế" tạm ẩn khỏi điều hướng — trang /hien-ke chưa có backend lưu dữ
// liệu thật (bấm gửi chỉ alert() rồi mất), để dân bấm vào sẽ tưởng đã gửi
// thành công nhưng không ai nhận được. Route/trang vẫn còn trong code, chỉ bỏ
// lối vào cho tới khi nối API thật.
// `also`: route con vẫn sáng tab cha (vd. /tich-diem thuộc tab Công dân).
const TABS = [
  { key: "/", label: "Trang chủ", icon: "home", img: tabHome },
  { key: "/dich-vu", label: "Dịch vụ", icon: "grid_view", img: tabServices },
  { key: "/lien-he", label: "Liên hệ", icon: "call", img: tabContact },
  {
    key: "/cong-dan",
    label: "Công dân",
    icon: "badge",
    img: tabCitizen,
    also: ["/tich-diem"],
  },
];

// Nav tự viết thay zmp-ui BottomNavigation — cần kiểu "icon active nằm trong
// khung gradient thương hiệu" mà component có sẵn của zmp-ui không hỗ trợ.
// Vẫn giữ đúng 3 route + hành vi điều hướng cũ, chỉ đổi phần trình bày.
const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <div className="layout__content">{children}</div>
      <nav className={`bottom-nav${USE_3D_TABS ? " bottom-nav--3d" : ""}`}>
        {TABS.map((tab) => {
          const active =
            location.pathname === tab.key || (tab.also || []).includes(location.pathname);
          return (
            <button
              key={tab.key}
              type="button"
              className={`bottom-nav__item ${active ? "is-active" : ""}`}
              onClick={() => navigate(tab.key)}
            >
              <span className="bottom-nav__icon">
                {USE_3D_TABS ? (
                  <img src={tab.img} alt="" className="icon3d icon3d--tab" />
                ) : (
                  <Icon name={tab.icon} className="i23" />
                )}
              </span>
              <span className="bottom-nav__label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
