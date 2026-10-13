import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "zmp-ui";
import { followOA, getUserInfo } from "zmp-sdk/apis";
import { isLinked, updateProfile } from "../data/citizen.js";
import HomeSearch from "../components/home-search.jsx";
import QuickLinksGrid from "../components/quick-links-grid.jsx";
import { HeroScene } from "../components/ns/ns-scenes.jsx";
import { css, useCountUp, fmtInt, fmtDec } from "../components/ns/ns-util.js";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";
import useNews from "../data/use-news.js";
import SITE from "../data/site.js";
import logo from "../static/logo-tralien.png";

// Giao diện port từ Mini App Nông Sơn (bản thiết kế "Nông Sơn Số"); dữ liệu/API
// giữ nguyên của Trà Liên — tiện ích nhanh vẫn lấy từ app-links (DB, AdminWeb
// quản lý), thống kê dân số vẫn từ /api/public/dan-so, OA/digitalTransform
// vẫn từ /api/public/site-info. Xem thêm ghi chú ở pages/cong-dan.jsx.
const FOLLOWED_KEY = "tralien_oa_followed";
const readFollowed = () => {
  try {
    return localStorage.getItem(FOLLOWED_KEY) === "1";
  } catch {
    return false;
  }
};
const writeFollowed = (v) => {
  try {
    if (v) localStorage.setItem(FOLLOWED_KEY, "1");
    else localStorage.removeItem(FOLLOWED_KEY);
  } catch {
    /* WebView chặn localStorage — bỏ qua */
  }
};
const TAG_COLORS = ["#1664A8", "#5E7A14", "#5A3FD0", "#B8412A"];

const SectionTitle = ({ tone, icon, children, action }) => (
  <div style={css("display:flex;align-items:center;justify-content:space-between;padding:24px 20px 12px")}>
    <div style={css("display:flex;align-items:center;gap:10px")}>
      <span className={`ns-ic ns-xs ns-tn-${tone}`}>{icon}</span>
      <h2 style={css("margin:0;font-size:17px;font-weight:800;letter-spacing:-.01em")}>{children}</h2>
    </div>
    {action}
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const news = useNews();

  const [siteInfo, setSiteInfo] = useState({});
  const [notices, setNotices] = useState([]);
  const [danSo, setDanSo] = useState({});
  const [followed, setFollowed] = useState(readFollowed);

  useEffect(() => {
    const get = (path, ok, fail) =>
      fetch(`${API_BASE_URL}/api/public/${path}`)
        .then((res) => res.json())
        .then(ok)
        .catch(fail);
    get("site-info", (d) => setSiteInfo(d || {}), () => setSiteInfo({}));
    get("thong-bao", (d) => setNotices((d.items || []).slice(0, 2)), () => setNotices([]));
    get("dan-so", (d) => setDanSo(d || {}), () => setDanSo({}));

    // Hỏi Zalo trạng thái quan tâm thật (không bật hộp thoại xin quyền).
    getUserInfo({})
      .then(({ userInfo }) => {
        if (typeof userInfo?.followedOA === "boolean") {
          setFollowed(userInfo.followedOA);
          writeFollowed(userInfo.followedOA);
        }
      })
      .catch(() => {});
  }, []);

  const pop = useCountUp(danSo.tongDanSo);
  const area = useCountUp(danSo.dienTichKm2);

  const contact = siteInfo.contact || {};
  const digitalTransform = siteInfo.digitalTransform || {};
  const oa = siteInfo.zaloOA || {};

  async function handleFollowOA() {
    if (!oa.id) return;
    try {
      await followOA({ id: String(oa.id) });
      setFollowed(true);
      writeFollowed(true);
      // Đồng bộ sang hồ sơ công dân (nếu đã liên kết) — không chặn nếu lỗi.
      if (isLinked()) updateProfile({ followedOA: true }).catch(() => {});
    } catch (e) {
      /* người dùng huỷ — không cần báo lỗi */
    }
  }

  return (
    <Page className="ns-page">
      <div className="ns-root">
        <div className="ns-scr">
          <div
            className="ns-hero"
            style={css("height:300px;padding:22px 20px 0;background:linear-gradient(180deg,#124A94 0%,#1A6AB9 52%,#5AB3E8 100%)")}
          >
            <div className="ns-dots" />
            <HeroScene />
            <div style={css("position:relative;display:flex;align-items:center;gap:14px")}>
              <img
                src={logo}
                alt="Quốc huy"
                width="60"
                height="60"
                style={css("flex:0 0 60px;border-radius:50%;box-shadow:0 0 0 3px rgba(255,255,255,.4),0 10px 22px -6px rgba(5,25,60,.55)")}
              />
              <div style={css("display:flex;flex-direction:column;gap:5px")}>
                <h1 style={css("margin:0;font-size:25px;font-weight:800;letter-spacing:-.02em;line-height:1.1;color:#fff")}>
                  {SITE.heroCaption}
                </h1>
                <div style={css("display:flex;align-items:center;gap:8px;color:#DDF1E3;font-size:12.5px;font-weight:500")}>
                  <span className="ns-live" />
                  {[SITE.province, SITE.badge].filter(Boolean).join(" · ")}
                </div>
              </div>
            </div>
            <HomeSearch />
          </div>

          <div
            className="ns-card ns-rs"
            style={css("position:relative;z-index:2;margin:14px 16px 0;padding:18px 4px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr))")}
          >
            <div className="ns-stat"><b className="ns-num">{fmtInt(pop)}</b><span className="ns-cap">Dân số</span></div>
            <div className="ns-stat"><b className="ns-num">{danSo.soThon != null ? fmtInt(danSo.soThon) : "—"}</b><span className="ns-cap">Thôn</span></div>
            <div className="ns-stat"><b className="ns-num">{fmtDec(area)}</b><span className="ns-cap">Diện tích (km²)</span></div>
            <div className="ns-stat"><b className="ns-num">{danSo.hoDan != null ? fmtInt(danSo.hoDan) : "—"}</b><span className="ns-cap">Hộ dân</span></div>
          </div>

          <SectionTitle
            tone="gold"
            icon={
              <svg className="ns-sv" viewBox="0 0 24 24" width="18" height="18">
                <path className="ns-t" d="M13 3L5.5 13.5H11L10 21l7.5-10.5H12z" />
              </svg>
            }
          >
            Tiện ích nhanh
          </SectionTitle>

          <QuickLinksGrid />

          {(digitalTransform.title || digitalTransform.tags) && (
            <div style={css("padding:20px 16px 0")}>
              <button type="button" className="ns-banner ns-rs" style={css("animation-delay:.3s")} onClick={() => navigate("/tro-ly-so")}>
                <span className="ns-sh" />
                <span className="ns-glass" style={css("flex:0 0 52px;height:52px;border-radius:18px;display:grid;place-items:center;color:#8AD6F7")}>
                  <svg className="ns-sv" viewBox="0 0 24 24" width="26" height="26">
                    <circle cx="12" cy="12" r="2.6" /><circle cx="5" cy="6" r="1.8" /><circle cx="19" cy="6" r="1.8" />
                    <circle cx="5" cy="18" r="1.8" /><circle cx="19" cy="18" r="1.8" />
                    <path d="M10 10.2L6.3 7.2M14 10.2l3.7-3M10 13.8l-3.7 3M14 13.8l3.7 3" />
                  </svg>
                </span>
                <span style={css("flex:1;display:flex;flex-direction:column;gap:3px")}>
                  <span style={css("font-size:16px;font-weight:800;letter-spacing:-.01em")}>{digitalTransform.title}</span>
                  <span style={css("font-size:12.5px;font-weight:500;color:#DDF1E3")}>{(digitalTransform.tags || []).join(" · ")}</span>
                </span>
                <svg className="ns-sv" viewBox="0 0 24 24" width="22" height="22"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </div>
          )}

          <SectionTitle
            tone="blue"
            icon={
              <svg className="ns-sv" viewBox="0 0 24 24" width="18" height="18">
                <rect className="ns-t" x="4" y="4.5" width="16" height="15" rx="2.5" />
                <path d="M4 9h16M8 13h5M8 16h8" />
              </svg>
            }
            action={
              <button type="button" className="ns-chip" style={css("color:#1664A8")} onClick={() => navigate("/tin-tuc")}>
                <span>Xem thêm</span>
              </button>
            }
          >
            Tin tức mới nhất
          </SectionTitle>
          <div className="ns-news">
            {news.slice(0, 6).map((item, i) => (
              <article
                className="ns-nc"
                key={item.id}
                onClick={item.link ? () => openExternal(item.link) : undefined}
                role={item.link ? "button" : undefined}
                tabIndex={item.link ? 0 : undefined}
                style={item.link ? { cursor: "pointer" } : undefined}
              >
                <div style={css("position:relative;height:128px;background:linear-gradient(135deg,#CFE3F7,#EAF3FC);overflow:hidden")}>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      style={css("position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover")}
                    />
                  )}
                  {item.tag && (
                    <span className="ns-tag" style={{ background: TAG_COLORS[i % TAG_COLORS.length] }}>
                      {item.tag}
                    </span>
                  )}
                </div>
                <div style={css("padding:14px 16px 16px;display:flex;flex-direction:column;gap:10px")}>
                  <h3 style={css("margin:0;font-size:14.5px;font-weight:700;line-height:1.4")}>{item.title}</h3>
                  <span className="ns-cap" style={css("display:flex;align-items:center;gap:6px")}>
                    <svg className="ns-sv" viewBox="0 0 24 24" width="14" height="14">
                      <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
                    </svg>
                    {item.date || "—"}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div style={css("padding:14px 16px 0")}>
            <div className="ns-oa">
              <span style={css("flex:0 0 50px;height:50px;border-radius:17px;background:rgba(255,255,255,.1);display:grid;place-items:center;color:#8AD6F7")}>
                <svg className="ns-sv" viewBox="0 0 24 24" width="25" height="25">
                  <path className="ns-t" d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 4v-4h-1A1.5 1.5 0 0 1 4 14.5z" />
                  <path d="M8 8.5h8M8 12h5" />
                </svg>
              </span>
              <span style={css("flex:1;display:flex;flex-direction:column;gap:3px")}>
                <span style={css("font-size:14.5px;font-weight:700;line-height:1.3")}>Theo dõi {oa.name || "Zalo OA"}</span>
                <span style={css("font-size:12px;font-weight:500;color:#BFD6EE;line-height:1.4")}>
                  {oa.description}
                </span>
              </span>
              <button
                type="button"
                className="ns-oab"
                onClick={followed ? undefined : handleFollowOA}
                disabled={followed}
                style={css(followed ? "background:rgba(255,255,255,.14);color:#fff" : "background:#3DDC97;color:#04281A")}
              >
                {followed ? "Đã quan tâm" : "Quan tâm"}
              </button>
            </div>
          </div>

          <SectionTitle
            tone="coral"
            icon={
              <svg className="ns-sv" viewBox="0 0 24 24" width="18" height="18">
                <path className="ns-t" d="M12 3.5l9 16H3z" /><path d="M12 10v4.2M12 17v.01" />
              </svg>
            }
          >
            Thông báo quan trọng
          </SectionTitle>
          <div className="ns-card" style={css("margin:0 16px 110px;overflow:hidden")}>
            <button type="button" className="ns-row ns-tn-teal" onClick={() => navigate("/lien-he")}>
              <span className="ns-ic ns-sm">
                <svg className="ns-sv" viewBox="0 0 24 24" width="25" height="25">
                  <path className="ns-t" d="M4 13a8 8 0 0 1 16 0v3.5a1.5 1.5 0 0 1-1.5 1.5H17v-5h3M4 13h3v5H5.5A1.5 1.5 0 0 1 4 16.5z" />
                </svg>
              </span>
              <span style={css("flex:1;display:flex;flex-direction:column")}>
                <span className="ns-nm">Cần hỗ trợ từ UBND xã?</span>
                <span className="ns-sb">
                  {contact.hotline ? `Hotline: ${contact.hotline}` : "Nhấn để xem thông tin liên hệ"}
                </span>
              </span>
              <svg className="ns-sv" viewBox="0 0 24 24" width="18" height="18" style={css("color:#7F9686")}><path d="M9 6l6 6-6 6" /></svg>
            </button>
            {notices.map((notice) => (
              <button type="button" className="ns-row ns-tn-gold" key={notice._id} onClick={() => navigate("/thong-bao")}>
                <span className="ns-ic ns-sm">
                  <svg className="ns-sv" viewBox="0 0 24 24" width="25" height="25">
                    <path className="ns-t" d="M12 3.5l9 16H3z" /><path d="M12 10v4.2M12 17v.01" />
                  </svg>
                </span>
                <span style={css("flex:1;display:flex;flex-direction:column")}>
                  <span className="ns-nm">{notice.title}</span>
                  <span className="ns-sb">{notice.content}</span>
                </span>
                <svg className="ns-sv" viewBox="0 0 24 24" width="18" height="18" style={css("color:#7F9686")}><path d="M9 6l6 6-6 6" /></svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
};

export default HomePage;
