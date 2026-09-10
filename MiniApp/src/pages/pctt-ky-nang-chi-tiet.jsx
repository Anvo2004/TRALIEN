import React from "react";
import { useParams } from "react-router-dom";
import { Page, Header } from "zmp-ui";
import PCTT_SKILLS from "../data/pctt-skills.js";
import API_BASE_URL from "../data/api-config.js";

const PcttKyNangChiTietPage = () => {
  const { id } = useParams();
  const skill = PCTT_SKILLS.find((s) => s.id === id);

  if (!skill) {
    return (
      <Page className="page-lookup">
        <Header title="Kỹ năng PCTT" />
        <div className="warning-box">Không tìm thấy nội dung cho mục này.</div>
      </Page>
    );
  }

  return (
    <Page className="page-pctt-detail">
      <Header title={skill.label} />
      <div className="pctt-detail">
        {skill.videos.length > 0 && (
          <div className="pctt-detail__videos">
            {skill.videos.map((video) => (
              <div key={video.path} className="pctt-detail__video-item">
                <div className="pctt-detail__video-title">▶️ {video.title}</div>
                <video controls playsInline src={`${API_BASE_URL}${video.path}`} />
              </div>
            ))}
          </div>
        )}

        <div className="pctt-detail__images">
          {skill.images.map((img) => (
            <figure key={img.url} className="pctt-detail__image-item">
              <img src={img.url} alt={img.caption} loading="lazy" />
              <figcaption>{img.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Page>
  );
};

export default PcttKyNangChiTietPage;
