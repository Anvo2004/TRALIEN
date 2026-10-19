import React, { useEffect, useRef } from "react";
import { Page, Header } from "zmp-ui";
import { openDaNangAI } from "../data/assistant.js";

// Giữ route cũ cho các liên kết đã lưu; không còn giao diện hỏi đáp nội bộ.
const AssistantPage = () => {
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    openDaNangAI();
  }, []);

  return (
    <Page className="page-assistant">
      <Header title="Trợ lý số DaNang AI" />
      <div className="assistant">
        <div className="assistant__intro">
          <div className="assistant__title">DaNang AI</div>
          <div className="assistant__subtitle">Hỏi đáp cùng trợ lý số DaNang AI.</div>
        </div>
        <button type="button" className="assistant__suggestion" onClick={openDaNangAI}>
          Mở DaNang AI
        </button>
      </div>
    </Page>
  );
};

export default AssistantPage;
