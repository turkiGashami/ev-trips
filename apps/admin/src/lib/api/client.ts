import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from "axios";
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

// ─── Cookie helpers ──────────────────────────────────────────────────────────
const ACCESS_COOKIE = "admin_token";
const REFRESH_COOKIE = "admin_refresh_token";
const COOKIE_OPTS = {
  expires: 7,
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
  sameSite: "strict" as const,
};

export function setAdminTokens(accessToken: string, refreshToken?: string) {
  Cookies.set(ACCESS_COOKIE, accessToken, COOKIE_OPTS);
  if (refreshToken) Cookies.set(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
}

export function clearAdminTokens() {
  Cookies.remove(ACCESS_COOKIE);
  Cookies.remove(REFRESH_COOKIE);
}

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
    const token = Cookies.get(ACCESS_COOKIE);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Silent refresh of access token ──────────────────────────────────────────
// A single in-flight refresh promise is shared across concurrent 401s so we
// only hit /auth/refresh once, then replay every queued request.
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = Cookies.get(REFRESH_COOKIE);
  if (!refreshToken) return null;

  try {
    // Raw axios call (not apiClient) so we don't loop through our own interceptors.
    const { data } = await axios.post(
      `${BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: 15000, headers: { "Content-Type": "application/json" } }
    );
    const body = data?.data ?? data;
    const nextAccess = body?.accessToken ?? body?.tokens?.accessToken;
    const nextRefresh = body?.refreshToken ?? body?.tokens?.refreshToken;
    if (!nextAccess) return null;
    setAdminTokens(nextAccess, nextRefresh ?? refreshToken);
    return nextAccess;
  } catch {
    return null;
  }
}

function getOrStartRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  clearAdminTokens();
  const path = window.location.pathname + window.location.search;
  // Avoid redirect loop when we're already on /login.
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
  }
}

// ─── Response interceptor — 401 → refresh → retry ─────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    const is401 = error.response?.status === 401;
    const isRefreshCall = typeof original?.url === "string" && original.url.includes("/auth/refresh");
    const isLoginCall = typeof original?.url === "string" && original.url.includes("/auth/login");

    if (!is401 || !original || original._retry || isRefreshCall || isLoginCall) {
      if (is401 && (isRefreshCall || !Cookies.get(REFRESH_COOKIE))) {
        redirectToLogin();
      }
      return Promise.reject(error);
    }

    original._retry = true;
    const newAccess = await getOrStartRefresh();
    if (!newAccess) {
      redirectToLogin();
      return Promise.reject(error);
    }

    original.headers = {
      ...(original.headers ?? {}),
      Authorization: `Bearer ${newAccess}`,
    };
    return apiClient.request(original);
  }
);

export default apiClient;
