import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api" : "https://ignite-backend-v0ef.onrender.com/api");

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    // Skip Authorization header for auth/public endpoints (login, signup, invitation onboarding, etc.)
    const url = config.url || "";
    const isPublicEndpoint =
      url.includes("/auth/") ||
      url.includes("/login") ||
      url.includes("/token") ||
      url.includes("/invitation");

    const accessToken =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");

    if (accessToken && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently clear expired token if a 401 occurs on protected endpoints
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const isPublicEndpoint =
        url.includes("/auth/") ||
        url.includes("/login") ||
        url.includes("/token") ||
        url.includes("/invitation");

      if (!isPublicEndpoint) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("ignite_authenticated");
      }
    }
    return Promise.reject(error);
  }
);

export default api;