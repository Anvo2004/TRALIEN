import React, { useEffect, useState } from "react";
import API_BASE_URL from "../data/api-config.js";

function fmt(n) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("vi-VN");
}

const StatsRow = () => {
  const [danSo, setDanSo] = useState({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/dan-so`)
      .then((res) => res.json())
      .then((data) => setDanSo(data || {}))
      .catch(() => setDanSo({}));
  }, []);

  const stats = [
    { label: "Dân số", value: fmt(danSo.tongDanSo) },
    { label: "Thôn", value: fmt(danSo.soThon) },
    { label: "Diện tích (km²)", value: danSo.dienTichKm2 != null ? String(danSo.dienTichKm2).replace(".", ",") : "—" },
    { label: "Hộ dân", value: fmt(danSo.hoDan) },
  ];

  return (
    <div className="stats-row">
      {stats.map((stat) => (
        <div key={stat.label} className="stats-row__item">
          <div className="stats-row__value">{stat.value}</div>
          <div className="stats-row__label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsRow;
