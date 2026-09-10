import React, { useEffect, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";

function formatDate(iso, fallbackStr = "") {
  if (!iso) return fallbackStr ? fallbackStr.split(" ")[1] || fallbackStr : "";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return fallbackStr;
  }
}

function formatTime(iso, fallbackStr = "") {
  if (!iso) return fallbackStr ? fallbackStr.split(" ")[0] || fallbackStr : "";
  try {
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    return fallbackStr;
  }
}

function formatDateTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    return String(iso);
  }
}

// Job đồng bộ chạy mỗi 30 phút — quá lâu không chạy (VD: 3 tiếng) là dấu hiệu
// pipeline (GitHub Actions relay hoặc cron VPS) đã ngừng hoạt động, không phải
// đơn giản là "không có lịch cắt điện nào".
const STALE_SYNC_HOURS = 3;

const LichCupDienPage = () => {
  const [stations, setStations] = useState([]);
  const [station, setStation] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const search = () => {
    const params = new URLSearchParams();
    if (station !== "all") params.set("station", station);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    setLoading(true);
    setError("");
    fetch(`${API_BASE_URL}/api/public/lich-cup-dien?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setError("Không thể tải dữ liệu lịch cắt điện. Vui lòng thử lại sau."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/lich-cup-dien/tram`)
      .then((res) => res.json())
      .then((data) => {
        setStations(data.stations || []);
        setLastSyncedAt(data.lastSyncedAt || null);
      })
      .catch(() => setStations([]));

    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page className="page-lookup">
      <Header title="Lịch cắt điện" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon">⚡</span>
        <div className="lookup-hero__title">Lịch cắt điện</div>
        <div className="lookup-hero__desc">
          Thông tin lịch tạm ngừng cung cấp điện trên địa bàn xã Trà Liên (nguồn: EVN CPC)
        </div>
      </div>

      <Box className="section">
        <div className="dien-filter">
          <select
            className="dien-filter__select"
            value={station}
            onChange={(e) => setStation(e.target.value)}
          >
            <option value="all">Tất cả trạm</option>
            {stations.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="dien-filter__dates">
            <label>
              Từ ngày
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label>
              Đến ngày
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
          </div>

          <button type="button" className="dien-filter__submit" onClick={search}>
            🔍 Tìm kiếm
          </button>
        </div>

        {lastSyncedAt && (
          <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
            Cập nhật lần cuối: {formatDateTime(lastSyncedAt)}
            {(Date.now() - new Date(lastSyncedAt).getTime()) / 3600000 > STALE_SYNC_HOURS && (
              <div className="warning-box">
                ⚠️ Dữ liệu có thể chưa được cập nhật gần đây. Vui lòng gọi Điện lực để xác nhận
                trước khi dựa vào lịch này.
              </div>
            )}
          </div>
        )}

        {loading && <div className="lookup-empty">Đang tải...</div>}
        {!loading && error && <div className="lookup-empty">{error}</div>}
        {!loading && !error && (
          <div className="dien-list">
            {items.map((item) => (
              <div key={item._id} className="dien-card">
                <div className="dien-card__date">
                  <span className="dien-card__date-icon">📅</span>
                  {formatDate(item.fromDate, item.fromDateStr)}
                </div>
                <div className="dien-card__time">
                  🕐 {formatTime(item.fromDate, item.fromDateStr)} - {formatTime(item.toDate, item.toDateStr)}
                </div>
                <div className="dien-card__area">📍 {item.stationName}</div>
                <div className="dien-card__reason">Lý do: {item.reason || "Đang cập nhật"}</div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="lookup-empty">Không tìm thấy lịch cắt điện phù hợp.</div>
            )}
          </div>
        )}
      </Box>
    </Page>
  );
};

export default LichCupDienPage;
