import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../data/api-config.js";
import { openExternal } from "../utils/open-external.js";
import AppIcon from "./app-icon.jsx";

const QuickLinksGrid = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/app-links?section=quick_link`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  const openLink = (item) => (item.href ? openExternal(item.href) : navigate(item.path));

  return (
    <div className="ns-card" style={{ margin: "0 16px", padding: "14px 6px 10px" }}>
      <div className="ns-st" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", rowGap: 10 }}>
        {items.map((item) => (
          <button key={item._id} type="button" className="ns-tile" onClick={() => openLink(item)}>
            <span className="ns-ic3">
              <AppIcon iconUrl={item.iconUrl} name={item.icon} color={item.color || "n"} imgClass="icon3d--md" vectorClass="i24" />
            </span>
            <span className="ns-lb">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickLinksGrid;
