import React from "react";
import { Page, Header, Box } from "zmp-ui";
import SITE from "../data/site.js";
import { openExternal } from "../utils/open-external.js";
import logo from "../static/logo-tralien.png";

// Màn "Thông tin ứng dụng" — nơi đặt dòng ghi công bộ icon. Giấy phép miễn phí
// của Icons8 yêu cầu có link tới icons8.com ở nơi hiển thị icon; nếu xã mua
// gói Icons8 thì xoá khối "Bộ icon" bên dưới, phần còn lại giữ nguyên.
const CREDITS = [
  {
    label: "Bộ icon",
    value: "Icons8 — 3D Fluency",
    href: "https://icons8.com",
  },
  {
    label: "Bản đồ",
    value: "Cổng bản đồ TP Đà Nẵng",
    href: "https://bando.danang.gov.vn/",
  },
];

const ThongTinUngDungPage = () => (
  <Page className="page-about">
    <Header title="Thông tin ứng dụng" />

    <Box className="section">
      <div className="about-card">
        <img className="about-card__logo" src={logo} alt="" />
        <div className="about-card__name">{SITE.appName}</div>
        <div className="about-card__desc">
          Ứng dụng chính quyền số của UBND xã {SITE.heroCaption.replace(/^Xã\s+/, "")},{" "}
          {SITE.province}
        </div>
        <div className="about-card__version">Phiên bản 1.0.0</div>
      </div>

      <div className="about-block">
        <div className="about-block__title">Nguồn tư liệu & hình ảnh</div>
        {CREDITS.map((item) => (
          <button
            key={item.label}
            type="button"
            className="about-row"
            onClick={() => openExternal(item.href)}
          >
            <span className="about-row__label">{item.label}</span>
            <span className="about-row__value">{item.value}</span>
          </button>
        ))}
      </div>

      <p className="about-note">
        Mọi góp ý về ứng dụng xin gửi qua mục Phản ánh hoặc liên hệ trực tiếp
        UBND xã.
      </p>
    </Box>
  </Page>
);

export default ThongTinUngDungPage;
