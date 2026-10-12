import React, { useEffect, useState } from "react";
import { Page, Header } from "zmp-ui";
import Icon from "../components/icon.jsx";
import {
  TYPE_LABELS,
  fetchProgram,
  fetchTransactions,
  formatDateTime,
  isLinked,
} from "../data/citizen.js";

// Icon minh hoạ cho từng loại giao dịch điểm (lấy trong bộ icon-paths.js).
const TYPE_ICONS = {
  register: ["badge", "b"],
  referrer: ["groups", "c"],
  referee: ["groups", "c"],
  survey: ["star", "a"],
  feedback: ["rate_review", "o"],
  event: ["event_available", "g"],
  exam: ["description", "v"],
  adjust: ["tips_and_updates", "n"],
};

const PointsPage = () => {
  const [program, setProgram] = useState(null);
  const [items, setItems] = useState(null);
  const [points, setPoints] = useState(null);

  useEffect(() => {
    fetchProgram()
      .then((d) => setProgram(d.program))
      .catch(() => setProgram(null));

    // Chưa liên kết thì không gọi API cần access token — vẫn xem được thể lệ.
    if (!isLinked()) {
      setItems([]);
      return;
    }
    fetchTransactions()
      .then((d) => {
        const rows = d.items || [];
        setItems(rows);
        setPoints(rows.reduce((sum, r) => sum + (r.points || 0), 0));
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <Page className="page-citizen">
      <Header title="Tích điểm công dân" />

      <div className="points-total">
        <span className="points-total__label">Tổng điểm</span>
        <span className="points-total__num">{points === null ? "—" : points}</span>
      </div>

      <div className="citizen-sec">Nhật ký điểm</div>
      <div className="listcard">
        {items === null ? (
          <div className="citizen-empty">Đang tải…</div>
        ) : items.length === 0 ? (
          <div className="citizen-empty">Chưa có hoạt động nào được ghi nhận.</div>
        ) : (
          items.map((it, i) => {
            const [icon, color] = TYPE_ICONS[it.type] || TYPE_ICONS.adjust;
            return (
              <div key={`${it.createdAt}-${i}`} className="prow">
                <span className={`tile sm tile-${color}`}>
                  <Icon name={icon} className="i20" />
                </span>
                <span className="prow__body">
                  <span className="prow__title">{it.note || TYPE_LABELS[it.type] || "Điểm thưởng"}</span>
                  <span className="prow__desc">{formatDateTime(it.createdAt)}</span>
                </span>
                <span className={`points-delta${it.points < 0 ? " is-minus" : ""}`}>
                  {it.points > 0 ? `+${it.points}` : it.points}
                </span>
              </div>
            );
          })
        )}
      </div>

      {program && (
        <>
          <div className="citizen-sec">Đối tượng áp dụng</div>
          <div className="points-box">{program.target}</div>

          <div className="citizen-sec">Cơ chế tích lũy điểm</div>
          <div className="listcard">
            {Object.entries(program.rules).map(([key, rule]) => {
              const [icon, color] = TYPE_ICONS[key] || TYPE_ICONS.adjust;
              return (
                <div key={key} className="prow">
                  <span className={`tile sm tile-${color}`}>
                    <Icon name={icon} className="i20" />
                  </span>
                  <span className="prow__body">
                    <span className="prow__title">{rule.title}</span>
                    <span className="prow__desc">{rule.desc}</span>
                  </span>
                  <span className="points-delta">+{rule.points}</span>
                </div>
              );
            })}
          </div>

          <div className="citizen-sec">Phân hạng Công dân số</div>
          <div className="points-tiers">
            {program.tiers.map((t) => (
              <div key={t.key} className="points-tier">
                <span className="points-tier__name">{t.name}</span>
                <span className="points-tier__min">từ {t.min} điểm</span>
              </div>
            ))}
          </div>

          <div className="citizen-sec">Quyền lợi và hình thức ghi nhận</div>
          <div className="points-box">
            {program.benefits.length === 0 ? (
              "Đang cập nhật."
            ) : (
              program.benefits.map((b, i) => (
                <div key={i} className="points-benefit">
                  <div className="points-benefit__title">{b.title}</div>
                  {b.items.map((item, j) => (
                    <div key={j} className="points-benefit__item">
                      <Icon name="star" className="i12 amber" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}

      <div className="points-note">
        Điểm được hệ thống tự động ghi nhận khi bạn hoàn thành các hoạt động trên.
      </div>
    </Page>
  );
};

export default PointsPage;
