import React, { useEffect, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const now = new Date();
const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

const LOAI_HINH_LABELS = {
  kham_benh: "Khám bệnh",
  tiem_chung: "Tiêm chủng",
  khac: "Khác",
};

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return "";
  }
}

const LichYTePage = () => {
  const [thang, setThang] = useState(now.getMonth() + 1);
  const [nam, setNam] = useState(now.getFullYear());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const search = () => {
    setLoading(true);
    setError("");
    fetch(`${API_BASE_URL}/api/public/lich-y-te?thang=${thang}&nam=${nam}`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setError("Không thể tải dữ liệu lịch y tế. Vui lòng thử lại sau."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thang, nam]);

  return (
    <Page className="page-lookup">
      <Header title="Lịch y tế" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon">🏥</span>
        <div className="lookup-hero__title">Lịch y tế</div>
        <div className="lookup-hero__desc">Lịch khám bệnh, tiêm chủng trên địa bàn xã Trà Liên</div>
      </div>

      <Box className="section">
        <div className="dien-filter">
          <select
            className="dien-filter__select"
            value={thang}
            onChange={(e) => setThang(Number(e.target.value))}
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
          <select
            className="dien-filter__select"
            value={nam}
            onChange={(e) => setNam(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="lookup-empty">Đang tải...</div>}
        {!loading && error && <div className="lookup-empty">{error}</div>}
        {!loading && !error && (
          <div className="dien-list">
            {items.map((item) => (
              <div key={item._id} className="dien-card">
                <div className="dien-card__date">
                  <span className="dien-card__date-icon">📅</span>
                  {formatDate(item.ngayKham)}
                </div>
                {item.khungGio && <div className="dien-card__time">🕐 {item.khungGio}</div>}
                <div className="dien-card__area">📍 {item.diaDiem}</div>
                <div className="dien-card__reason">
                  {LOAI_HINH_LABELS[item.loaiHinh] || "Khám bệnh"}
                  {item.donViThucHien ? ` · ${item.donViThucHien}` : ""}
                </div>
                {item.doiTuong && <div className="dien-card__reason">👥 {item.doiTuong}</div>}
                {item.ghiChu && <div className="dien-card__reason">{item.ghiChu}</div>}
              </div>
            ))}
            {items.length === 0 && (
              <div className="lookup-empty">Không có lịch y tế trong tháng {thang}/{nam}.</div>
            )}
          </div>
        )}
      </Box>
    </Page>
  );
};

export default LichYTePage;
