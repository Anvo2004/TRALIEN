import { openWebview } from "zmp-sdk/apis";

// Trong Zalo Mini App, thẻ <a target="_blank"> không mở được trang ngoài —
// webview của Mini App chặn điều hướng đó. Phải dùng API openWebview của SDK
// (ngoài Zalo, VD khi đang chạy `vite dev` trong trình duyệt thường, API này
// không có nên fallback sang window.open).
export function openExternal(url) {
  // openWebview từ chối URL http:// (không secure) dù trang đích có redirect
  // sang https — link cào tin đôi khi ở dạng http nên phải ép https trước khi mở,
  // nếu không openWebview reject và window.open cũng vô hiệu trong app Zalo thật.
  const safeUrl = url.replace(/^http:\/\//i, "https://");
  openWebview({ url: safeUrl, config: { style: "normal" } }).catch(() => {
    window.open(safeUrl, "_blank");
  });
}
