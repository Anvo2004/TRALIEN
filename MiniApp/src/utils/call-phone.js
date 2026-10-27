import { openPhone } from "zmp-sdk/apis";

// Trong Zalo Mini App, thẻ <a href="tel:..."> không mở được cuộc gọi — webview
// của Mini App chặn điều hướng đó. Phải dùng API openPhone của SDK (chỉ chạy
// trong Zalo mobile; ngoài Zalo, VD trình duyệt máy tính, fallback sang tel:).
export function callPhone(phone) {
  const number = String(phone || "").replace(/[^\d+]/g, "");
  if (!number) return;
  const fallback = () => {
    window.location.href = `tel:${number}`;
  };
  try {
    openPhone({ phoneNumber: number }).catch(fallback);
  } catch {
    fallback();
  }
}
