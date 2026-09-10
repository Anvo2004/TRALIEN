import React, { useEffect, useRef, useState } from "react";
import { Page, Header } from "zmp-ui";
import { getUserInfo } from "zmp-sdk/apis";
import API_BASE_URL from "../data/api-config.js";

const SUGGESTED_QUESTIONS = [
  "Thủ tục đăng ký khai sinh cần giấy tờ gì?",
  "Cách nộp hồ sơ trực tuyến qua Cổng dịch vụ công",
  "Lệ phí chứng thực bản sao là bao nhiêu?",
  "Thời gian giải quyết hồ sơ xác nhận cư trú",
];

const AssistantPage = () => {
  const [zaloUser, setZaloUser] = useState(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // [{ role: "user"|"assistant", text }]
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getUserInfo({ autoRequestPermission: true })
      .then(({ userInfo }) => setZaloUser(userInfo))
      .catch(() => setZaloUser(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const sendQuestion = async (question) => {
    const q = question.trim();
    if (!q || sending) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/public/assistant/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: zaloUser?.id, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không trả lời được lúc này");
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: `⚠️ ${err.message}` }]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <Page className="page-assistant">
      <Header title="Trợ lý số" />

      <div className="assistant">
        {messages.length === 0 ? (
          <>
            <div className="assistant__intro">
              <div className="assistant__title">Xin chào! 👋</div>
              <div className="assistant__subtitle">
                AI giúp bạn trả lời thắc mắc về thủ tục hành chính công
              </div>
            </div>

            <div className="assistant__suggestions">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="assistant__suggestion"
                  onClick={() => sendQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="assistant__messages">
            {messages.map((msg, index) => (
              <div key={index} className={`assistant__bubble assistant__bubble--${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {sending && (
              <div className="assistant__bubble assistant__bubble--assistant assistant__bubble--typing">
                Đang trả lời...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form className="assistant__input-bar" onSubmit={handleSubmit}>
        <input
          className="assistant__input"
          placeholder="Nhập câu hỏi của bạn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="assistant__send" disabled={sending || !input.trim()}>
          ↑
        </button>
      </form>
      <div className="assistant__disclaimer">AI có thể mắc lỗi trong quá trình tổng hợp</div>
    </Page>
  );
};

export default AssistantPage;
