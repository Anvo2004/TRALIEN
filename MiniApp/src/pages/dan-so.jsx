import React, { useEffect, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";

function fmt(n, opts) {
  if (n === null || n === undefined) return null;
  return n.toLocaleString("vi-VN", opts);
}

const DanSoPage = () => {
  const [danSo, setDanSo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/dan-so`)
      .then((res) => res.json())
      .then((data) => setDanSo(data || {}))
      .catch(() => setDanSo({}))
      .finally(() => setLoading(false));
  }, []);

  const DAN_SO = danSo;
  const matDo =
    DAN_SO.tongDanSo && DAN_SO.dienTichKm2
      ? fmt(DAN_SO.tongDanSo / DAN_SO.dienTichKm2, { maximumFractionDigits: 1 })
      : null;

  if (loading) {
    return (
      <Page className="page-lookup">
        <Header title="Thông tin dân số" />
        <div className="lookup-empty">Đang tải...</div>
      </Page>
    );
  }

  return (
    <Page className="page-lookup">
      <Header title="Thông tin dân số" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon">👥</span>
        <div className="lookup-hero__title">Thông tin Dân số</div>
        <div className="lookup-hero__desc">
          Số liệu thống kê dân số xã Trà Liên
        </div>
      </div>

      <Box className="section">
        <div className="section__title">📊 Tổng quan dân số</div>
        <div className="pop-stats">
          <div className="pop-stats__card">
            <span className="pop-stats__icon pop-stats__icon--blue">👥</span>
            <div>
              <div className="pop-stats__value">
                {fmt(DAN_SO.tongDanSo)} <small>người</small>
              </div>
              <div className="pop-stats__label">Tổng dân số</div>
            </div>
          </div>

          <div className="pop-stats__card">
            <span className="pop-stats__icon pop-stats__icon--orange">📐</span>
            <div>
              <div className="pop-stats__value">
                {fmt(DAN_SO.dienTichKm2)} <small>km²</small>
              </div>
              <div className="pop-stats__label">Diện tích</div>
            </div>
          </div>

          <div className="pop-stats__card">
            <span className="pop-stats__icon pop-stats__icon--purple">🏘️</span>
            <div>
              <div className="pop-stats__value">
                {matDo ? (
                  <>
                    {matDo} <small>ng/km²</small>
                  </>
                ) : (
                  "Đang cập nhật"
                )}
              </div>
              <div className="pop-stats__label">Mật độ DS</div>
            </div>
          </div>

          <div className="pop-stats__card">
            <span className="pop-stats__icon pop-stats__icon--pink">📁</span>
            <div>
              <div className="pop-stats__value">
                {DAN_SO.soThon ? fmt(DAN_SO.soThon) : "Đang cập nhật"}
              </div>
              <div className="pop-stats__label">Số thôn</div>
            </div>
          </div>

          <div className="pop-stats__card pop-stats__card--full">
            <span className="pop-stats__icon pop-stats__icon--teal">📍</span>
            <div>
              <div className="pop-stats__value">Đà Nẵng</div>
              <div className="pop-stats__label">Thành phố</div>
            </div>
          </div>
        </div>
      </Box>

      <Box className="section">
        <div className="section__title">⚧ Cơ cấu giới tính</div>
        {DAN_SO.gioiTinh ? (
          <div className="gender-split">
            <div className="gender-split__row">
              <div className="gender-split__col">
                <div className="gender-split__value gender-split__value--male">
                  {Math.round((DAN_SO.gioiTinh.nam / DAN_SO.tongDanSo) * 100)}%
                </div>
                <div className="gender-split__label">🧑 Nam giới</div>
                <div className="gender-split__count">
                  {fmt(DAN_SO.gioiTinh.nam)} người
                </div>
              </div>
              <div className="gender-split__divider" />
              <div className="gender-split__col">
                <div className="gender-split__value gender-split__value--female">
                  {Math.round((DAN_SO.gioiTinh.nu / DAN_SO.tongDanSo) * 100)}%
                </div>
                <div className="gender-split__label">👩 Nữ giới</div>
                <div className="gender-split__count">
                  {fmt(DAN_SO.gioiTinh.nu)} người
                </div>
              </div>
            </div>
            <div className="gender-split__bar">
              <div
                className="gender-split__bar-male"
                style={{
                  width: `${(DAN_SO.gioiTinh.nam / DAN_SO.tongDanSo) * 100}%`,
                }}
              />
              <div
                className="gender-split__bar-female"
                style={{
                  width: `${(DAN_SO.gioiTinh.nu / DAN_SO.tongDanSo) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="lookup-empty">
            📭 Chưa có số liệu cơ cấu giới tính. UBND xã sẽ cập nhật khi có thống kê
            chính thức.
          </div>
        )}
      </Box>

      <Box className="section">
        <div className="section__title">📅 Cơ cấu độ tuổi</div>
        {DAN_SO.doTuoi ? (
          <div className="age-structure">
            {DAN_SO.doTuoi.map((g) => (
              <div className="age-structure__row" key={g.label}>
                <div className="age-structure__label">{g.label}</div>
                <div className="age-structure__track">
                  <div
                    className="age-structure__fill"
                    style={{ width: `${g.percent}%` }}
                  />
                </div>
                <div className="age-structure__percent">{g.percent}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lookup-empty">
            📭 Chưa có số liệu cơ cấu độ tuổi. UBND xã sẽ cập nhật khi có thống kê
            chính thức.
          </div>
        )}
      </Box>
    </Page>
  );
};

export default DanSoPage;
