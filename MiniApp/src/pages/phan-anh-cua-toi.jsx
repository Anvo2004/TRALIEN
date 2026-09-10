import React, { useEffect, useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import { getAccessToken } from "zmp-sdk/apis";
import API_BASE_URL from "../data/api-config.js";

// Backend nhận diện người dùng qua access token Zalo, không qua userId client
// tự khai — nên trang này luôn chỉ thấy phản ánh của chính mình.
const STATUS_CLASS = {
  received: "my-reports__badge--received",
  processing: "my-reports__badge--processing",
  answered: "my-reports__badge--answered",
};

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${formatDate(value)}`;
}

// "còn 3 ngày" / "quá hạn 2 ngày" — chỉ hiện khi chưa trả lời.
function deadlineText(deadline, status) {
  if (!deadline || status === "answered") return null;
  const days = Math.ceil((new Date(deadline) - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return { text: `quá hạn ${Math.abs(days)} ngày`, late: true };
  if (days === 0) return { text: "đến hạn hôm nay", late: true };
  return { text: `còn ${days} ngày`, late: false };
}

const MyReportsPage = () => {
  const [tab, setTab] = useState("mine"); // "mine" | "code"
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  // Tra cứu theo mã (mã 1022, xem Backend/src/routes/publicFeedback.js) — dành
  // cho người không mở đúng tài khoản Zalo đã gửi, không cần đăng nhập Zalo.
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeResult, setCodeResult] = useState(null);

  const searchByCode = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setCodeLoading(true);
    setCodeError("");
    setCodeResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/public/feedbacks/by-code/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tra cứu được phản ánh");
      setCodeResult(data.feedback);
    } catch (err) {
      setCodeError(err.message);
    } finally {
      setCodeLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const accessToken = await getAccessToken();
        const res = await fetch(`${API_BASE_URL}/api/public/feedbacks/mine`, {
          headers: { "x-zalo-access-token": accessToken },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không tải được danh sách phản ánh");
        if (!cancelled) setReports(data.feedbacks || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const renderTimeline = (timeline) => (
    <ol className="my-reports__timeline">
      {timeline.map((step) => (
        <li
          key={step.key}
          className={`my-reports__step ${step.at ? "my-reports__step--done" : ""}`}
        >
          <span className="my-reports__step-dot" />
          <div className="my-reports__step-body">
            <div className="my-reports__step-label">{step.label}</div>
            {step.at && <div className="my-reports__step-time">{formatDateTime(step.at)}</div>}
          </div>
        </li>
      ))}
    </ol>
  );

  const renderDetail = (item) => (
    <div className="my-reports__detail">
      {renderTimeline(item.timeline)}

      <div className="my-reports__block">
        <div className="my-reports__block-title">📝 Nội dung đã gửi</div>
        <p className="my-reports__block-text">{item.content}</p>
      </div>

      {item.address && (
        <div className="my-reports__block">
          <div className="my-reports__block-title">📍 Địa chỉ</div>
          <p className="my-reports__block-text">{item.address}</p>
        </div>
      )}

      {item.imageUrls.length > 0 && (
        <div className="my-reports__block">
          <div className="my-reports__block-title">🖼️ Ảnh đính kèm</div>
          <div className="my-reports__images">
            {item.imageUrls.map((url) => (
              <img key={url} src={url} alt="Ảnh phản ánh" />
            ))}
          </div>
        </div>
      )}

      {item.response ? (
        <div className="my-reports__response">
          <div className="my-reports__response-title">
            ✅ Phản hồi của UBND xã Trà Liên
          </div>
          <p className="my-reports__response-text">{item.response.text}</p>
          {item.response.sentAt && (
            <div className="my-reports__response-time">
              Trả lời lúc {formatDateTime(item.response.sentAt)}
            </div>
          )}
        </div>
      ) : (
        <div className="my-reports__pending-note">
          Phản ánh đang được xem xét. Bạn sẽ nhận được phản hồi qua Zalo ngay khi có kết quả.
        </div>
      )}
    </div>
  );

  const renderCard = (item, isOpen, onToggle) => {
    const dl = deadlineText(item.deadline, item.status);
    return (
      <div key={item.id} className="my-reports__card">
        <button type="button" className="my-reports__card-head" onClick={onToggle}>
          <div className="my-reports__card-top">
            <span className="my-reports__code">
              {item.code ? `#${item.code}` : "chờ mã 1022"}
            </span>
            <span className={`my-reports__badge ${STATUS_CLASS[item.status]}`}>
              {item.statusLabel}
            </span>
          </div>

          <div className="my-reports__title">{item.title || item.content}</div>

          <div className="my-reports__meta">
            {item.category && (
              <span>
                {item.category.icon} {item.category.name}
              </span>
            )}
            <span>{formatDate(item.createdAt)}</span>
            {dl && <span className={dl.late ? "my-reports__deadline--late" : ""}>{dl.text}</span>}
            <span className="my-reports__chevron">{isOpen ? "▲" : "▼"}</span>
          </div>
        </button>

        {isOpen && renderDetail(item)}
      </div>
    );
  };

  return (
    <Page className="page-my-reports">
      <Header title="Phản ánh của tôi" />
      <Box className="section">
        <div className="my-reports__tabs">
          <button
            type="button"
            className={`my-reports__tab ${tab === "mine" ? "my-reports__tab--active" : ""}`}
            onClick={() => setTab("mine")}
          >
            Của tôi
          </button>
          <button
            type="button"
            className={`my-reports__tab ${tab === "code" ? "my-reports__tab--active" : ""}`}
            onClick={() => setTab("code")}
          >
            Tra cứu theo mã
          </button>
        </div>

        {tab === "code" && (
          <div className="my-reports__code-lookup">
            <div className="my-reports__code-lookup-row">
              <input
                type="text"
                className="my-reports__code-input"
                placeholder="Nhập mã phản ánh (VD: GY123456)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchByCode()}
              />
              <button type="button" className="my-reports__code-btn" onClick={searchByCode}>
                🔍 Tra cứu
              </button>
            </div>

            {codeLoading && <div className="my-reports__state">Đang tra cứu…</div>}
            {!codeLoading && codeError && (
              <div className="my-reports__state my-reports__state--error">{codeError}</div>
            )}
            {!codeLoading &&
              !codeError &&
              codeResult &&
              renderCard(codeResult, true, () => {})}
          </div>
        )}

        {tab === "mine" && (
          <>
            {loading && <div className="my-reports__state">Đang tải…</div>}

            {!loading && error && (
              <div className="my-reports__state my-reports__state--error">{error}</div>
            )}

            {!loading && !error && reports.length === 0 && (
              <div className="my-reports__empty">
                <div className="my-reports__empty-icon">📭</div>
                <div className="my-reports__empty-title">Bạn chưa gửi phản ánh nào</div>
                <div className="my-reports__empty-desc">
                  Phản ánh gửi từ mục Góp ý sẽ hiện ở đây kèm tiến độ xử lý.
                </div>
              </div>
            )}

            {!loading &&
              !error &&
              reports.map((item) =>
                renderCard(item, openId === item.id, () =>
                  setOpenId(openId === item.id ? null : item.id)
                )
              )}
          </>
        )}
      </Box>
    </Page>
  );
};

export default MyReportsPage;
