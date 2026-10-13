import { useEffect, useState } from "react";

// "a:b;c-d:e" → { a: "b", cD: "e" } — để giữ nguyên chuỗi style inline của bản
// thiết kế (sao chép thẳng, không phải đổi tay từng thuộc tính sang camelCase).
export const css = (s) =>
  Object.fromEntries(
    s
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const i = d.indexOf(":");
        let k = d.slice(0, i).trim();
        const v = d.slice(i + 1).trim();
        k = k.startsWith("-webkit-") ? "Webkit" + k.slice(8) : k;
        k = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        return [k, v];
      })
  );

// Đếm số tăng dần (ease-out 1,3s) cho khối thống kê đầu trang chủ — như bản thiết kế.
export function useCountUp(target, ms = 1300) {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (target == null) return undefined;
    let raf;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setK(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return target == null ? null : target * k;
}

export const fmtInt = (n) =>
  n == null ? "—" : String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const fmtDec = (n, d = 2) => (n == null ? "—" : n.toFixed(d).replace(".", ","));
