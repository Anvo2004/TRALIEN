import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "./icon.jsx";

// "Hiến kế" tạm ẩn khỏi điều hướng — trang /hien-ke chưa có backend lưu dữ
// liệu thật (bấm gửi chỉ alert() rồi mất), để dân bấm vào sẽ tưởng đã gửi
// thành công nhưng không ai nhận được. Route/trang vẫn còn trong code, chỉ bỏ
// lối vào cho tới khi nối API thật.
const TABS = [
  { key: "/", label: "Trang chủ", icon: "home" },
  { key: "/dich-vu", label: "Dịch vụ", icon: "grid_view" },
  { key: "/lien-he", label: "Liên hệ", icon: "call" },
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
      <nav className="bottom-nav">
        {TABS.map((tab) => {
          const active = location.pathname === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={`bottom-nav__item ${active ? "is-active" : ""}`}
              onClick={() => navigate(tab.key)}
            >
              <span className="bottom-nav__icon">
                <Icon name={tab.icon} className="i23" />
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
