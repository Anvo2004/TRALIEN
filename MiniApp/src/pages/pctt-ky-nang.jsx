import React from "react";
import { useNavigate } from "react-router-dom";
import { Page, Header, Box } from "zmp-ui";
import PCTT_SKILLS from "../data/pctt-skills.js";

const PcttKyNangPage = () => {
  const navigate = useNavigate();

  return (
    <Page className="page-lookup">
      <Header title="Kỹ năng PCTT" />

      <div className="lookup-hero">
        <span className="lookup-hero__icon">🎓</span>
        <div className="lookup-hero__title">Kỹ năng PCTT</div>
        <div className="lookup-hero__desc">
          Infographic và video hướng dẫn kỹ năng phòng chống thiên tai theo từng loại hình
        </div>
      </div>

      <Box className="section">
        <div className="quick-links">
          {PCTT_SKILLS.map((skill) => (
            <button
              key={skill.id}
              type="button"
              className="quick-links__item"
              onClick={() => navigate(`/pctt-ky-nang/${skill.id}`)}
            >
              <span className="quick-links__icon">{skill.icon}</span>
              <span className="quick-links__label">{skill.label}</span>
            </button>
          ))}
        </div>
      </Box>
    </Page>
  );
};

export default PcttKyNangPage;
