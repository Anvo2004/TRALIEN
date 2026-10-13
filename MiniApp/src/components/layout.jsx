import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon3, { Icons3DDefs } from "./ns/ns-icons3d.jsx";

// "Hiến kế" tạm ẩn khỏi điều hướng — trang /hien-ke chưa có backend lưu dữ
// liệu thật (bấm gửi chỉ alert() rồi mất), để dân bấm vào sẽ tưởng đã gửi
// thành công nhưng không ai nhận được. Route/trang vẫn còn trong code, chỉ bỏ
// lối vào cho tới khi nối API thật.
const TABS = [
  {
    key: "/",
    label: "Trang chủ",
    icon: (
      <>
        <path className="ns-t" d="M4 11l8-6.5 8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
        <path d="M10 20.5v-5h4v5" />
      </>
    ),
  },
  {
    key: "/dich-vu",
    label: "Dịch vụ",
    icon: (
      <>
        <rect className="ns-t" x="4" y="4" width="6.5" height="6.5" rx="1.8" />
        <rect className="ns-t" x="13.5" y="4" width="6.5" height="6.5" rx="1.8" />
        <rect className="ns-t" x="4" y="13.5" width="6.5" height="6.5" rx="1.8" />
        <rect className="ns-t" x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" />
      </>
    ),
  },
  // Nút giữa nổi to: Gửi phản ánh — chức năng dùng nhiều nhất, luôn trong tầm tay.
  { key: "/phan-anh", label: "Phản ánh", center: true },
  {
    key: "/lien-he",
    label: "Liên hệ",
    icon: (
      <path
        className="ns-t"
        d="M6.6 3.5h2.7l1.4 3.9-1.8 1.2a11 11 0 0 0 5.5 5.5l1.2-1.8 3.9 1.4v2.7a1.8 1.8 0 0 1-2 1.8A15.5 15.5 0 0 1 4.8 5.5a1.8 1.8 0 0 1 1.8-2z"
      />
    ),
  },
  {
    key: "/cong-dan",
    label: "Công dân",
    also: ["/tich-diem"],
    icon: (
      <>
        <circle className="ns-t" cx="12" cy="8" r="3.8" />
        <path className="ns-t" d="M4.5 20c.6-4 3.6-6 7.5-6s6.9 2 7.5 6z" />
      </>
    ),
  },
];

// Thanh tab kính mờ nổi, ô sáng trượt theo tab đang chọn (bản thiết kế "Nông Sơn
// Số", port sang Trà Liên — xem .claude/rules nếu cần đối chiếu nguồn). 5 ô:
// Trang chủ · Dịch vụ · [Phản ánh — nút tròn nổi giữa] · Liên hệ · Công dân. Ở
// các trang con (không thuộc tab nào) ô sáng ẩn đi, không đánh dấu nhầm tab.
const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeIndex = TABS.findIndex(
    (t) => t.key === location.pathname || (t.also || []).includes(location.pathname)
  );

  return (
    <div className="layout">
      <Icons3DDefs />
      <div className="layout__content">{children}</div>
      <nav className="ns-bar" aria-label="Điều hướng chính">
        <div className="ns-tabs" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
          <div
            className="ns-ind"
            style={{
              width: `${100 / TABS.length}%`,
              transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`,
              // Nút Phản ánh ở giữa tự nổi bật — không trượt ô sáng xuống dưới nó.
              opacity: activeIndex < 0 || TABS[activeIndex]?.center ? 0 : 1,
            }}
          >
            <i />
          </div>
          {TABS.map((tab, i) =>
            tab.center ? (
              <button
                key={tab.key}
                type="button"
                className={`ns-tab ns-fab ${i === activeIndex ? "ns-on" : ""}`}
                onClick={() => navigate(tab.key)}
                aria-label="Gửi phản ánh"
              >
                <span className="ns-fab__btn">
                  <Icon3 name="mega" />
                </span>
                <span className="ns-fab__lb">{tab.label}</span>
              </button>
            ) : (
              <button
                key={tab.key}
                type="button"
                className={`ns-tab ${i === activeIndex ? "ns-on" : ""}`}
                onClick={() => navigate(tab.key)}
              >
                <svg className="ns-sv" viewBox="0 0 24 24" width="25" height="25" aria-hidden="true">
                  {tab.icon}
                </svg>
                <span>{tab.label}</span>
              </button>
            )
          )}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
