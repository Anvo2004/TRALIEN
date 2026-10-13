import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Page } from "zmp-ui";
import { getUserInfo } from "zmp-sdk/apis";
import SITE from "../data/site.js";
import XIcon from "../components/ns/ns-extra-icons.jsx";
import Icon3 from "../components/ns/ns-icons3d.jsx";
import { css } from "../components/ns/ns-util.js";
import {
  fetchProgram,
  fetchTransactions,
  formatDateTime,
  openCitizen,
  TYPE_LABELS,
} from "../data/citizen.js";

// Giao diện port từ Mini App Nông Sơn, logic/API giữ nguyên của Trà Liên. Xem
// ghi chú ở pages/cong-dan.jsx về việc thay useSite() bằng data/site.js tĩnh.
const n = { appName: SITE.appName };

const TABS = [
  { key: "nhat-ky", label: "Nhật ký" },
  { key: "the-le", label: "Thể lệ" },
  { key: "quyen-loi", label: "Quyền lợi" },
];
const RULE_ORDER = ["register", "referrer", "survey", "feedback", "event", "exam"];

const RankBadge = ({ idx, size = 46 }) => (
  <span className="ns-ic3 ns-sm" style={{ animation: "none", width: size, height: size }}>
    <Icon3 name={`rank${Math.min(3, idx + 1)}`} />
  </span>
);

const TichDiemPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(location.state?.tab || "nhat-ky");
  const [citizen, setCitizen] = useState(null);
  const [program, setProgram] = useState(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProgram()
      .then((d) => setProgram(d.program))
      .catch(() => {});

    (async () => {
      try {
        const { userInfo } = await getUserInfo({ autoRequestPermission: true });
        const data = await openCitizen({
          displayName: userInfo?.name || "",
          avatar: userInfo?.avatar || "",
          followedOA: Boolean(userInfo?.followedOA),
        });
        setCitizen(data.citizen);
        const tx = await fetchTransactions();
        setItems(tx.items || []);
      } catch (err) {
        setError(err.message || "Không tải được dữ liệu điểm");
        setItems([]);
      }
    })();
  }, []);

  const tiers = program?.tiers || [];
  const points = citizen?.points ?? 0;
  const ti = TABS.findIndex((t) => t.key === tab);
  const tierIdx = Math.max(0, tiers.findIndex((t) => t.key === citizen?.tier?.key));

  return (
    <Page className="ns-page">
      <div className="ns-root">
        <div className="ns-scr">
          <div
            className="ns-hero"
            style={css("height:262px;padding:22px 20px 0;background:linear-gradient(180deg,#0F5A3A 0%,#1E8A57 55%,#7BC99A 100%)")}
          >
            <div className="ns-dots" />
            <div style={css("position:relative;display:flex;align-items:center;gap:12px")}>
              <button
                type="button"
                className="ns-glass"
                aria-label="Quay lại"
                onClick={() => navigate(-1)}
                style={css("width:44px;height:44px;border-radius:15px;display:grid;place-items:center;color:#fff")}
              >
                <svg className="ns-sv" viewBox="0 0 24 24" width="22" height="22" style={css("stroke-width:2")}>
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <h1 style={css("margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-.01em")}>Tích điểm công dân</h1>
            </div>
            <div style={css("position:relative;margin-top:18px;display:flex;align-items:flex-end;justify-content:space-between")}>
              <div style={css("display:flex;flex-direction:column")}>
                <span style={css("font-size:12.5px;font-weight:600;color:#DDF1E3")}>Tổng điểm</span>
                <b style={css("font-family:'Space Grotesk',sans-serif;font-size:56px;line-height:1;font-weight:700;color:#fff;letter-spacing:-.03em")}>
                  {points}
                </b>
              </div>
              <span className="ns-pt">
                <Icon3 name={`rank${Math.min(3, tierIdx + 1)}`} />
                {citizen?.tier ? citizen.tier.name : "Chưa xếp hạng"}
              </span>
            </div>
            <div style={css("position:relative;margin-top:16px")}>
              <div className="ns-prog">
                <i style={{ width: `${Math.max(citizen ? citizen.progress : 0, 3)}%` }} />
              </div>
              <div style={css("margin-top:8px;font-size:12.5px;font-weight:600;color:#DDF1E3")}>
                {citizen?.nextTier
                  ? `Cần ${citizen.pointsNeeded} điểm nữa để lên ${citizen.nextTier.name}`
                  : citizen
                  ? "Bạn đã đạt hạng cao nhất"
                  : ""}
              </div>
            </div>
          </div>

          <div style={css("padding:16px 16px 0")}>
            <div className="ns-seg">
              <div className="ns-th" style={{ transform: `translateX(${Math.max(ti, 0) * 100}%)` }}><i /></div>
              {TABS.map((t) => (
                <button key={t.key} type="button" className={tab === t.key ? "ns-on" : ""} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={css("padding:14px 16px 110px;display:flex;flex-direction:column;gap:14px")}>
            {tab === "nhat-ky" && (
              <>
                {error && <div className="ns-card ns-empty">{error}</div>}
                {items === null && !error && <div className="ns-card ns-empty">Đang tải…</div>}
                {items && items.length === 0 && !error && (
                  <div className="ns-card ns-empty">Chưa có hoạt động nào được ghi nhận.</div>
                )}
                {(items || []).map((t, i) => (
                  <div
                    className="ns-card ns-rs"
                    key={`${t.createdAt}-${i}`}
                    style={css("padding:16px;display:flex;align-items:flex-start;gap:14px")}
                  >
                    <span
                      className={`ns-gi ${t.points < 0 ? "o" : "g"}`}
                      style={css("flex:0 0 40px;width:40px;height:40px;border-radius:50%")}
                    >
                      <XIcon name={t.points < 0 ? "clock" : "check"} size={22} />
                    </span>
                    <span style={css("flex:1;display:flex;flex-direction:column;gap:3px")}>
                      <b style={css("font-size:15px")}>
                        {t.type === "adjust" && t.note ? t.note : TYPE_LABELS[t.type] || t.note || "Hoạt động"}
                      </b>
                      <span className="ns-cap" style={css("font-size:13px")}>Hệ thống tự động ghi nhận</span>
                      <span className="ns-cap" style={css("opacity:.7")}>{formatDateTime(t.createdAt)}</span>
                    </span>
                    <b className={`ns-pts ${t.points < 0 ? "ns-neg" : ""}`} style={css("font-size:20px")}>
                      {t.points > 0 ? `+${t.points}` : t.points}
                    </b>
                  </div>
                ))}
              </>
            )}

            {tab === "the-le" && program && (
              <>
                <div className="ns-card ns-rs" style={css("padding:18px")}>
                  <div style={css("display:flex;align-items:center;gap:12px")}>
                    <span className="ns-stn ns-round">I</span>
                    <h3 style={css("margin:0;font-size:16px;font-weight:800")}>Đối tượng áp dụng</h3>
                  </div>
                  <p className="ns-para">{program.target}</p>
                </div>

                <div className="ns-card ns-rs" style={css("padding:18px;animation-delay:.06s")}>
                  <div style={css("display:flex;align-items:center;gap:12px")}>
                    <span className="ns-stn ns-round">II</span>
                    <h3 style={css("margin:0;font-size:16px;font-weight:800")}>Cơ chế tích lũy điểm</h3>
                  </div>
                  <p className="ns-para">
                    Khi tham gia các hoạt động trên {n.appName || "Mini App"}, công dân được cộng điểm theo các mức sau:
                  </p>
                  {RULE_ORDER.map((key, idx) => {
                    const r = program.rules[key];
                    if (!r) return null;
                    return (
                      <div className="ns-rulebox" key={key}>
                        <span className="ns-stn ns-round">{idx + 1}</span>
                        <span style={css("flex:1;display:flex;flex-direction:column")}>
                          <b style={css("font-size:14.5px")}>{r.title}</b>
                          <span className="ns-cap">{r.desc}</span>
                        </span>
                        <span className="ns-beta" style={css("margin:0;background:#DCF3E6;color:#18633F;font-size:12.5px")}>
                          +{r.points} điểm
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="ns-card ns-rs" style={css("padding:18px;animation-delay:.12s")}>
                  <div style={css("display:flex;align-items:center;gap:12px")}>
                    <span className="ns-stn ns-round">III</span>
                    <h3 style={css("margin:0;font-size:16px;font-weight:800")}>Phân hạng Công dân số</h3>
                  </div>
                  <p className="ns-para">
                    Căn cứ vào tổng điểm tích lũy, công dân được xét nâng hạng như sau:
                  </p>
                  {[...tiers].reverse().map((t, i) => (
                    <div className="ns-rulebox" key={t.key} style={css("padding:8px 14px 8px 8px")}>
                      <RankBadge idx={tiers.length - 1 - i} />
                      <b style={css("flex:1;font-size:15px")}>{t.name}</b>
                      <span className="ns-cap">Từ {t.min} điểm</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "quyen-loi" && program && (
              <div className="ns-card ns-rs" style={css("padding:18px")}>
                <div style={css("display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:1px solid #E2EBF4")}>
                  <span className="ns-gi b" style={css("flex:0 0 40px;width:40px;height:40px;border-radius:50%")}>
                    <XIcon name="check" size={22} />
                  </span>
                  <h3 style={css("margin:0;font-size:16px;font-weight:800")}>Quyền lợi và hình thức ghi nhận</h3>
                </div>
                <p className="ns-para" style={css("margin-top:14px")}>Công dân số có thể sử dụng điểm tích lũy để:</p>
                {program.benefits.length === 0 && <p className="ns-para">Đang cập nhật.</p>}
                {program.benefits.map((b, i) => (
                  <div key={i}>
                    <div style={css("display:flex;gap:10px;margin-top:14px;font-size:14px;font-weight:800")}>
                      <svg className="ns-sv" viewBox="0 0 24 24" width="22" height="22" style={css("flex:0 0 22px;color:#1E7A4C")}>
                        <circle className="ns-t" cx="12" cy="12" r="9" />
                        <path d="M8 12.5l3 3 5-6" />
                      </svg>
                      <span>{i + 1}. {b.title}</span>
                    </div>
                    {b.items.map((it, j) => (
                      <div className="ns-li" key={j}>{it}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
};

export default TichDiemPage;
