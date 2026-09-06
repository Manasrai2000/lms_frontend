import axios from "axios";
import { useAuthStore } from "./store/auth";

const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || "https://lms-backend-96fq.onrender.com/api";
const baseURL = rawBaseURL.replace(/\/+$/, "");

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper 1: Get Access Token (prioritizes active store, falls back to localStorage)
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const storeToken = useAuthStore.getState().accessToken;
  if (storeToken) return storeToken;
  return localStorage.getItem("accessToken");
};

// Helper 2: Get Refresh Token (prioritizes active store, falls back to localStorage)
export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const storeRefresh = useAuthStore.getState().refreshToken;
  if (storeRefresh) return storeRefresh;
  return localStorage.getItem("refreshToken");
};

// Helper 3: Save New Tokens to Storage & Store
export const saveNewTokens = (accessToken: string, refreshToken?: string, user?: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
  }
  const store = useAuthStore.getState();
  const currentUser = user || store.user;
  const activeRefresh = refreshToken || store.refreshToken || "";
  if (currentUser) {
    store.setAuth(currentUser, accessToken, activeRefresh);
  } else {
    useAuthStore.setState({ accessToken, refreshToken: activeRefresh });
  }
};

// Helper 4: Clear Session and Redirect to Login
export const clearSessionAndRedirect = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
  useAuthStore.getState().clearAuth();
  if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
};

// Standalone Helper: Perform Refresh Token Exchange
export const refreshTokenHelper = async (): Promise<string> => {
  const storedRefreshToken = getRefreshToken();
  if (!storedRefreshToken) {
    clearSessionAndRedirect();
    throw new Error("No refresh token available");
  }

  let response: any = null;
  try {
    response = await axios.post(`${baseURL}/auth/refresh`, {
      refreshToken: storedRefreshToken,
    });
  } catch (err) {
    try {
      response = await axios.post(`${baseURL}/v1/auth/refresh`, {
        refreshToken: storedRefreshToken,
      });
    } catch {
      response = await axios.post("http://localhost:3000/api/v1/auth/refresh", {
        refreshToken: storedRefreshToken,
      });
    }
  }

  const resData = response.data;
  const newAccessToken = resData?.accessToken || resData?.data?.accessToken;
  const newRefreshToken = resData?.refreshToken || resData?.data?.refreshToken || storedRefreshToken;
  const user = resData?.user || resData?.data?.user;

  if (!newAccessToken) {
    throw new Error("Invalid refresh response payload");
  }

  saveNewTokens(newAccessToken, newRefreshToken, user);
  return newAccessToken;
};

// 1. Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrent Queue Management for Simultaneous 401s
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 2. Response Interceptor: Catch 401 & Auto Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip if error doesn't have config or is not 401, or is already retried
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh token flow if we are calling auth endpoints directly
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    // Handle concurrent requests if refresh is already in progress
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshTokenHelper();
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      isRefreshing = false;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      isRefreshing = false;
      clearSessionAndRedirect();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
