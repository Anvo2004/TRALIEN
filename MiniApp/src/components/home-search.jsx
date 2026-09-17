import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { scanQRCode } from "zmp-sdk/apis";
import Icon from "./icon.jsx";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";

// Mã hồ sơ TTHC dạng "H01.99-250101-0001" (xem placeholder ở tra-cuu-ho-so.jsx)
// — QR trên biên nhận giấy in mã này, khác QR dẫn tới 1 URL.
const MA_HO_SO_RE = /^[A-Z0-9]+\.[A-Z0-9]+-\d{6}-\d+$/i;

function matches(text, q) {
  return (text || "").toLowerCase().includes(q);
}

const HomeSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [notices, setNotices] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [services, setServices] = useState([]);
  const [tthcResults, setTthcResults] = useState([]);
  const [focused, setFocused] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/thong-bao`)
      .then((res) => res.json())
      .then((data) => setNotices(data.items || []))
      .catch(() => setNotices([]));

    fetch(`${API_BASE_URL}/api/public/app-links?section=quick_link`)
      .then((res) => res.json())
      .then((data) => setQuickLinks(data.items || []))
      .catch(() => setQuickLinks([]));

    fetch(`${API_BASE_URL}/api/public/app-links?section=service`)
      .then((res) => res.json())
      .then((data) => setServices(data.items || []))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setTthcResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`${API_BASE_URL}/api/public/thu-tuc-hanh-chinh?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => setTthcResults((data.items || []).slice(0, 5)))
        .catch(() => setTthcResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const q = query.trim().toLowerCase();

  const quickLinkResults = q
    ? quickLinks.filter((it) => matches(it.label, q)).slice(0, 5)
    : [];
  const serviceResults = q
    ? services.filter((it) => matches(it.label, q)).slice(0, 5)
    : [];
  const noticeResults = q
    ? notices.filter((n) => matches(n.title, q) || matches(n.content, q)).slice(0, 5)
    : [];

  const hasResults =
    quickLinkResults.length + serviceResults.length + noticeResults.length + tthcResults.length > 0;

  function goTo(item) {
    if (item.href) openExternal(item.href);
    else if (item.path) navigate(item.path);
    setQuery("");
    setFocused(false);
  }

  function openNotice() {
    navigate("/thong-bao");
    setQuery("");
    setFocused(false);
  }

  function openTthc() {
    navigate("/thu-tuc-hanh-chinh");
    setQuery("");
    setFocused(false);
  }

  async function handleScanQR() {
    try {
      const { content } = await scanQRCode({});
      if (!content) return;
      const value = content.trim();
      if (/^https?:\/\//i.test(value)) {
        openExternal(value);
      } else if (MA_HO_SO_RE.test(value)) {
        navigate("/tra-cuu-ho-so", { state: { prefillMaHoSo: value } });
      } else {
        setQuery(value);
        setFocused(true);
      }
    } catch (err) {
      // user cancelled the scanner — not an error worth surfacing
    }
  }

  return (
    <div className="home-hero__search" ref={boxRef}>
      <div className="home-hero__search-input">
        <Icon name="search" className="i18 mint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Tìm dịch vụ, thủ tục, thông báo…"
        />
      </div>
      <button type="button" className="home-hero__qr" aria-label="Quét mã QR" onClick={handleScanQR}>
        <Icon name="qr_code_scanner" className="i20" />
      </button>

      {focused && q && (
        <div className="home-search__results">
          {!hasResults && <div className="home-search__empty">Không tìm thấy kết quả phù hợp</div>}

          {quickLinkResults.map((it) => (
            <div key={`ql-${it._id}`} className="home-search__item" onClick={() => goTo(it)}>
              <span className={`tile tile-${it.color || "n"} home-search__icon`}>
                <Icon name={it.icon} className="i16" />
              </span>
              <span className="home-search__label">{it.label}</span>
            </div>
          ))}

          {serviceResults.map((it) => (
            <div key={`sv-${it._id}`} className="home-search__item" onClick={() => goTo(it)}>
              <span className={`tile tile-${it.color || "n"} home-search__icon`}>
                <Icon name={it.icon} className="i16" />
              </span>
              <span className="home-search__label">{it.label}</span>
            </div>
          ))}

          {tthcResults.map((it) => (
            <div key={`tthc-${it._id}`} className="home-search__item" onClick={() => openTthc(it)}>
              <span className="tile tile-g home-search__icon">
                <Icon name="description" className="i16" />
              </span>
              <span className="home-search__label">{it.tenThuTuc}</span>
            </div>
          ))}

          {noticeResults.map((n) => (
            <div key={`nt-${n._id}`} className="home-search__item" onClick={() => openNotice(n)}>
              <span className="tile tile-a home-search__icon">
                <Icon name="warning" className="i16" />
              </span>
              <span className="home-search__label">{n.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeSearch;
