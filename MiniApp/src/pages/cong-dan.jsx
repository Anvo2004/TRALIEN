import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Sheet } from "zmp-ui";
import {
  getUserInfo,
  getPhoneNumber,
  followOA,
  unfollowOA,
  openShareSheet,
  createShortcut,
} from "zmp-sdk/apis";
import API_BASE_URL from "../data/api-config.js";
import SITE from "../data/site.js";
import logo from "../static/logo-tralien.png";
import XIcon, { xTone } from "../components/ns/ns-extra-icons.jsx";
import { HeroSceneSmall } from "../components/ns/ns-scenes.jsx";
import Icon3 from "../components/ns/ns-icons3d.jsx";
import { css } from "../components/ns/ns-util.js";
import {
  clearPendingReferral,
  fetchProgram,
  fetchVillages,
  isLinked,
  markLinked,
  markPhoneAsked,
  openCitizen,
  pendingReferral,
  resetPhoneAsked,
  sendPhoneToken,
  submitReferral,
  updateProfile,
  wasPhoneAsked,
} from "../data/citizen.js";

// Giao diện port từ Mini App Nông Sơn (bản thiết kế "Nông Sơn Số"); logic/API
// giữ nguyên của Trà Liên. Trà Liên chưa có SiteProvider/API site-info động như
// Nông Sơn (xem data/site-context.jsx bên đó), nên tên hiển thị lấy thẳng từ
// data/site.js tĩnh thay vì useSite().
const n = {
  appName: SITE.appName,
  title: SITE.heroCaption,
  office: `UBND xã ${SITE.wardName}`,
};

const FOLLOWED_KEY = "tralien_oa_followed";
const setLocal = (k, v) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* WebView có thể chặn localStorage — bỏ qua */
  }
};

const Chevron = () => (
  <svg className="ns-sv" viewBox="0 0 24 24" width="18" height="18" style={css("color:#7F9686")}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const CitizenPage = () => {
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState(null);
  const [linked, setLinked] = useState(isLinked());
  const [program, setProgram] = useState(null);
  const [oaId, setOaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const [villageSheet, setVillageSheet] = useState(false);
  const [villages, setVillages] = useState(null);
  const [referralSheet, setReferralSheet] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [referralError, setReferralError] = useState("");

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  // Lấy tên/ảnh Zalo → tự đăng ký (lần đầu +điểm) → trả hồ sơ công dân.
  const load = useCallback(async () => {
    setError("");
    try {
      const { userInfo } = await getUserInfo({ autoRequestPermission: true });
      const data = await openCitizen({
        displayName: userInfo?.name || "",
        avatar: userInfo?.avatar || "",
        followedOA: Boolean(userInfo?.followedOA),
        referralCode: pendingReferral(),
      });
      clearPendingReferral();
      setCitizen(data.citizen);
      return data.citizen;
    } catch (err) {
      setError(err.message || "Không tải được thông tin công dân");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // SĐT: xin tự động một lần sau khi đăng ký; người dùng từ chối thì không hỏi lại
  // cho tới khi bấm "Liên kết lại".
  const askPhone = useCallback(async (force = false) => {
    if (!force && wasPhoneAsked()) return;
    markPhoneAsked();
    try {
      const { token } = await getPhoneNumber();
      if (!token) return;
      const data = await sendPhoneToken(token);
      setCitizen(data.citizen);
    } catch {
      /* từ chối hoặc chưa được cấp quyền — bỏ qua, không chặn dùng app */
    }
  }, []);

  useEffect(() => {
    (async () => {
      fetchProgram()
        .then((d) => {
          setProgram(d.program);
          setOaId(d.oaId || "");
        })
        .catch(() => {});
      if (!isLinked()) {
        setLoading(false); // lần đầu: chờ người dùng bấm "Cho phép & liên kết"
        return;
      }
      const c = await load();
      if (c && !c.phone) askPhone(false);
    })();
  }, [load, askPhone]);

  // Lần đầu vào tab Công dân: xin phép MỘT lần (tên, ảnh, số điện thoại), đăng ký
  // tài khoản (+điểm), rồi mời chọn thôn/tổ để hồ sơ đầy đủ.
  const link = async () => {
    setBusy(true);
    setLoading(true);
    resetPhoneAsked();
    const c = await load();
    if (c) {
      await askPhone(true);
      markLinked();
      setLinked(true);
      notify("Đã liên kết tài khoản Zalo");
      if (!c.village) setTimeout(() => openVillages(), 400);
    }
    setBusy(false);
  };

  const relink = async () => {
    setBusy(true);
    resetPhoneAsked();
    const c = await load();
    if (c) await askPhone(true);
    setBusy(false);
    if (c) notify("Đã liên kết lại thông tin Zalo");
  };

  const openVillages = async () => {
    setVillageSheet(true);
    if (villages === null) {
      try {
        setVillages(await fetchVillages());
      } catch {
        setVillages([]);
      }
    }
  };

  const chooseVillage = async (v) => {
    setBusy(true);
    try {
      const data = await updateProfile({ villageId: v._id });
      setCitizen(data.citizen);
      setVillageSheet(false);
      notify(`Đã chọn ${v.ten}`);
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleFollow = async () => {
    if (!oaId) return;
    try {
      if (citizen.followedOA) {
        await unfollowOA({ id: oaId });
        setLocal(FOLLOWED_KEY, null);
        const data = await updateProfile({ followedOA: false });
        setCitizen(data.citizen);
      } else {
        await followOA({ id: oaId });
        setLocal(FOLLOWED_KEY, "1");
        const data = await updateProfile({ followedOA: true });
        setCitizen(data.citizen);
        notify("Đã quan tâm Zalo OA");
      }
    } catch {
      /* người dùng huỷ trong hộp thoại của Zalo */
    }
  };

  const share = async () => {
    try {
      await openShareSheet({
        type: "zmp_deep_link",
        data: {
          title: n.appName,
          description: `Ứng dụng của ${n.office}. Nhập mã giới thiệu ${citizen.referralCode} để nhận điểm thưởng.`,
          thumbnail: `${API_BASE_URL}/brand/logo-tralien.png`,
          path: `/?ref=${citizen.referralCode}`,
        },
      });
    } catch {
      /* đóng cửa sổ chia sẻ */
    }
  };

  const pin = async () => {
    try {
      await createShortcut();
    } catch {
      notify("Thiết bị chưa hỗ trợ ghim ứng dụng");
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(citizen.referralCode);
      notify("Đã sao chép mã giới thiệu");
    } catch {
      notify("Giữ vào mã để sao chép");
    }
  };

  const redeem = async () => {
    setReferralError("");
    setBusy(true);
    try {
      const data = await submitReferral(referralInput);
      setCitizen(data.citizen);
      setReferralSheet(false);
      setReferralInput("");
      notify(data.points ? `Nhập mã thành công, +${data.points} điểm` : "Nhập mã thành công");
    } catch (err) {
      setReferralError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const referrerPoints = program?.rules?.referrer?.points ?? 2;

  const hero = (title, sub) => (
    <div
      className="ns-hero"
      style={css("height:206px;padding:24px 20px 0;background:linear-gradient(180deg,#0F5A3A 0%,#1E8A57 58%,#7BC99A 100%)")}
    >
      <div className="ns-dots" />
      <HeroSceneSmall />
      <div style={css("position:relative;display:flex;align-items:center;gap:8px;color:#DDF1E3;font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase")}>
        <span className="ns-live" />
        {n.title}
      </div>
      <h1 style={css("position:relative;margin:10px 0 0;font-size:30px;font-weight:800;letter-spacing:-.025em;line-height:1.1;color:#fff")}>
        {title}
      </h1>
      {sub && <p style={css("position:relative;margin:8px 0 0;font-size:13px;font-weight:500;color:#DDF1E3")}>{sub}</p>}
    </div>
  );

  if (loading) {
    return (
      <Page className="ns-page">
        <div className="ns-root">
          <div className="ns-scr">
            {hero("Công dân số")}
            <div className="ns-empty">Đang tải thông tin…</div>
          </div>
        </div>
      </Page>
    );
  }

  // ---- Chưa liên kết: màn xin phép
  if (!citizen) {
    return (
      <Page className="ns-page">
        <div className="ns-root">
          <div className="ns-scr">
            {hero("Công dân số", "Liên kết tài khoản Zalo để tích điểm")}
            <div className="ns-card ns-rs" style={css("position:relative;z-index:2;margin:-20px 16px 0;padding:20px 18px")}>
              <div style={css("display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid #E2EBF4")}>
                <img
                  src={logo}
                  alt={`Logo ${n.appName}`}
                  width="56"
                  height="56"
                  style={css("flex:0 0 56px;border-radius:50%;box-shadow:0 8px 18px -6px rgba(10,47,94,.45)")}
                />
                <div>
                  <h2 style={css("margin:0;font-size:17px;font-weight:800;letter-spacing:-.01em")}>Liên kết tài khoản Zalo</h2>
                  <span className="ns-cap">{n.appName} cần bạn cho phép:</span>
                </div>
              </div>
              <div className="ns-cr ns-tn-teal">
                <span className="ns-ic ns-sm"><XIcon name="user" /></span>
                <span style={css("flex:1")}>
                  <span className="ns-val">Tên và ảnh đại diện Zalo</span><br />
                  <span className="ns-sb">Hiển thị trong hồ sơ công dân của bạn.</span>
                </span>
              </div>
              <div className="ns-cr ns-tn-coral">
                <span className="ns-ic ns-sm"><XIcon name="phone" /></span>
                <span style={css("flex:1")}>
                  <span className="ns-val">Số điện thoại</span><br />
                  <span className="ns-sb">Để cán bộ liên hệ khi xử lý phản ánh và xác minh tài khoản tích điểm.</span>
                </span>
              </div>
              <div className="ns-cr ns-tn-green">
                <span className="ns-ic ns-sm"><XIcon name="pin" /></span>
                <span style={css("flex:1")}>
                  <span className="ns-val">Thôn/Tổ bạn sinh sống</span><br />
                  <span className="ns-sb">Bạn sẽ chọn ngay sau khi liên kết.</span>
                </span>
              </div>
              {error && <p className="ns-error">{error}</p>}
              <div style={css("padding-top:10px")}>
                <button type="button" className="ns-call" onClick={link} disabled={busy}>
                  <span className="ns-ring" />
                  Cho phép &amp; liên kết
                </button>
              </div>
              <p className="ns-note">
                Thông tin chỉ dùng cho dịch vụ của {n.office}. Bạn có thể từ chối cấp số điện thoại và vẫn sử
                dụng ứng dụng. Liên kết lần đầu nhận +{program?.rules?.register?.points ?? 5} điểm.
              </p>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  // ---- Đã liên kết: hồ sơ công dân
  const tierIdx = Math.max(0, (program?.tiers || []).findIndex((t) => t.key === citizen.tier?.key));
  const rankIcon = `rank${Math.min(3, tierIdx + 1)}`;

  return (
    <Page className="ns-page">
      <div className="ns-root">
        <div className="ns-scr">
          <div
            className="ns-hero"
            style={css("height:190px;padding:26px 20px 0;background:linear-gradient(180deg,#0F5A3A 0%,#1E8A57 58%,#7BC99A 100%)")}
          >
            <div className="ns-dots" />
            <img
              src={logo}
              alt=""
              width="150"
              height="150"
              aria-hidden="true"
              style={css("position:absolute;right:-26px;top:-18px;opacity:.16")}
            />
            <div style={css("position:relative;display:flex;flex-direction:column;gap:6px")}>
              <h1 style={css("margin:0;font-size:26px;font-weight:800;letter-spacing:-.02em;color:#fff")}>Cá nhân</h1>
              <span style={css("font-size:13.5px;font-weight:500;color:#DDF1E3")}>Quản lý thông tin và điểm thưởng</span>
            </div>
          </div>

          <div className="ns-card ns-rs" style={css("position:relative;z-index:2;margin:-62px 16px 0;padding:18px")}>
            <div style={css("display:flex;align-items:center;gap:14px")}>
              <span className="ns-ph">
                {citizen.avatar ? <img src={citizen.avatar} alt="" /> : <XIcon name="user" size={32} />}
              </span>
              <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:3px")}>
                <b style={css("font-size:17px;font-weight:800;color:#12281D")}>{citizen.displayName || "Công dân"}</b>
                <span className="ns-cap">ID Zalo: {citizen.zaloUserId}</span>
                <span className="ns-cap">SĐT: {citizen.phone || "Chưa liên kết"}</span>
              </span>
            </div>
            <div style={css("margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:10px")}>
              <button type="button" className="ns-rankpill" onClick={() => navigate("/tich-diem")}>
                <Icon3 name={rankIcon} />
                {citizen.tier ? citizen.tier.name : "Chưa xếp hạng"}
                <svg className="ns-sv" viewBox="0 0 24 24" width="16" height="16" style={css("width:16px;height:16px")}>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <button type="button" className="ns-fld" onClick={openVillages} style={css("flex:1;min-height:44px")}>
                <XIcon name="pin" size={18} />
                <span style={css("flex:1;font-size:13px;text-align:left")}>
                  {citizen.village ? citizen.village.name : "Chọn thôn"}
                </span>
                <svg className="ns-sv" viewBox="0 0 24 24" width="16" height="16" style={css("color:#7F9686")}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          {oaId && (
            <div style={css("padding:14px 16px 0")}>
              <div
                className="ns-rs"
                style={css(
                  `animation-delay:.08s;display:flex;align-items:center;gap:12px;padding:14px 14px 14px 16px;border-radius:24px;color:#fff;${
                    citizen.followedOA
                      ? "background:linear-gradient(120deg,#0E6B4B,#1FA36B);box-shadow:0 16px 30px -18px #0E6B4B"
                      : "background:linear-gradient(120deg,#0C3B2A,#1E7A4C);box-shadow:0 16px 30px -18px #0C3B2A"
                  }`
                )}
              >
                <span style={css("flex:0 0 44px;height:44px;border-radius:15px;background:rgba(255,255,255,.18);display:grid;place-items:center")}>
                  <XIcon name="chat" size={24} />
                </span>
                <span style={css("flex:1;font-size:13.5px;font-weight:700;line-height:1.35")}>
                  {citizen.followedOA ? "Đã quan tâm" : "Chưa quan tâm"} Zalo OA {n.office}
                </span>
                <button
                  type="button"
                  className="ns-oab"
                  onClick={toggleFollow}
                  style={css("background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.4)")}
                >
                  {citizen.followedOA ? "Bỏ quan tâm" : "Quan tâm"}
                </button>
              </div>
            </div>
          )}

          <div style={css("padding:14px 16px 0")}>
            <div className="ns-card ns-rs" style={css("animation-delay:.14s;padding:16px 18px")}>
              <div className="ns-lab">Mã giới thiệu của tôi</div>
              <div style={css("display:flex;align-items:center;justify-content:space-between;margin-top:6px")}>
                <b style={css("font-family:'Space Grotesk',sans-serif;font-size:30px;letter-spacing:.08em;color:#14603C")}>
                  {citizen.referralCode}
                </b>
                <button type="button" className="ns-chip" onClick={copyCode} style={css("background:#EAF2FC")}>
                  <XIcon name="copy" size={16} />
                  <span>Sao chép</span>
                </button>
              </div>
              <div className="ns-cap" style={css("margin-top:4px")}>
                Mời người thân dùng {n.appName} để cùng nhận điểm thưởng
              </div>
            </div>
          </div>

          <div style={css("padding:14px 16px 0")}>
            <div className="ns-card ns-rs" style={css("animation-delay:.2s;overflow:hidden")}>
              <button type="button" className="ns-row" onClick={share}>
                <span className="ns-gi y"><XIcon name="send" size={24} /></span>
                <span style={css("flex:1;display:flex;flex-direction:column")}>
                  <span className="ns-nm">Chia sẻ Mini App</span>
                  <span className="ns-sb">Mời người thân cùng sử dụng</span>
                </span>
                <span className="ns-beta" style={css("background:#DCF3E6;color:#18633F")}>+{referrerPoints} điểm</span>
              </button>
              <button
                type="button"
                className="ns-row"
                onClick={() => {
                  setReferralError("");
                  setReferralSheet(true);
                }}
              >
                <span className="ns-gi b"><XIcon name="adduser" size={24} /></span>
                <span style={css("flex:1;display:flex;flex-direction:column")}>
                  <span className="ns-nm">Nhập mã giới thiệu ứng dụng</span>
                  {citizen.referredBy && <span className="ns-sb">Bạn đã nhập mã giới thiệu</span>}
                </span>
                <Chevron />
              </button>
              <button type="button" className="ns-row" onClick={() => navigate("/phan-anh-cua-toi")}>
                <span className="ns-gi o"><XIcon name="megaphone" size={24} /></span>
                <span className="ns-nm" style={css("flex:1")}>Phản ánh của bạn</span>
                <Chevron />
              </button>
              <button type="button" className="ns-row" onClick={pin}>
                <span className="ns-gi v"><XIcon name="pin" size={24} /></span>
                <span style={css("flex:1;display:flex;flex-direction:column")}>
                  <span className="ns-nm">Ghim ứng dụng ra màn hình</span>
                  <span className="ns-sb">Thêm lối tắt vào màn hình chính</span>
                </span>
                <Chevron />
              </button>
              <button type="button" className="ns-row" onClick={() => navigate("/thong-tin-ung-dung")}>
                <span className="ns-gi s"><XIcon name="info" size={24} /></span>
                <span className="ns-nm" style={css("flex:1")}>Thông tin ứng dụng</span>
                <Chevron />
              </button>
              <button type="button" className="ns-row" onClick={() => navigate("/tich-diem", { state: { tab: "the-le" } })}>
                <span className="ns-gi s"><XIcon name="book" size={24} /></span>
                <span className="ns-nm" style={css("flex:1")}>Giới thiệu chung</span>
                <Chevron />
              </button>
            </div>
          </div>

          <div style={css("padding:14px 16px 110px")}>
            <button type="button" className="ns-bt o" style={css("width:100%")} onClick={relink} disabled={busy}>
              <XIcon name="refresh" size={20} />
              Liên kết lại
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="ns-toast">{toast}</div>}

      <Sheet visible={villageSheet} onClose={() => setVillageSheet(false)} autoHeight swipeToClose>
        <div className="ns-sheet">
          <div className="ns-sheet__title">Chọn thôn</div>
          <p className="ns-sheet__desc">Chọn nơi bạn sinh sống để nhận thông báo đúng khu vực.</p>
          {villages === null && <div className="ns-sheet__empty">Đang tải…</div>}
          {villages && villages.length === 0 && <div className="ns-sheet__empty">Danh sách thôn đang được cập nhật.</div>}
          <div className="ns-sheet__list">
            {(villages || []).map((v) => (
              <button
                key={v._id}
                type="button"
                className={`ns-opt ${citizen.village?.id === v._id ? "ns-on" : ""}`}
                onClick={() => chooseVillage(v)}
                disabled={busy}
              >
                <span>{v.ten}</span>
                {citizen.village?.id === v._id && (
                  <svg className="ns-sv" viewBox="0 0 24 24" width="20" height="20" style={css("color:#2E9E66")}>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </Sheet>

      <Sheet visible={referralSheet} onClose={() => setReferralSheet(false)} autoHeight swipeToClose>
        <div className="ns-sheet">
          <div style={css("display:flex;align-items:center;gap:12px")}>
            <span className="ns-gi b"><XIcon name="adduser" size={24} /></span>
            <h2 style={css("margin:0;font-size:18px;font-weight:800")}>Nhập mã giới thiệu</h2>
          </div>
          <p className="ns-sheet__desc">Nhập mã của người đã mời bạn để cả hai cùng nhận điểm thưởng.</p>
          {citizen.referredBy ? (
            <div className="ns-sheet__empty">Bạn đã nhập mã giới thiệu trước đó.</div>
          ) : (
            <>
              <input
                className="ns-inp"
                value={referralInput}
                maxLength={6}
                placeholder="Ví dụ: ABC123"
                aria-label="Mã giới thiệu"
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              />
              {referralError && <div className="ns-error">{referralError}</div>}
              <div className="ns-sheet__actions">
                <button type="button" className="ns-bt o" style={css("flex:1")} onClick={() => setReferralSheet(false)}>
                  Hủy
                </button>
                <button
                  type="button"
                  className="ns-bt p"
                  style={css("flex:1")}
                  onClick={redeem}
                  disabled={busy || referralInput.trim().length !== 6}
                >
                  Xác nhận
                </button>
              </div>
            </>
          )}
        </div>
      </Sheet>
    </Page>
  );
};

export default CitizenPage;
