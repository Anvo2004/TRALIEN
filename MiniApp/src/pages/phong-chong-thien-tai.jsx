import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header, Box } from "zmp-ui";
import PCTT_ITEMS from "../data/pctt.js";
import { openExternal } from "../utils/open-external.js";

const PhongChongThienTaiPage = () => {
  const navigate = useNavigate();
  const [notice, setNotice] = useState(false);

  const handleClick = (item) => {
    if (item.href) {
      openExternal(item.href);
    } else if (item.path) {
      navigate(item.path);
    } else {
      setNotice(true);
    }
  };

  return (
    <Page className="page-lookup">
      <Header title="Phòng chống thiên tai" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon">🌪️</span>
        <div className="lookup-hero__title">Phòng chống thiên tai</div>
        <div className="lookup-hero__desc">
          Thông tin, kỹ năng và cảnh báo phòng chống thiên tai cho người dân xã Trà Liên
        </div>
      </div>

      <Box className="section">
        <div className="quick-links">
          {PCTT_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className="quick-links__item"
              onClick={() => handleClick(item)}
            >
              <span className="quick-links__icon">{item.icon}</span>
              <span className="quick-links__label">{item.label}</span>
            </button>
          ))}
        </div>

        {notice && (
          <div className="warning-box">
            🚧 <strong>Tính năng đang được hoàn thiện</strong>
            <div>Vui lòng quay lại sau. Trong lúc chờ, bạn có thể xem "Kỹ năng PCTT" ở trên.</div>
          </div>
        )}
      </Box>
    </Page>
  );
};

export default PhongChongThienTaiPage;
