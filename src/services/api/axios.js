import axios from "axios";

const api = axios.create({
  baseURL: "https://ignite-backend-v0ef.onrender.com/api",
});

api.interceptors.request.use(
  (config) => {
    // Skip Authorization header for auth/public endpoints (login, signup, token, etc.)
    const url = config.url || "";
    const isAuthEndpoint =
      url.includes("/auth/") ||
      url.includes("/login") ||
      url.includes("/token");

    const accessToken =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");

    if (accessToken && !isAuthEndpoint) {
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
      const isAuthEndpoint =
        url.includes("/auth/") ||
        url.includes("/login") ||
        url.includes("/token");

      if (!isAuthEndpoint) {
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