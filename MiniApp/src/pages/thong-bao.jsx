import React, { useEffect, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";
import {
  TRO_CAP_CATEGORIES,
  statusOf,
  statusColor,
  weekday,
  ddmm,
} from "../data/tro-cap-categories.js";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const NOW = new Date();
const YEARS = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];

function fmtNumber(n) {
  return (n || 0).toLocaleString("vi-VN");
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const ThongBaoPage = () => {
  const [tab, setTab] = useState("tro-cap");

  // ===== Trợ cấp xã hội (tra cứu theo tháng/năm) =====
  const [thang, setThang] = useState(NOW.getMonth() + 1);
  const [nam, setNam] = useState(NOW.getFullYear());
  const [troCapFilter, setTroCapFilter] = useState("all");
  const [troCapItems, setTroCapItems] = useState([]);
  const [troCapSearched, setTroCapSearched] = useState(false);
  const [troCapLoading, setTroCapLoading] = useState(false);
  const [troCapError, setTroCapError] = useState("");

  const searchTroCap = (overrideThang, overrideNam) => {
    const m = overrideThang ?? thang;
    const y = overrideNam ?? nam;
    setTroCapLoading(true);
    setTroCapError("");
    fetch(`${API_BASE_URL}/api/public/tro-cap?thang=${m}&nam=${y}`)
      .then((res) => res.json())
      .then((data) => {
        setTroCapItems(data.items || []);
        setTroCapFilter("all");
        setTroCapSearched(true);
      })
      .catch(() => setTroCapError("Có lỗi xảy ra, vui lòng thử lại"))
      .finally(() => setTroCapLoading(false));
  };

  const goRecentMonth = () => {
    const m = NOW.getMonth() + 1;
    const y = NOW.getFullYear();
    setThang(m);
    setNam(y);
    searchTroCap(m, y);
  };

  const filteredTroCap =
    troCapFilter === "all"
      ? troCapItems
      : troCapItems.filter((x) => x.loaiTroCap === troCapFilter);

  const people = troCapItems.reduce((s, x) => s + (x.soLuong || 0), 0);
  const money = troCapItems.reduce((s, x) => s + (x.soTien || 0), 0);
  const bankCount = troCapItems.filter((x) => x.hinhThuc === "bank").length;
  const bankPct = troCapItems.length ? Math.round((bankCount / troCapItems.length) * 100) : 0;

  const chipDefs = [
    { key: "all", label: "Tất cả", color: "#8b5cf6" },
    ...Object.entries(TRO_CAP_CATEGORIES).map(([key, c]) => ({
      key,
      label: c.shortLabel,
      color: c.color,
    })),
  ];

  // ===== Thông báo khác =====
  const [noticeList, setNoticeList] = useState([]);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [noticeError, setNoticeError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/thong-bao`)
      .then((res) => res.json())
      .then((data) => setNoticeList(data.items || []))
      .catch(() => setNoticeError("Không thể tải thông báo. Vui lòng thử lại sau."))
      .finally(() => setNoticeLoading(false));
  }, []);

  return (
    <Page className="page-lookup">
      <Header title="Thông báo" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon">🔔</span>
        <div className="lookup-hero__title">Thông báo</div>
        <div className="lookup-hero__desc">
          Thông báo nhận tiền trợ cấp xã hội hàng tháng và các thông báo khác của xã
        </div>
      </div>

      <Box className="section">
        <div className="tabs-underline">
          <button
            type="button"
            className={tab === "tro-cap" ? "is-active" : ""}
            onClick={() => setTab("tro-cap")}
          >
            💰 Trợ cấp xã hội
          </button>
          <button
            type="button"
            className={tab === "khac" ? "is-active" : ""}
            onClick={() => setTab("khac")}
          >
            📢 Thông báo khác
          </button>
        </div>

        {tab === "tro-cap" && (
          <div className="trocap-lookup">
            <div className="trocap-search">
              <div className="trocap-search__label">📅 CHỌN THÁNG / NĂM</div>
              <div className="trocap-search__row">
                <select value={thang} onChange={(e) => setThang(Number(e.target.value))}>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
                <select value={nam} onChange={(e) => setNam(Number(e.target.value))}>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="trocap-search__submit"
                disabled={troCapLoading}
                onClick={() => searchTroCap()}
              >
                {troCapLoading ? "Đang tìm kiếm..." : "🔍 Tra cứu lịch chi trả"}
              </button>
            </div>

            {troCapError && <div className="lookup-empty">{troCapError}</div>}

            {troCapSearched && !troCapLoading && (
              <>
                <div className="trocap-summary">
                  Có <b>{troCapItems.length}</b> lịch chi trả trong tháng {thang}/{nam}
                </div>

                <div className="trocap-stats">
                  <div className="trocap-stats__card">
                    <div className="trocap-stats__icon" style={{ background: "#8b5cf6" }}>
                      👥
                    </div>
                    <div className="trocap-stats__value">{fmtNumber(people)}</div>
                    <div className="trocap-stats__label">đối tượng</div>
                  </div>
                  <div className="trocap-stats__card">
                    <div className="trocap-stats__icon" style={{ background: "#10b981" }}>
                      🏦
                    </div>
                    <div className="trocap-stats__value">
                      {(money / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}
                      <small>tr</small>
                    </div>
                    <div className="trocap-stats__label">tổng kinh phí</div>
                  </div>
                  <div className="trocap-stats__card">
                    <div className="trocap-stats__icon" style={{ background: "#3b82f6" }}>
                      💳
                    </div>
                    <div className="trocap-stats__value">
                      {bankPct}
                      <small>%</small>
                    </div>
                    <div className="trocap-stats__label">qua tài khoản</div>
                  </div>
                </div>

                <div className="trocap-chips">
                  {chipDefs.map((c) => {
                    const cnt =
                      c.key === "all"
                        ? troCapItems.length
                        : troCapItems.filter((x) => x.loaiTroCap === c.key).length;
                    const active = troCapFilter === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        className={`trocap-chips__item ${active ? "is-active" : ""}`}
                        onClick={() => setTroCapFilter(c.key)}
                      >
                        <span className="trocap-chips__dot" style={{ background: c.color }} />
                        {c.label}
                        <span className="trocap-chips__count">{cnt}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {troCapLoading && <div className="lookup-empty">Đang tải...</div>}

            {troCapSearched && !troCapLoading && troCapItems.length === 0 && (
              <div className="trocap-empty">
                <div className="trocap-empty__icon">📆</div>
                <h3>Chưa có lịch chi trả</h3>
                <p>
                  Chưa có lịch chi trả nào được công bố cho tháng {thang}/{nam}. Vui lòng chọn
                  tháng khác.
                </p>
                <button type="button" className="trocap-empty__btn" onClick={goRecentMonth}>
                  ↻ Xem tháng gần nhất
                </button>
              </div>
            )}

            {troCapSearched && !troCapLoading && filteredTroCap.length > 0 && (
              <div className="trocap-result-list">
                {filteredTroCap.map((item) => {
                  const cat = TRO_CAP_CATEGORIES[item.loaiTroCap] || TRO_CAP_CATEGORIES.baotro;
                  const status = statusOf(item.ngayChiTra);
                  const ss = statusColor(status);
                  const bank = item.hinhThuc === "bank";
                  return (
                    <div key={item._id} className="trocap-result-card">
                      <div
                        className="trocap-result-card__stripe"
                        style={{ background: cat.color }}
                      />
                      <div className="trocap-result-card__head">
                        <div
                          className="trocap-result-card__icon"
                          style={{ background: cat.color }}
                        >
                          {cat.icon}
                        </div>
                        <div className="trocap-result-card__title">{cat.label}</div>
                        <span
                          className="trocap-result-card__status"
                          style={{ background: ss.bg, color: ss.color }}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="trocap-result-card__body">
                        <div className="trocap-result-card__date" style={{ color: cat.ink, background: cat.soft }}>
                          <div className="trocap-result-card__date-dd">{ddmm(item.ngayChiTra)}</div>
                          <div className="trocap-result-card__date-wd">{weekday(item.ngayChiTra)}</div>
                        </div>
                        <div className="trocap-result-card__info">
                          <div>
                            📍 {item.diaDiem}
                            {item.khungGio ? ` · ${item.khungGio}` : ""}
                          </div>
                          <div>
                            👥 {fmtNumber(item.soLuong)} {item.donVi}
                          </div>
                        </div>
                      </div>

                      <div className="trocap-result-card__footer">
                        <div>
                          <div className="trocap-result-card__money-label">Kinh phí chi trả</div>
                          <div className="trocap-result-card__money" style={{ color: cat.ink }}>
                            {fmtNumber(item.soTien)} <small>đ</small>
                          </div>
                        </div>
                        <span className={`trocap-result-card__method ${bank ? "is-bank" : ""}`}>
                          {bank ? "💳 Qua tài khoản" : "💵 Tiền mặt"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "khac" && (
          <div className="news-list">
            {noticeLoading && <div className="lookup-empty">Đang tải...</div>}
            {!noticeLoading && noticeError && <div className="lookup-empty">{noticeError}</div>}
            {!noticeLoading &&
              !noticeError &&
              noticeList.map((item) => (
                <div key={item._id} className="news-card news-card--compact">
                  <div className="news-card__image">📢</div>
                  <div className="news-card__body">
                    <div className="news-card__title news-card__title--small">{item.title}</div>
                    <div className="news-card__summary">{item.content}</div>
                    <div className="news-card__meta">
                      <span className="news-card__date">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            {!noticeLoading && !noticeError && noticeList.length === 0 && (
              <div className="lookup-empty">Hiện chưa có thông báo nào khác.</div>
            )}
          </div>
        )}
      </Box>
    </Page>
  );
};

export default ThongBaoPage;
