import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Page, Header, Box } from "zmp-ui";
import HeroIcon from "../components/ns/hero-icon.jsx";
import { openExternal } from "../utils/open-external.js";

// Tra cứu hồ sơ TTHC không còn gọi IOCTC qua Backend của xã nữa — chuyển sang
// Cổng Dịch vụ công Quốc gia (.gov.vn, hợp lệ với chính sách kiểm duyệt Zalo).
// Trang này giữ lại để QR trên biên nhận (home-search.jsx) và đường dẫn cũ vẫn
// dẫn tới đúng nơi.
const DVC_URL = "https://dichvucong.gov.vn/tra-cuu-ho-so";

const TraCuuHoSoPage = () => {
  const location = useLocation();
  const maHoSo = location.state?.prefillMaHoSo || "";

  useEffect(() => {
    // Vào từ QR biên nhận: mở thẳng cổng, không bắt bấm thêm.
    if (maHoSo) openExternal(DVC_URL);
  }, [maHoSo]);

  return (
    <Page className="page-lookup">
      <Header title="Tra cứu hồ sơ TTHC" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon"><HeroIcon e="📊" /></span>
        <div className="lookup-hero__title">Tra cứu hồ sơ TTHC</div>
        <div className="lookup-hero__desc">
          Tra cứu tiến độ giải quyết hồ sơ trên Cổng Dịch vụ công Quốc gia
        </div>
      </div>

      <Box className="section">
        <div className="lookup-form">
          {maHoSo && (
            <p>
              Mã hồ sơ của bạn: <strong>{maHoSo}</strong>. Hãy nhập mã này vào ô tra cứu trên
              Cổng Dịch vụ công.
            </p>
          )}
          <button
            type="button"
            className="lookup-form__submit"
            onClick={() => openExternal(DVC_URL)}
          >
            Mở Cổng Dịch vụ công Quốc gia
          </button>
        </div>
      </Box>
    </Page>
  );
};

export default TraCuuHoSoPage;
