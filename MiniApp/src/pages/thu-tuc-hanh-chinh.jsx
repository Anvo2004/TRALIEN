import React, { useEffect, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";
import Icon from "../components/icon.jsx";

const MUC_DO_LABEL = { "3": "Mức độ 3", "4": "Mức độ 4 (trực tuyến toàn trình)" };

const ThuTucHanhChinhPage = () => {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());

    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/public/thu-tuc-hanh-chinh?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setItems(data.items || []);
          setError("");
        })
        .catch(() => setError("Không thể tải danh mục thủ tục. Vui lòng thử lại sau."))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [q]);

  return (
    <Page className="page-lookup">
      <Header title="Thủ tục hành chính" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon">📋</span>
        <div className="lookup-hero__title">Danh mục thủ tục hành chính</div>
        <div className="lookup-hero__desc">
          Xem trước giấy tờ cần chuẩn bị, thời gian xử lý trước khi đi làm thủ tục tại xã Trà Liên
        </div>
      </div>

      <Box className="section">
        <input
          className="lookup-search"
          placeholder="Tìm theo tên thủ tục, lĩnh vực..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {loading && <div className="lookup-empty">Đang tải...</div>}
        {!loading && error && <div className="lookup-empty">{error}</div>}
        {!loading && !error && (
          <div className="tthc-list">
            {items.map((item) => {
              const isOpen = openId === item._id;
              const giayTo = (item.giayToCanNop || "")
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);
              return (
                <div
                  key={item._id}
                  className={`tthc-card ${isOpen ? "is-open" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenId(isOpen ? null : item._id)}
                  onKeyDown={(e) => e.key === "Enter" && setOpenId(isOpen ? null : item._id)}
                >
                  <div className="tthc-card__head">
                    <div className="tthc-card__title">{item.tenThuTuc}</div>
                    <Icon name="chevron_right" className="tthc-card__chevron" />
                  </div>
                  <div className="tthc-card__meta">
                    {item.linhVuc && <span className="tthc-card__tag">{item.linhVuc}</span>}
                    {item.mucDo && (
                      <span className="tthc-card__tag tthc-card__tag--muc4">
                        {MUC_DO_LABEL[item.mucDo] || `Mức độ ${item.mucDo}`}
                      </span>
                    )}
                  </div>

                  {isOpen && (
                    <div className="tthc-card__body" onClick={(e) => e.stopPropagation()}>
                      {item.thoiGianXuLy && (
                        <div className="tthc-card__body-row">
                          <b>Thời gian xử lý</b>
                          {item.thoiGianXuLy}
                        </div>
                      )}
                      {giayTo.length > 0 && (
                        <div className="tthc-card__body-row">
                          <b>Giấy tờ cần nộp</b>
                          <ul>
                            {giayTo.map((g, i) => (
                              <li key={i}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.ghiChu && (
                        <div className="tthc-card__body-row">
                          <b>Ghi chú</b>
                          {item.ghiChu}
                        </div>
                      )}
                      {item.linkNopTrucTuyen && (
                        <div
                          className="tthc-card__link"
                          role="button"
                          tabIndex={0}
                          onClick={() => openExternal(item.linkNopTrucTuyen)}
                        >
                          Nộp trực tuyến
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {items.length === 0 && (
              <div className="lookup-empty">Không tìm thấy thủ tục phù hợp.</div>
            )}
          </div>
        )}
      </Box>
    </Page>
  );
};

export default ThuTucHanhChinhPage;
