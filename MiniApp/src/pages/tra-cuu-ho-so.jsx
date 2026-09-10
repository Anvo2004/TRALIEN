import React, { useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Màu badge theo trạng thái (đồng bộ với card của Đại Lộc)
function statusColor(trangThai) {
  const t = (trangThai || "").toLowerCase();
  if (t.includes("đã trả") || t.includes("trả kết quả")) return "#2196F3";
  if (t.includes("từ chối") || t.includes("không được")) return "#f44336";
  if (t.includes("đang xử lý") || t.includes("đang thụ lý")) return "#FF9800";
  if (t.includes("đã tiếp nhận") || t.includes("chờ xử lý")) return "#4CAF50";
  return "#9E9E9E";
}

const TraCuuHoSoPage = () => {
  const [maHoSo, setMaHoSo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dossiers, setDossiers] = useState(null); // null = chưa tra, [] = không tìm thấy

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = maHoSo.trim();
    if (!code) return;

    setLoading(true);
    setError("");
    setDossiers(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/public/tra-cuu-ho-so?ma_ho_so=${encodeURIComponent(code)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không tra cứu được hồ sơ. Vui lòng thử lại sau.");
        return;
      }
      setDossiers(data.dossiers || []);
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page className="page-lookup">
      <Header title="Tra cứu hồ sơ TTHC" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon">📊</span>
        <div className="lookup-hero__title">Tra cứu hồ sơ TTHC</div>
        <div className="lookup-hero__desc">
          Kiểm tra tiến độ xử lý hồ sơ thủ tục hành chính đã nộp tại xã Trà Liên
        </div>
      </div>

      <Box className="section">
        <form className="lookup-form" onSubmit={handleSubmit}>
          <label>
            🔢 Mã hồ sơ *
            <input
              value={maHoSo}
              onChange={(e) => setMaHoSo(e.target.value)}
              placeholder="Nhập mã hồ sơ trên biên nhận (VD: H01.99-250101-0001)"
              required
            />
          </label>
          <button type="submit" className="lookup-form__submit" disabled={loading}>
            {loading ? "Đang tra cứu..." : "Tra cứu"}
          </button>
        </form>

        {error && <div className="warning-box">⚠️ {error}</div>}

        {dossiers && dossiers.length === 0 && !error && (
          <div className="lookup-empty">
            📭 Không tìm thấy hồ sơ với mã <strong>{maHoSo.trim()}</strong>. Vui lòng kiểm tra
            lại mã trên biên nhận.
          </div>
        )}

        {dossiers && dossiers.length > 0 && (
          <div className="hoso-results">
            {dossiers.map((d, i) => (
              <div className="hoso-card" key={d.maHoSo || i}>
                <div className="hoso-card__head">
                  <span className="hoso-card__code">{d.maHoSo || "—"}</span>
                  <span
                    className="hoso-card__badge"
                    style={{ background: statusColor(d.tenTrangThai) }}
                  >
                    {d.tenTrangThai || "—"}
                  </span>
                </div>
                <table className="hoso-card__table">
                  <tbody>
                    {d.tenChuHoSo && (
                      <tr>
                        <td className="hoso-card__label">Chủ hồ sơ</td>
                        <td>{d.tenChuHoSo}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="hoso-card__label">Tên dịch vụ</td>
                      <td>{d.tenTTHC || "—"}</td>
                    </tr>
                    <tr>
                      <td className="hoso-card__label">Đơn vị xử lý</td>
                      <td>{d.donViXuLy || "—"}</td>
                    </tr>
                    <tr>
                      <td className="hoso-card__label">Ngày tiếp nhận</td>
                      <td>{formatDate(d.ngayTiepNhan)}</td>
                    </tr>
                    <tr>
                      <td className="hoso-card__label">Hạn giải quyết</td>
                      <td>{formatDate(d.hanGiaiQuyet)}</td>
                    </tr>
                    <tr>
                      <td className="hoso-card__label">Ngày trả kết quả</td>
                      <td>{formatDate(d.ngayTraKetQua)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Box>
    </Page>
  );
};

export default TraCuuHoSoPage;
