import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNavigation } from "zmp-ui";

// "Hiến kế" tạm ẩn khỏi điều hướng — trang /hien-ke chưa có backend lưu dữ
// liệu thật (bấm gửi chỉ alert() rồi mất), để dân bấm vào sẽ tưởng đã gửi
// thành công nhưng không ai nhận được. Route/trang vẫn còn trong code, chỉ bỏ
// lối vào cho tới khi nối API thật.
const TABS = [
  { key: "/", label: "Trang chủ", icon: "🏠" },
  { key: "/dich-vu", label: "Dịch vụ", icon: "🏛️" },
  { key: "/lien-he", label: "Liên hệ", icon: "☎️" },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <div className="layout__content">{children}</div>
      <BottomNavigation
        fixed
        activeKey={location.pathname}
        onChange={(key) => navigate(key)}
      >
        {TABS.map((tab) => (
          <BottomNavigation.Item
            key={tab.key}
            itemKey={tab.key}
            label={tab.label}
            icon={<span className="layout__tab-icon">{tab.icon}</span>}
          />
        ))}
      </BottomNavigation>
    </div>
  );
};

export default Layout;
