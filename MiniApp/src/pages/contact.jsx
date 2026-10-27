import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page } from "zmp-ui";
import { openChat } from "zmp-sdk/apis";
import Glyph from "../components/ns/ns-glyph.jsx";
import { HeroSceneSmall } from "../components/ns/ns-scenes.jsx";
import { css, fmtInt, fmtDec } from "../components/ns/ns-util.js";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";
import { callPhone } from "../utils/call-phone.js";
import logo from "../static/logo-tralien.png";
import SITE from "../data/site.js";
import { openDaNangAI } from "../data/assistant.js";

// Giao diện port từ Mini App Nông Sơn; dữ liệu giữ nguyên của Trà Liên
// (SiteInfo.contact/zaloOA từ MongoDB, bản đồ nhúng bando.danang.gov.vn —
// xem comment gốc bên dưới — không có ở bản Nông Sơn).

// Suy ra trạng thái "đang làm việc" từ chuỗi workHours dạng
// "Thứ 2 - Thứ 6 · 07:30-11:30, 13:30-17:00". Trả về null nếu không tách
// được khung giờ — khi đó KHÔNG hiển thị badge, tránh báo sai giờ làm việc
// cho người dân (an toàn hơn là đoán bừa).
function getOpenStatus(workHours) {
  if (!workHours) return null;
  const ranges = [...workHours.matchAll(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/g)];
  if (!ranges.length) return null;

  const day = new Date().getDay(); // 0 = CN
  if (day === 0 || day === 6) return { open: false };

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const [, h1, m1, h2, m2] of ranges) {
    const start = Number(h1) * 60 + Number(m1);
    const end = Number(h2) * 60 + Number(m2);
    if (nowMinutes >= start && nowMinutes <= end) {
      return { open: true, closeLabel: `${h2.padStart(2, "0")}:${m2}` };
    }
  }
  return { open: false };
}

const Svg = ({ size = 24, children, style }) => (
  <svg className="ns-sv" viewBox="0 0 24 24" width={size} height={size} style={style} aria-hidden="true">
    {children}
  </svg>
);
const PHONE = "M6.6 3.5h2.7l1.4 3.9-1.8 1.2a11 11 0 0 0 5.5 5.5l1.2-1.8 3.9 1.4v2.7a1.8 1.8 0 0 1-2 1.8A15.5 15.5 0 0 1 4.8 5.5a1.8 1.8 0 0 1 1.8-2z";
const GREY = css("color:#7F9686");

const ContactPage = () => {
  const navigate = useNavigate();
  const [siteInfo, setSiteInfo] = useState(null);
  const [danSo, setDanSo] = useState({});
  const [copied, setCopied] = useState(false);
  const loading = siteInfo === null;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/site-info`)
      .then((res) => res.json())
      .then((data) => setSiteInfo(data || {}))
      .catch(() => setSiteInfo({}));
    fetch(`${API_BASE_URL}/api/public/dan-so`)
      .then((res) => res.json())
      .then((data) => setDanSo(data || {}))
      .catch(() => setDanSo({}));
  }, []);

  const c = siteInfo?.contact || {};
  const oa = siteInfo?.zaloOA || {};
  const openStatus = getOpenStatus(c.workHours);
  const phone = c.hotline;
  const tel = (phone || "").replace(/[^\d+]/g, "");
  // Bản đồ số Đà Nẵng (bando.danang.gov.vn — .gov.vn, tránh bị Zalo từ chối
  // kiểm duyệt vì điều hướng tới trang thứ 3 không phải CQNN, xem
  // .claude/rules — cùng lý do "Bản đồ mưa ngập" ở pctt.js bị ẩn). Nút "Chỉ
  // đường" mở URL này ra ngoài (openExternal), theo đúng bố cục Mini App
  // Nông Sơn — không nhúng iframe tại chỗ.
  const mapsHref = `https://bando.danang.gov.vn/?ward=${encodeURIComponent(SITE.wardName)}`;

  async function copyEmail() {
    if (!c.email) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(c.email);
      } else {
        const ta = document.createElement("textarea");
        ta.value = c.email;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      /* WebView không cho ghi clipboard — bỏ qua, không báo lỗi */
    }
  }

  function openZaloOA() {
    if (!oa.id) return;
    openChat({ type: "oa", id: String(oa.id) }).catch(() => {});
  }

  if (loading) {
    return (
      <Page className="ns-page">
        <div className="ns-root">
          <div className="ns-scr" style={css("padding:120px 20px;text-align:center;color:#55705F")}>Đang tải...</div>
        </div>
      </Page>
    );
  }

  return (
    <Page className="ns-page">
      <div className="ns-root">
        <div className="ns-scr">
          <div
            className="ns-hero"
            style={css("height:206px;padding:24px 20px 0;background:linear-gradient(180deg,#0F5A3A 0%,#1E8A57 58%,#7BC99A 100%)")}
          >
            <div className="ns-dots" />
            <HeroSceneSmall />
            <div style={css("position:relative;display:flex;align-items:center;gap:8px;color:#DDF1E3;font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase")}>
              <span className="ns-live" />Luôn sẵn sàng hỗ trợ
            </div>
            <h1 style={css("position:relative;margin:10px 0 0;font-size:30px;font-weight:800;letter-spacing:-.025em;line-height:1.1;color:#fff")}>
              Liên hệ &amp; Hỗ trợ
            </h1>
            <p style={css("position:relative;margin:8px 0 0;font-size:13px;font-weight:500;color:#DDF1E3")}>
              {[c.officeName || `UBND xã ${SITE.wardName}`, SITE.province].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className="ns-card ns-rs" style={css("position:relative;z-index:2;margin:-20px 16px 0;padding:18px 18px 18px")}>
            <div style={css("display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid #E2EBF4")}>
              <img
                src={logo}
                alt={`Logo ${SITE.heroCaption}`}
                width="56"
                height="56"
                style={css("flex:0 0 56px;border-radius:50%;box-shadow:0 8px 18px -6px rgba(10,47,94,.45)")}
              />
              <div>
                <h2 style={css("margin:0;font-size:17px;font-weight:800;letter-spacing:-.01em")}>{c.officeName || `UBND xã ${SITE.wardName}`}</h2>
                {openStatus && (
                  <div style={css(`display:flex;align-items:center;gap:6px;margin-top:4px;font-size:12px;font-weight:600;color:${openStatus.open ? "#18633F" : "#7F4E00"}`)}>
                    <span className="ns-live" style={openStatus.open ? undefined : css("background:#EDA91C")} />
                    {openStatus.open ? `Đang làm việc · đến ${openStatus.closeLabel}` : "Ngoài giờ làm việc"}
                  </div>
                )}
              </div>
            </div>

            <div className="ns-cr ns-tn-coral">
              <Glyph name="map" sm />
              <span style={css("flex:1")}>
                <span className="ns-lab">Địa chỉ</span><br />
                <span className="ns-val">{c.address || "Đang cập nhật"}</span>
              </span>
            </div>

            <button type="button" className="ns-cr ns-tn-blue" style={css("width:100%")} onClick={() => c.website && openExternal(`https://${c.website}`)}>
              <Glyph name="language" sm />
              <span style={css("flex:1")}>
                <span className="ns-lab">Website</span><br />
                <span className="ns-val">{c.website || "Đang cập nhật"}</span>
              </span>
              <Svg size={20} style={GREY}><path d="M8 16L16 8M9.5 8H16v6.5" /></Svg>
            </button>

            {c.email && (
              <button type="button" className="ns-cr ns-tn-green" style={css("width:100%")} onClick={copyEmail}>
                <Glyph name="mail" sm />
                <span style={css("flex:1")}>
                  <span className="ns-lab">Email</span><br />
                  <span className="ns-val" style={c.email ? undefined : css("color:#55705F")}>
                    {copied ? "Đã sao chép email" : c.email || "Đang cập nhật"}
                  </span>
                </span>
                {c.email && (
                  <Svg size={20} style={GREY}>
                    <rect x="8.5" y="8.5" width="11" height="11" rx="2.2" />
                    <path d="M15.5 8.5V6.7a2.2 2.2 0 0 0-2.2-2.2H6.7a2.2 2.2 0 0 0-2.2 2.2v6.6a2.2 2.2 0 0 0 2.2 2.2h1.8" />
                  </Svg>
                )}
              </button>
            )}

            <div className="ns-cr ns-tn-gold">
              <Glyph name="schedule" sm />
              <span style={css("flex:1")}>
                <span className="ns-lab">Giờ làm việc</span><br />
                <span className="ns-val" style={c.workHours ? css("white-space:pre-line") : css("color:#55705F")}>
                  {c.workHours || "Đang cập nhật"}
                </span>
              </span>
            </div>

            {phone && (
              <div style={css("padding-top:8px;display:flex;flex-direction:column;gap:8px")}>
                <a
                  className="ns-call"
                  href={`tel:${tel}`}
                  onClick={(e) => {
                    e.preventDefault();
                    callPhone(phone);
                  }}
                >
                  <span className="ns-ring" />
                  <Svg size={22}><path className="ns-t" d={PHONE} /></Svg>
                  Gọi ngay {phone}
                </a>
                {c.hotline2 && (
                  <a
                    href={`tel:${c.hotline2.replace(/[^\d+]/g, "")}`}
                    onClick={(e) => {
                      e.preventDefault();
                      callPhone(c.hotline2);
                    }}
                    style={css("text-align:center;font-size:12.5px;font-weight:600;color:#1E7A4C")}
                  >
                    Hoặc gọi số {c.hotline2}
                  </a>
                )}
              </div>
            )}
          </div>

          {c.policeStation?.address && (
            <div className="ns-card ns-rs" style={css("margin:14px 16px 0;padding:6px 18px;animation-delay:.1s")}>
              <div className="ns-cr ns-tn-blue">
                <Glyph name="local_police" sm />
                <span style={css("flex:1")}>
                  <span className="ns-lab">{c.policeStation.name || "Công an xã"}</span><br />
                  <span className="ns-val">{c.policeStation.address}</span>
                </span>
              </div>
            </div>
          )}

          <div style={css("display:flex;align-items:center;gap:10px;padding:26px 20px 12px")}>
            <span className="ns-ic ns-xs ns-tn-teal">
              <Svg size={18}><path className="ns-t" d="M4 13a8 8 0 0 1 16 0v3.5a1.5 1.5 0 0 1-1.5 1.5H17v-5h3M4 13h3v5H5.5A1.5 1.5 0 0 1 4 16.5z" /></Svg>
            </span>
            <h2 style={css("margin:0;font-size:17px;font-weight:800;letter-spacing:-.01em")}>Kênh hỗ trợ nhanh</h2>
          </div>
          <div className="ns-st" style={css("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:0 16px")}>
            <button type="button" className="ns-svc ns-rs ns-tn-blue" onClick={openZaloOA}>
              <Glyph name="forum" sm />
              <span><span className="ns-nm">Zalo OA</span><br /><span className="ns-sb">Chat trực tiếp với cán bộ xã</span></span>
            </button>
            <button type="button" className="ns-svc ns-rs ns-tn-coral" onClick={() => navigate("/phan-anh")}>
              <Glyph name="campaign" sm />
              <span><span className="ns-nm">Gửi phản ánh</span><br /><span className="ns-sb">Kèm ảnh, vị trí hiện tại</span></span>
            </button>
            <button type="button" className="ns-svc ns-rs ns-tn-violet" onClick={openDaNangAI}>
              <Glyph name="smart_toy" sm />
              <span><span className="ns-nm">Hỏi đáp AI</span><br /><span className="ns-sb">Giải đáp thủ tục 24/7</span></span>
            </button>
          </div>

          <div style={css("padding:14px 16px 110px")}>
            <div style={css("position:relative;overflow:hidden;border-radius:26px;padding:20px;background:linear-gradient(150deg,#0C3B2A,#1E7A4C);color:#fff")}>
              <svg viewBox="0 0 340 120" width="340" height="120" style={css("position:absolute;right:0;top:0;opacity:.5")} aria-hidden="true">
                <path d="M20 100 C80 40 140 120 200 60 S300 30 340 50" fill="none" stroke="#29A8DE" strokeWidth="1.5" strokeDasharray="2 8" strokeLinecap="round" />
                <path d="M0 70 C60 20 130 100 190 40 S300 10 340 30" fill="none" stroke="#EDA91C" strokeWidth="1.2" strokeOpacity=".6" />
              </svg>
              <div style={css("position:relative;font-size:13px;font-weight:600;color:#DDF1E3")}>{[SITE.heroCaption, SITE.province].filter(Boolean).join(" · ")}</div>
              <div style={css("position:relative;margin-top:4px;font-family:'Space Grotesk',sans-serif;font-size:30px;font-weight:700;letter-spacing:-.02em")}>
                {danSo.tongDanSo != null ? fmtInt(danSo.tongDanSo) : "—"}
              </div>
              <div style={css("position:relative;font-size:12.5px;font-weight:500;color:#DDF1E3")}>
                dân số (người){danSo.dienTichKm2 != null ? ` · ${fmtDec(danSo.dienTichKm2)} km²` : ""}
              </div>
              <div style={css("position:relative;margin-top:16px;display:flex;align-items:center;justify-content:space-between;gap:10px")}>
                <span style={css("font-size:13px;font-weight:600;line-height:1.35;flex:1")}>Xem vị trí trên Bản đồ số</span>
                <button type="button" className="ns-chip" style={css("color:#1E7A4C")} onClick={() => openExternal(mapsHref)}>
                  <Svg size={16}><path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z" /><circle cx="12" cy="10" r="2.3" /></Svg>
                  Chỉ đường
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default ContactPage;
