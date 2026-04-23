import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

/**
 * Normalize the API base URL so `/api/v1` isn't duplicated if the env var
 * already includes it. Falls back to the CranL beta production URL so the
 * bundle works even when build-time env vars aren't injected.
 */
function resolveBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const raw =
    (envUrl && envUrl.trim()) ||
    (typeof window !== "undefined" && window.location.hostname.endsWith(".cranl.net")
      ? "https://ev-trips-api-beta-yoo9rq.cranl.net/api/v1"
      : "http://localhost:3001/api/v1");
  const stripped = raw.replace(/\/+$/, "");
  return stripped.endsWith("/api/v1") ? stripped : `${stripped}/api/v1`;
}

const BASE_URL = resolveBaseUrl();

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request interceptor — attach admin JWT ───────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get("admin_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle 401 / errors ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove("admin_token");
      // Let React Query / page components handle 401 via isError state.
      // A hard window.location redirect breaks client-side routing.
    }
    return Promise.reject(error);
  }
);

export default apiClient;
