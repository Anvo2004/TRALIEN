import React, { useState } from "react";
import { Page, Header, Box } from "zmp-ui";
import IDEAS, { IDEA_FIELDS, IDEA_STATS } from "../data/ideas.js";

const IdeasPage = () => {
  const [tab, setTab] = useState("view");
  const [form, setForm] = useState({
    name: "",
    field: "",
    title: "",
    content: "",
  });

  const updateField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: nối API lưu trữ hiến kế thật — hiện chỉ là giao diện tĩnh
    alert("Cảm ơn bạn đã gửi hiến kế! (giao diện thử nghiệm, chưa lưu dữ liệu)");
    setForm({ name: "", field: "", title: "", content: "" });
  };

  return (
    <Page className="page-ideas">
      <Header title="Hiến kế" />

      <div className="ideas-hero">
        <span className="ideas-hero__icon">💡</span>
        <div className="ideas-hero__title">Người dân hiến kế</div>
        <div className="ideas-hero__desc">
          Đóng góp ý kiến, sáng kiến xây dựng xã Trà Liên ngày càng văn
          minh, hiện đại
        </div>
      </div>

      <Box className="section">
        <div className="warning-box">
          🚧 <strong>Chức năng đang thử nghiệm</strong>
          <div>
            Tính năng Hiến kế đang được phát triển và hoàn thiện. Dữ liệu gửi
            đi ở thời điểm hiện tại chỉ mang tính thử nghiệm. Mong bạn thông
            cảm!
          </div>
        </div>

        <div className="tabs-underline">
          <button
            type="button"
            className={tab === "view" ? "is-active" : ""}
            onClick={() => setTab("view")}
          >
            📋 Xem hiến kế
          </button>
          <button
            type="button"
            className={tab === "submit" ? "is-active" : ""}
            onClick={() => setTab("submit")}
          >
            ✍️ Gửi hiến kế
          </button>
        </div>

        {tab === "view" ? (
          <>
            <div className="stats-row stats-row--three">
              <div className="stats-row__item">
                <div className="stats-row__value">{IDEA_STATS.total}</div>
                <div className="stats-row__label">Tổng hiến kế</div>
              </div>
              <div className="stats-row__item stats-row__item--success">
                <div className="stats-row__value">{IDEA_STATS.done}</div>
                <div className="stats-row__label">Đã thực hiện</div>
              </div>
              <div className="stats-row__item stats-row__item--warning">
                <div className="stats-row__value">{IDEA_STATS.inProgress}</div>
                <div className="stats-row__label">Đang triển khai</div>
              </div>
            </div>

            <div className="idea-list">
              {IDEAS.map((idea) => (
                <div key={idea.id} className="idea-card">
                  <div className="idea-card__meta">
                    <span className="idea-card__field">{idea.field}</span>
                    <span className="idea-card__status">{idea.status}</span>
                  </div>
                  <div className="idea-card__title">{idea.title}</div>
                  <div className="idea-card__content">{idea.content}</div>
                  <div className="idea-card__footer">
                    <span>
                      👤 {idea.author} · 📅 {idea.date}
                    </span>
                    <span className="idea-card__likes">👍 {idea.likes}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <form className="idea-form" onSubmit={handleSubmit}>
            <label>
              👤 Họ và tên (không bắt buộc)
              <input
                placeholder="Nhập họ tên hoặc để ẩn danh..."
                value={form.name}
                onChange={updateField("name")}
              />
            </label>
            <label>
              🏷️ Lĩnh vực *
              <select value={form.field} onChange={updateField("field")} required>
                <option value="">-- Chọn lĩnh vực --</option>
                {IDEA_FIELDS.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </label>
            <label>
              📌 Tiêu đề hiến kế *
              <input
                placeholder="Tóm tắt ngắn gọn ý kiến của bạn..."
                value={form.title}
                onChange={updateField("title")}
                required
              />
            </label>
            <label>
              💬 Nội dung chi tiết *
              <textarea
                placeholder="Mô tả chi tiết ý kiến, sáng kiến của bạn. Nêu rõ vấn đề và giải pháp đề xuất..."
                rows={5}
                value={form.content}
                onChange={updateField("content")}
                required
              />
            </label>
            <div className="idea-form__note">
              ℹ️ Hiến kế của bạn sẽ được UBND xã xem xét và phản hồi trong
              vòng 5-7 ngày làm việc.
            </div>
            <button type="submit" className="idea-form__submit">
              💡 Gửi hiến kế
            </button>
          </form>
        )}
      </Box>
    </Page>
  );
};

export default IdeasPage;
