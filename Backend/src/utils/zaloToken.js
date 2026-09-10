const config = require("../config");
const { redisGet, redisSet } = require("./redis");

const KEYS = {
  accessToken: "tralien_zalo_access_token",
  refreshToken: "tralien_zalo_refresh_token",
  expiresAt: "tralien_zalo_expires_at",
};

// Zalo OA access tokens last ~25h; refresh a bit early and add jitter so a PM2
// cluster of instances doesn't all refresh (and race) at the exact same moment.
const EXPIRES_IN_MS = 90000 * 1000;
const REFRESH_BEFORE_MS = 2 * 60 * 60 * 1000;

let cache = {
  accessToken: null,
  refreshToken: null,
  expiresAt: 0,
};
let refreshTimer = null;
let initPromise = null;
let refreshPromise = null;

async function loadFromStore() {
  const [accessToken, refreshToken, expiresAt] = await Promise.all([
    redisGet(KEYS.accessToken),
    redisGet(KEYS.refreshToken),
    redisGet(KEYS.expiresAt),
  ]);

  if (accessToken && refreshToken) {
    cache = {
      accessToken,
      refreshToken,
      expiresAt: Number(expiresAt) || 0,
    };
  } else {
    // First run: seed from env vars, treat as freshly issued.
    cache = {
      accessToken: config.zalo.oaToken,
      refreshToken: config.zalo.refreshToken,
      expiresAt: Date.now() + EXPIRES_IN_MS,
    };
    await persist();
  }
  scheduleRefresh();
}

async function persist() {
  await Promise.all([
    redisSet(KEYS.accessToken, cache.accessToken),
    redisSet(KEYS.refreshToken, cache.refreshToken),
    redisSet(KEYS.expiresAt, String(cache.expiresAt)),
  ]);
}

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  const jitter = Math.floor(Math.random() * 5 * 60 * 1000);
  const delay = Math.max(cache.expiresAt - REFRESH_BEFORE_MS - Date.now() + jitter, 60 * 1000);
  refreshTimer = setTimeout(() => {
    refreshAccessToken().catch((err) => {
      console.error("[zaloToken] proactive refresh failed:", err.message);
      // retry in 5-10 min
      refreshTimer = setTimeout(() => scheduleRefresh(), (5 + Math.random() * 5) * 60 * 1000);
    });
  }, delay);
  if (typeof refreshTimer.unref === "function") refreshTimer.unref();
}

// Single-flight: gộp mọi lần refresh ĐỒNG THỜI thành 1 lần gọi Zalo. Nếu nhiều
// nơi cùng lúc thấy token hết hạn (getAccessToken, zaloApi -216, zaloArticle,
// timer định kỳ), chúng CHIA SẺ cùng một promise thay vì mỗi nơi tự refresh.
// Zalo xoay refresh_token mỗi lần đổi token → nếu 2 chỗ cùng refresh, chỗ thứ 2
// dùng refresh_token đã bị xoay → -14014 làm CHẾT token. Mutex này chặn điều đó.
function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = doRefreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefreshAccessToken() {
  await ensureInit();
  const res = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      secret_key: config.zalo.appSecret,
    },
    body: new URLSearchParams({
      app_id: config.zalo.appId,
      grant_type: "refresh_token",
      refresh_token: cache.refreshToken,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    if (data.error === -14014) {
      await redisSet(KEYS.accessToken, "");
      await redisSet(KEYS.refreshToken, "");
    }
    throw new Error("Zalo refresh_token exchange failed: " + JSON.stringify(data));
  }
  cache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || cache.refreshToken,
    expiresAt: Date.now() + EXPIRES_IN_MS,
  };
  await persist();
  scheduleRefresh();
  return cache.accessToken;
}

function ensureInit() {
  if (!initPromise) initPromise = loadFromStore();
  return initPromise;
}

async function getAccessToken() {
  await ensureInit();
  if (Date.now() > cache.expiresAt - REFRESH_BEFORE_MS) {
    try {
      return await refreshAccessToken();
    } catch (err) {
      console.error("[zaloToken] on-demand refresh failed, using stale token:", err.message);
    }
  }
  return cache.accessToken;
}

module.exports = { getAccessToken, refreshAccessToken, ensureInit };
