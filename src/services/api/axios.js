import axios from "axios";

const resolveBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    const raw = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, "");
    return raw.endsWith("/api") ? raw : `${raw}/api`;
  }
  if (import.meta.env.PROD) {
    return "https://ignite-backend-8t7z.onrender.com/api";
  }
  return "/api";
};

const BASE_URL = resolveBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
});

const normalizePath = (pathname) => pathname.replace(/\/+$/, "") || "/";

const isSuperAdminPath = () => {
  const pathname = normalizePath(window.location.pathname);
  return pathname === "/admin" || pathname.startsWith("/admin/");
};

const isSuperAdminLoginPath = () =>
  normalizePath(window.location.pathname) === "/admin/login";

export const clearAuthSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("ignite_authenticated");
  clearApiCache();
};

export const setSuperAdminAuthSession = ({ access, refresh, user }) => {
  if (access) {
    localStorage.setItem("superAdmin_accessToken", access);
  }
  if (refresh) {
    localStorage.setItem("superAdmin_refreshToken", refresh);
  }
  if (user) {
    localStorage.setItem("superAdmin_user", JSON.stringify(user));
  }
  clearApiCache();
};

export const clearSuperAdminAuthSession = () => {
  localStorage.removeItem("superAdmin_accessToken");
  localStorage.removeItem("superAdmin_refreshToken");
  localStorage.removeItem("superAdmin_user");
  clearApiCache();
};

export const getSuperAdminAccessToken = () => {
  return localStorage.getItem("superAdmin_accessToken");
};

export const getSuperAdminRefreshToken = () => {
  return localStorage.getItem("superAdmin_refreshToken");
};

api.interceptors.request.use(
  (config) => {
    // Skip Authorization header for auth/public endpoints
    const url = config.url || "";
    const isPublicEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/token/refresh") ||
      url.includes("/super-admin/login") ||
      url.includes("/invitation");

    const isSuperAdminEndpoint = url.includes("/super-admin");

    const accessToken = isSuperAdminEndpoint
      ? getSuperAdminAccessToken()
      : (localStorage.getItem("accessToken") || localStorage.getItem("access_token"));

    if (accessToken && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${accessToken}`;

      // Attach X-Company-ID if present in active user session to ensure tenant scoping,
      // but strictly omit for global platform super-admin endpoints.
      if (!isSuperAdminEndpoint) {
        try {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            const compId = parsed.company_id || parsed.companyId || parsed.company?.id;
            if (compId) {
              config.headers["X-Company-ID"] = String(compId);
            }
          }
        } catch {
          // ignore parse error
        }
      } else if (config.headers) {
        delete config.headers["X-Company-ID"];
      }
    } else if (!accessToken) {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const refreshStates = {
  employee: { isRefreshing: false, failedQueue: [] },
  superAdmin: { isRefreshing: false, failedQueue: [] },
};

const processQueue = (refreshState, error, token = null) => {
  refreshState.failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  refreshState.failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";
    const isPublicEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/token/refresh") ||
      url.includes("/super-admin/login") ||
      url.includes("/invitation");

    const isSuperAdminEndpoint = url.includes("/super-admin");

    // If 401 occurs and request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest?._retry && !isPublicEndpoint) {
      const refreshToken = isSuperAdminEndpoint
        ? getSuperAdminRefreshToken()
        : (localStorage.getItem("refreshToken") || localStorage.getItem("refresh_token"));
      const refreshState = isSuperAdminEndpoint
        ? refreshStates.superAdmin
        : refreshStates.employee;

      if (refreshToken) {
        if (refreshState.isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshState.failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest._retry = true;
              if (originalRequest.headers?.set) {
                originalRequest.headers.set("Authorization", `Bearer ${token}`);
              } else if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        refreshState.isRefreshing = true;

        try {
          const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          // Extract access token across possible backend response formats
          const newAccessToken =
            res.data?.access ||
            res.data?.tokens?.access ||
            res.data?.data?.access ||
            res.data?.data?.tokens?.access ||
            res.data?.access_token ||
            res.data?.data?.access_token;

          // Extract refresh token if rotated by backend (SimpleJWT ROTATE_REFRESH_TOKENS)
          const newRefreshToken =
            res.data?.refresh ||
            res.data?.tokens?.refresh ||
            res.data?.data?.refresh ||
            res.data?.data?.tokens?.refresh ||
            res.data?.refresh_token ||
            res.data?.data?.refresh_token;

          if (newAccessToken) {
            if (isSuperAdminEndpoint) {
              localStorage.setItem("superAdmin_accessToken", newAccessToken);
              if (newRefreshToken) {
                localStorage.setItem("superAdmin_refreshToken", newRefreshToken);
              }
            } else {
              localStorage.setItem("accessToken", newAccessToken);
              localStorage.setItem("access_token", newAccessToken);
              if (newRefreshToken) {
                localStorage.setItem("refreshToken", newRefreshToken);
                localStorage.setItem("refresh_token", newRefreshToken);
              }
            }

            api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

            if (originalRequest.headers?.set) {
              originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
            } else if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }

            processQueue(refreshState, null, newAccessToken);
            return api(originalRequest);
          } else {
            throw new Error("Unable to parse access token from refresh response");
          }
        } catch (refreshErr) {
          processQueue(refreshState, refreshErr, null);

          const status = refreshErr.response?.status;
          const isTokenInvalid = status === 401 || status === 403;

          // Only purge credentials and eject user if the backend explicitly rejected the refresh token (401/403)
          if (isTokenInvalid) {
            if (isSuperAdminEndpoint) {
              clearSuperAdminAuthSession();
              if (
                isSuperAdminPath() &&
                !isSuperAdminLoginPath()
              ) {
                window.location.href = "/admin/login";
              }
            } else {
              clearAuthSession();
              if (!isSuperAdminPath() && window.location.pathname !== "/login") {
                window.location.href = "/login";
              }
            }
          }
          return Promise.reject(refreshErr);
        } finally {
          refreshState.isRefreshing = false;
        }
      } else {
        // No refresh token available
        if (isSuperAdminEndpoint) {
          clearSuperAdminAuthSession();
          if (
            isSuperAdminPath() &&
            !isSuperAdminLoginPath()
          ) {
            window.location.href = "/admin/login";
          }
        } else {
          clearAuthSession();
          if (!isSuperAdminPath() && window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      }
    }

    return Promise.reject(error);
  }
);


/* ==========================================================================
   Ultra-Fast In-Memory & Session API Cache with Instant SWR & Deduplication
   ========================================================================== */

const apiCache = new Map();
const inFlightRequests = new Map();

// Restore fresh cache from sessionStorage
try {
  const saved = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("ignite_api_cache") : null;
  if (saved) {
    const parsed = JSON.parse(saved);
    const now = Date.now();
    for (const [k, v] of Object.entries(parsed)) {
      if (now - v.timestamp < 180000) {
        apiCache.set(k, v);
      }
    }
  }
} catch (e) {
  // Ignore sessionStorage parse errors
}

let persistTimeout = null;
const persistCache = () => {
  if (persistTimeout) return;
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    try {
      if (typeof sessionStorage === "undefined") return;
      const obj = {};
      const now = Date.now();
      for (const [k, v] of apiCache.entries()) {
        if (now - v.timestamp < 180000) {
          obj[k] = v;
        }
      }
      sessionStorage.setItem("ignite_api_cache", JSON.stringify(obj));
    } catch (e) {
      // Ignore quota errors
    }
  }, 400);
};

export const clearApiCache = () => {
  apiCache.clear();
  inFlightRequests.clear();
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("ignite_api_cache");
    }
  } catch (e) { }
};

// Patterns that MUST NOT be cached
const NO_CACHE_PATTERNS = [
  "/auth/login",
  "/auth/register",
  "/auth/token/refresh",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/me",
  "/super-admin",
  "/health",
  "/location",
  "/ping",
  "/punch",
];

const shouldCacheUrl = (url) => {
  if (!url) return false;
  return !NO_CACHE_PATTERNS.some((pattern) => url.includes(pattern));
};

const getCacheKey = (url, params) => {
  const cleanUrl = url.split("?")[0].replace(/\/+$/, "") || "/";
  const paramsKey = params ? JSON.stringify(params) : "";
  return `${cleanUrl}?${paramsKey}`;
};

export const getCachedApiData = (url, params) => {
  const key = getCacheKey(url, params);
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > 180000) {
    apiCache.delete(key);
    return null;
  }
  return cloneData(entry.data);
};

export const hasCachedApiData = (url, params) => {
  const key = getCacheKey(url, params);
  const entry = apiCache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp <= 180000;
};

const invalidateCacheOnMutation = (url) => {
  if (!url) return;
  const clean = url.replace(/^\/?api\//, "").replace(/^\/+/, "");
  const resource = clean.split("/")[0];
  if (!resource) return;

  for (const k of apiCache.keys()) {
    if (k.includes(resource)) {
      apiCache.delete(k);
    }
  }
  persistCache();
};

const cloneData = (data) => {
  if (data === undefined || data === null) return data;
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(data);
    }
  } catch (e) { }
  return JSON.parse(JSON.stringify(data));
};

const rawGet = api.get.bind(api);
const rawPost = api.post.bind(api);
const rawPut = api.put.bind(api);
const rawPatch = api.patch.bind(api);
const rawDelete = api.delete.bind(api);

api.get = function (url, config = {}) {
  const canCache = !config.skipCache && shouldCacheUrl(url);

  if (!canCache) {
    return rawGet(url, config);
  }

  const cacheKey = getCacheKey(url, config.params);
  const now = Date.now();
  const cached = apiCache.get(cacheKey);

  // If valid in-memory cache exists (< 2 minutes old):
  if (cached && now - cached.timestamp < 120000) {
    // SWR (Stale-While-Revalidate): if older than 10 seconds, quietly revalidate in background
    if (now - cached.timestamp > 10000 && !inFlightRequests.has(cacheKey)) {
      const bgPromise = rawGet(url, config)
        .then((res) => {
          apiCache.set(cacheKey, {
            data: res.data,
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
            timestamp: Date.now(),
          });
          persistCache();
          inFlightRequests.delete(cacheKey);
        })
        .catch(() => {
          inFlightRequests.delete(cacheKey);
        });
      inFlightRequests.set(cacheKey, bgPromise);
    }

    // Instant 0ms return from cache
    return Promise.resolve({
      data: cloneData(cached.data),
      status: cached.status || 200,
      statusText: cached.statusText || "OK",
      headers: cached.headers || {},
      config,
    });
  }

  // Deduplicate simultaneous identical network requests
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const requestPromise = rawGet(url, config)
    .then((response) => {
      apiCache.set(cacheKey, {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        timestamp: Date.now(),
      });
      persistCache();
      inFlightRequests.delete(cacheKey);
      return response;
    })
    .catch((err) => {
      inFlightRequests.delete(cacheKey);
      throw err;
    });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

api.post = function (url, data, config) {
  invalidateCacheOnMutation(url);
  return rawPost(url, data, config);
};

api.put = function (url, data, config) {
  invalidateCacheOnMutation(url);
  return rawPut(url, data, config);
};

api.patch = function (url, data, config) {
  invalidateCacheOnMutation(url);
  return rawPatch(url, data, config);
};

api.delete = function (url, config) {
  invalidateCacheOnMutation(url);
  return rawDelete(url, config);
};

export const prefetchApi = (url, params = {}) => {
  return api.get(url, { params }).catch(() => { });
};

export default api;