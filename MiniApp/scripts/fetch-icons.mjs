// Tải các icon 3D cần đóng gói trong bundle MiniApp (tab bar + 2 màn có danh
// mục cố định). Chạy tự động trước `npm run build` và `npm run dev`.
//
// Vì sao không commit thẳng file ảnh vào repo: repo này public, mà giấy phép
// miễn phí của Icons8 cấm phát tán icon dưới dạng file rời — để 11 file PNG
// trong repo công khai là ai cũng tải về được như một bộ icon. Tải lúc build
// thì ảnh chỉ nằm trên máy build và trong bundle đã dựng.
// Nếu xã mua gói Icons8 hoặc chuyển repo sang private thì commit thẳng ảnh và
// xoá bước này cho pipeline bớt phụ thuộc mạng.
//
// Nguồn: Icons8 "3D Fluency" — https://icons8.com/icons/3d-fluency
// Ghi công đặt ở MiniApp/src/pages/thong-tin-ung-dung.jsx (bắt buộc theo giấy
// phép miễn phí). Xem thêm src/static/icons/README.md.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "static", "icons");

// file đích -> [slug Icons8, cỡ ảnh]. Tab bar hiện ở 26px nên 96px đủ nét trên
// màn 3x; hai màn kia hiện 28–52px nên lấy 128px.
const FILES = {
  "tab-home.png": ["home", 96],
  "tab-services.png": ["toolbox", 96],
  "tab-contact.png": ["phone", 96],
  "tab-citizen.png": ["user-male-circle", 96],
  "pctt-sos.png": ["sos", 128],
  "pctt-danh-ba.png": ["phone", 128],
  "pctt-ky-nang.png": ["graduation-cap", 128],
  "pctt-ban-do.png": ["world-map", 128],
  "trocap-co-cong.png": ["medal", 128],
  "trocap-bao-tro.png": ["handshake", 128],
  "trocap-ho-ngheo.png": ["home", 128],
  "trocap-tre-em.png": ["teddy-bear", 128],
};

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  let downloaded = 0;
  let kept = 0;

  for (const [file, [slug, size]] of Object.entries(FILES)) {
    const dest = path.join(OUT, file);
    if (await exists(dest)) {
      kept += 1;
      continue;
    }

    const url = `https://img.icons8.com/3d-fluency/${size}/${slug}.png`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      throw new Error(`Không tải được ${url} (HTTP ${res.status})`);
    }

    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    downloaded += 1;
  }

  console.log(`[icons] tải mới ${downloaded}, giữ sẵn ${kept} / ${Object.keys(FILES).length} file.`);
}

main().catch((err) => {
  console.error(`[icons] LỖI: ${err.message}`);
  console.error("[icons] Thiếu ảnh thì build sẽ hỏng (các file này được import trong code).");
  process.exit(1);
});
