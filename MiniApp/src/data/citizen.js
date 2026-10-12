import { getAccessToken, getRouteParams } from "zmp-sdk/apis";
import API_BASE_URL from "./api-config.js";

// Tab Công dân: gọi API /api/public/citizen/*. Danh tính lấy từ access token
// Zalo ở server (requireZaloUser) — client không bao giờ tự khai userId.

const REF_KEY = "tralien_ref_code";
const PHONE_ASKED_KEY = "tralien_phone_asked";
const LINKED_KEY = "tralien_citizen_linked";

function store(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* WebView có thể chặn localStorage — bỏ qua */
  }
}
function load(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

// Mini App được mở từ link chia sẻ có kèm ?ref=MÃ → nhớ lại để áp dụng khi đăng ký.
export function captureReferral() {
  try {
    const params = (typeof getRouteParams === "function" && getRouteParams()) || {};
    const code = String(params.ref || params.referral || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length === 6) store(REF_KEY, code);
  } catch {
    /* không chạy trong Zalo (web mirror) */
  }
}

// Đã bấm "Cho phép & liên kết" ở màn xin phép đầu tiên của tab Công dân.
export const isLinked = () => load(LINKED_KEY) === "1";
export const markLinked = () => store(LINKED_KEY, "1");

export const pendingReferral = () => load(REF_KEY);
export const clearPendingReferral = () => store(REF_KEY, null);
export const wasPhoneAsked = () => load(PHONE_ASKED_KEY) === "1";
export const markPhoneAsked = () => store(PHONE_ASKED_KEY, "1");
export const resetPhoneAsked = () => store(PHONE_ASKED_KEY, null);

async function call(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) headers["x-zalo-access-token"] = await getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/public/citizen${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra, vui lòng thử lại");
  return data;
}

export const fetchProgram = () => call("/program", { auth: false });
export const openCitizen = (profile) => call("/me", { method: "POST", body: profile });
export const updateProfile = (patch) => call("/me/profile", { method: "PUT", body: patch });
export const sendPhoneToken = (token) => call("/me/phone", { method: "POST", body: { token } });
export const submitReferral = (code) => call("/me/referral", { method: "POST", body: { code } });
export const fetchTransactions = () => call("/me/transactions");

export async function fetchVillages() {
  const res = await fetch(`${API_BASE_URL}/api/public/thon-xom`);
  const data = await res.json().catch(() => ({}));
  return data.items || [];
}

// Nhãn nhật ký điểm theo loại giao dịch.
export const TYPE_LABELS = {
  register: "Thưởng đăng ký lần đầu",
  referrer: "Giới thiệu bạn bè thành công",
  referee: "Nhập mã giới thiệu",
  survey: "Hoàn thành khảo sát",
  feedback: "Phản ánh được phản hồi",
  event: "Check-in sự kiện",
  exam: "Tham gia thi trực tuyến",
  adjust: "Điều chỉnh điểm",
};

export function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())} ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}
