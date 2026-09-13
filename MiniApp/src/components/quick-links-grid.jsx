import React from "react";
import { useNavigate } from "react-router-dom";
import QUICK_LINKS from "../data/quick-links.js";
import { openExternal } from "../utils/open-external.js";
import Icon from "./icon.jsx";

const QuickLinksGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="quick-links">
      {QUICK_LINKS.map((item) => (
        <button
          key={item.label}
          type="button"
          className="quick-links__item"
          onClick={() =>
            item.href ? openExternal(item.href) : navigate(item.path)
          }
        >
          <span className={`tile tile-${item.color || "n"}`}>
            <Icon name={item.icon} className="i24" />
          </span>
          <span className="quick-links__label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickLinksGrid;
