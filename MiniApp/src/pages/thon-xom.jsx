import React, { useEffect, useMemo, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";

function fmt(n) {
  if (n === null || n === undefined) return null;
  return n.toLocaleString("vi-VN");
}

const ThonXomPage = () => {
  const [keyword, setKeyword] = useState("");
  const [thonXom, setThonXom] = useState([]);
  const [danSo, setDanSo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/thon-xom`)
      .then((res) => res.json())
      .then((data) => setThonXom(data.items || []))
      .catch(() => setThonXom([]))
      .finally(() => setLoading(false));

    fetch(`${API_BASE_URL}/api/public/dan-so`)
      .then((res) => res.json())
      .then((data) => setDanSo(data || {}))
      .catch(() => setDanSo({}));
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return thonXom;
    return thonXom.filter(
      (t) =>
        t.ten.toLowerCase().includes(kw) ||
        (t.biThu || "").toLowerCase().includes(kw) ||
        (t.thonTruong || "").toLowerCase().includes(kw) ||
        (t.matTran || "").toLowerCase().includes(kw)
    );
  }, [keyword, thonXom]);

  return (
    <Page className="page-lookup">
      <Header title="Thôn xóm" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon">🏘️</span>
        <div className="lookup-hero__title">Thôn xóm</div>
        <div className="lookup-hero__desc">Danh sách thôn thuộc xã Trà Liên</div>

        <div className="lookup-hero__stats">
          <div className="lookup-hero__stat">
            <div className="lookup-hero__stat-value">
              {thonXom.length > 0 ? thonXom.length : "—"}
            </div>
            <div className="lookup-hero__stat-label">Thôn</div>
          </div>
          <div className="lookup-hero__stat">
            <div className="lookup-hero__stat-value">
              {danSo.hoDan ? fmt(danSo.hoDan) : "—"}
            </div>
            <div className="lookup-hero__stat-label">Hộ khẩu</div>
          </div>
          <div className="lookup-hero__stat">
            <div className="lookup-hero__stat-value">{fmt(danSo.tongDanSo) ?? "—"}</div>
            <div className="lookup-hero__stat-label">Nhân khẩu</div>
          </div>
        </div>
      </div>

      <Box className="section">
        <input
          className="lookup-search"
          placeholder="Tìm thôn, bí thư, thôn trưởng..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        {loading ? (
          <div className="lookup-empty">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="lookup-empty">
            📭{" "}
            {thonXom.length === 0
              ? "Chưa có dữ liệu thôn xóm. UBND xã sẽ cập nhật danh sách trong thời gian tới."
              : `Không tìm thấy thôn phù hợp với "${keyword.trim()}".`}
          </div>
        ) : (
          <div className="village-list">
            {filtered.map((t) => (
              <div className="village-card" key={t._id || t.ten}>
                <span className="village-card__icon">🏘️</span>
                <div className="village-card__body">
                  <div className="village-card__title">{t.ten}</div>
                  <div className="village-card__meta">
                    <span>
                      <b>Bí thư:</b> {t.biThu || "Đang cập nhật"}
                    </span>
                    <span>
                      <b>Thôn trưởng:</b> {t.thonTruong || "Đang cập nhật"}
                    </span>
                    <span>
                      <b>TBCT Mặt trận:</b> {t.matTran || "Đang cập nhật"}
                    </span>
                    {t.soHo != null && <span>🏠 {fmt(t.soHo)} hộ</span>}
                    {t.danSo != null && <span>👥 {fmt(t.danSo)} người</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Box>
    </Page>
  );
};

export default ThonXomPage;
