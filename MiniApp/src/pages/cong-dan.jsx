import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header, Sheet } from "zmp-ui";
import {
  getUserInfo,
  getPhoneNumber,
  followOA,
  unfollowOA,
  openShareSheet,
  createShortcut,
} from "zmp-sdk/apis";
import Icon from "../components/icon.jsx";
import API_BASE_URL from "../data/api-config.js";
import SITE from "../data/site.js";
import logo from "../static/logo-tralien.png";
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

const FOLLOWED_KEY = "tralien_oa_followed";
const setLocal = (k, v) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* WebView có thể chặn localStorage — bỏ qua */
  }
};

// Hàng menu dùng lại .prow/.tile của trang Dịch vụ để đồng bộ với phần còn lại
// của app, thay vì dựng kiểu riêng cho tab này.
const MenuRow = ({ icon, color, title, sub, value, onClick, disabled }) => (
  <button type="button" className="prow" onClick={onClick} disabled={disabled}>
    <span className={`tile sm tile-${color}`}>
      <Icon name={icon} className="i20" />
    </span>
    <span className="prow__body">
      <span className="prow__title">{title}</span>
      {sub && <span className="prow__desc">{sub}</span>}
    </span>
    {value && <span className="citizen-row__value">{value}</span>}
    <Icon name="chevron_right" className="i18 grey" />
  </button>
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

  // Lấy tên/ảnh Zalo → tự đăng ký (lần đầu được cộng điểm) → trả hồ sơ công dân.
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

  // SĐT: xin tự động một lần sau khi đăng ký; người dùng từ chối thì không hỏi
  // lại cho tới khi bấm "Liên kết lại".
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

  // Lần đầu vào tab: xin phép một lần (tên, ảnh, SĐT), đăng ký tài khoản, rồi
  // mời chọn thôn để hồ sơ đầy đủ.
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
          title: SITE.appName,
          description: `Ứng dụng của UBND xã ${SITE.wardName}. Nhập mã giới thiệu ${citizen.referralCode} để nhận điểm thưởng.`,
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

  if (loading) {
    return (
      <Page className="page-citizen">
        <Header title="Công dân số" />
        <div className="citizen-empty">Đang tải thông tin…</div>
      </Page>
    );
  }

  // ---- Chưa liên kết: màn xin phép
  if (!citizen) {
    return (
      <Page className="page-citizen">
        <Header title="Công dân số" />

        <div className="citizen-intro">
          <img className="citizen-intro__logo" src={logo} alt="" />
          <div className="citizen-intro__title">Liên kết tài khoản Zalo</div>
          <div className="citizen-intro__desc">
            {SITE.appName} cần bạn cho phép dùng các thông tin sau:
          </div>

          <div className="citizen-perm">
            <span className="tile sm tile-b">
              <Icon name="badge" className="i20" />
            </span>
            <div>
              <div className="citizen-perm__name">Tên và ảnh đại diện Zalo</div>
              <div className="citizen-perm__desc">Hiển thị trong hồ sơ công dân của bạn.</div>
            </div>
          </div>
          <div className="citizen-perm">
            <span className="tile sm tile-p">
              <Icon name="call" className="i20" />
            </span>
            <div>
              <div className="citizen-perm__name">Số điện thoại</div>
              <div className="citizen-perm__desc">
                Để cán bộ liên hệ khi xử lý phản ánh và xác minh tài khoản tích điểm.
              </div>
            </div>
          </div>

          {error && <div className="citizen-error">{error}</div>}

          <button type="button" className="citizen-cta" onClick={link} disabled={busy}>
            {busy ? "Đang liên kết…" : "Cho phép & liên kết"}
          </button>
          <button type="button" className="citizen-link" onClick={() => navigate("/tich-diem")}>
            Xem thể lệ tích điểm trước
          </button>
        </div>

        {toast && <div className="citizen-toast">{toast}</div>}
      </Page>
    );
  }

  // ---- Đã liên kết: hồ sơ + menu
  return (
    <Page className="page-citizen">
      <Header title="Công dân số" />

      <div className="citizen-card">
        <div className="citizen-card__head">
          {citizen.avatar ? (
            <img className="citizen-card__avatar" src={citizen.avatar} alt="" />
          ) : (
            <span className="citizen-card__avatar citizen-card__avatar--empty">
              <Icon name="groups" className="i24" />
            </span>
          )}
          <div className="citizen-card__id">
            <div className="citizen-card__name">{citizen.displayName || "Công dân"}</div>
            <div className="citizen-card__tier">
              <Icon name="star" className="i13" />
              {citizen.tier ? citizen.tier.name : "Chưa xếp hạng"}
            </div>
          </div>
          <button type="button" className="citizen-points" onClick={() => navigate("/tich-diem")}>
            <span className="citizen-points__num">{citizen.points}</span>
            <span className="citizen-points__unit">điểm</span>
          </button>
        </div>

        {citizen.nextTier && (
          <div className="citizen-progress">
            <div className="citizen-progress__bar">
              <span style={{ width: `${citizen.progress}%` }} />
            </div>
            <div className="citizen-progress__note">
              Còn {citizen.pointsNeeded} điểm nữa lên hạng {citizen.nextTier.name}
            </div>
          </div>
        )}
      </div>

      <div className="citizen-sec">Cá nhân</div>
      <div className="listcard">
        <MenuRow
          icon="holiday_village"
          color="g"
          title="Thôn/Tổ bạn sinh sống"
          sub={citizen.village ? null : "Chọn để hoàn thiện hồ sơ"}
          value={citizen.village ? citizen.village.name : null}
          onClick={openVillages}
        />
        <MenuRow
          icon="call"
          color="p"
          title="Số điện thoại"
          sub={citizen.phone ? null : "Chưa liên kết"}
          value={citizen.phone || null}
          onClick={relink}
        />
        <MenuRow
          icon="rate_review"
          color="o"
          title="Phản ánh của bạn"
          sub="Xem các phản ánh đã gửi"
          onClick={() => navigate("/phan-anh-cua-toi")}
        />
      </div>

      <div className="citizen-sec">Giới thiệu & điểm thưởng</div>
      <div className="listcard">
        <button type="button" className="prow" onClick={copyCode}>
          <span className="tile sm tile-v">
            <Icon name="qr_code_2" className="i20" />
          </span>
          <span className="prow__body">
            <span className="prow__title">Mã giới thiệu của tôi</span>
            <span className="prow__desc">Bạn bè nhập mã này, cả hai cùng được điểm</span>
          </span>
          <span className="citizen-code">{citizen.referralCode}</span>
          <Icon name="content_copy" className="i18 grey" />
        </button>
        <MenuRow
          icon="north_east"
          color="b"
          title="Chia sẻ Mini App"
          sub="Mời người thân cùng sử dụng"
          onClick={share}
        />
        <MenuRow
          icon="groups"
          color="c"
          title={citizen.referredBy ? "Bạn đã nhập mã giới thiệu" : "Nhập mã giới thiệu"}
          sub={citizen.referredBy ? null : `Nhập mã của người giới thiệu, +${referrerPoints} điểm`}
          onClick={() => !citizen.referredBy && setReferralSheet(true)}
          disabled={citizen.referredBy}
        />
        <MenuRow
          icon="star"
          color="a"
          title="Tích điểm & thể lệ"
          sub="Nhật ký điểm, phân hạng, quyền lợi"
          onClick={() => navigate("/tich-diem")}
        />
      </div>

      <div className="citizen-sec">Tiện ích</div>
      <div className="listcard">
        {oaId && (
          <MenuRow
            icon="campaign"
            color="b"
            title={citizen.followedOA ? "Đã quan tâm Zalo OA" : "Quan tâm Zalo OA"}
            sub={citizen.followedOA ? "Bấm để bỏ quan tâm" : "Nhận thông báo mới từ xã"}
            onClick={toggleFollow}
          />
        )}
        <MenuRow
          icon="home"
          color="n"
          title="Ghim ứng dụng ra màn hình"
          sub="Thêm lối tắt vào màn hình chính"
          onClick={pin}
        />
        <MenuRow
          icon="description"
          color="g"
          title="Thông tin ứng dụng"
          sub="Phiên bản, nguồn tư liệu"
          onClick={() => navigate("/thong-tin-ung-dung")}
        />
      </div>

      <Sheet visible={villageSheet} onClose={() => setVillageSheet(false)} autoHeight>
        <div className="citizen-sheet">
          <div className="citizen-sheet__title">Chọn Thôn/Tổ</div>
          {villages === null ? (
            <div className="citizen-empty">Đang tải…</div>
          ) : villages.length === 0 ? (
            <div className="citizen-empty">Danh sách thôn đang được cập nhật.</div>
          ) : (
            <div className="citizen-villages">
              {villages.map((v) => (
                <button
                  key={v._id}
                  type="button"
                  className={`citizen-village${
                    citizen.village && citizen.village.id === v._id ? " is-active" : ""
                  }`}
                  onClick={() => chooseVillage(v)}
                  disabled={busy}
                >
                  {v.ten}
                </button>
              ))}
            </div>
          )}
        </div>
      </Sheet>

      <Sheet visible={referralSheet} onClose={() => setReferralSheet(false)} autoHeight>
        <div className="citizen-sheet">
          <div className="citizen-sheet__title">Nhập mã giới thiệu</div>
          <div className="citizen-sheet__desc">
            Mã gồm 6 ký tự của người đã giới thiệu bạn. Mỗi người chỉ nhập một lần.
          </div>
          <input
            className="citizen-input"
            value={referralInput}
            onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
            placeholder="VD: K7M2QP"
            maxLength={6}
            autoCapitalize="characters"
          />
          {referralError && <div className="citizen-error">{referralError}</div>}
          <button
            type="button"
            className="citizen-cta"
            onClick={redeem}
            disabled={busy || referralInput.length !== 6}
          >
            {busy ? "Đang kiểm tra…" : "Xác nhận"}
          </button>
        </div>
      </Sheet>

      {toast && <div className="citizen-toast">{toast}</div>}
    </Page>
  );
};

export default CitizenPage;
