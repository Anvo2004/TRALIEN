import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";
import Icon from "./icon.jsx";

const QuickLinksGrid = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/app-links?section=quick_link`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="quick-links">
      {items.map((item) => (
        <button
          key={item._id}
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
