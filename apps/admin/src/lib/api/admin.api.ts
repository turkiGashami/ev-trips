import Cookies from "js-cookie";
import apiClient, { setAdminTokens, clearAdminTokens } from "./client";
import type {
  AuthResponse,
  LoginPayload,
  PlatformUser,
  Trip,
  Comment,
  Report,
  ChargingStation,
  Brand,
  City,
  StaticPage,
  Banner,
  SystemLog,
  DashboardStats,
  GrowthDataPoint,
  RecentActivity,
  PopularRoute,
  PaginatedResponse,
  TopContributor,
  TopVehicle,
  AnalyticsTimeSeries,
} from "@/types/admin.types";

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Admin login uses the shared /auth/login endpoint and validates the returned
 * role. The public API returns `{ data: { user, tokens } }` so we adapt it
 * here to the admin frontend's `{ token, admin }` shape.
 */
const ADMIN_ROLES = new Set(["super_admin", "admin", "moderator"]);

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data: envelope } = await apiClient.post<any>("/auth/login", payload);
    const body = envelope?.data ?? envelope;
    const user = body?.user;
    const accessToken =
      body?.tokens?.accessToken ??
      body?.accessToken ??
      body?.token;
    const refreshToken =
      body?.tokens?.refreshToken ??
      body?.refreshToken;

    if (!user || !accessToken) {
      throw new Error("Invalid login response");
    }

    const role = user.role as string;
    if (!ADMIN_ROLES.has(role)) {
      throw Object.assign(new Error("غير مصرّح لك بدخول لوحة الإدارة"), {
        response: { status: 403, data: { message: "غير مصرّح لك بدخول لوحة الإدارة" } },
      });
    }

    // Persist both tokens so the axios interceptor can auto-refresh on 401.
    setAdminTokens(accessToken, refreshToken);

    return {
      token: accessToken,
      admin: {
        id: user.id,
        email: user.email,
        name: user.full_name ?? user.fullName ?? user.name ?? user.username ?? user.email,
        role: role as AuthResponse["admin"]["role"],
        avatar: user.avatar_url ?? user.avatarUrl ?? undefined,
        createdAt: user.created_at ?? user.createdAt ?? new Date().toISOString(),
      },
    };
  },
  logout: async () => {
    try {
      const refreshToken = Cookies.get("admin_refresh_token");
      await apiClient.post("/auth/logout", refreshToken ? { refreshToken } : {});
    } catch {
      // swallow — still clear local state below
    } finally {
      clearAdminTokens();
    }
    return null;
  },
  me: async (): Promise<AuthResponse["admin"]> => {
    const { data: envelope } = await apiClient.get<any>("/auth/me");
    const user = envelope?.data ?? envelope;
    return {
      id: user.id,
      email: user.email,
      name: user.full_name ?? user.fullName ?? user.name ?? user.username ?? user.email,
      role: user.role,
      avatar: user.avatar_url ?? user.avatarUrl ?? undefined,
      createdAt: user.created_at ?? user.createdAt ?? new Date().toISOString(),
    };
  },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<any>("/admin/stats");
    const raw = data?.data ?? data;
    return {
      totalUsers: raw?.users?.total ?? 0,
      usersGrowthPercent: raw?.users?.growthPercent ?? undefined,
      tripsToday: raw?.trips?.today ?? 0,
      tripsTodayGrowthPercent: raw?.trips?.todayGrowthPercent ?? undefined,
      pendingModeration: raw?.trips?.pending ?? 0,
      openReports: raw?.reports?.open ?? 0,
      totalTrips: raw?.trips?.total ?? 0,
      totalStations: raw?.stations?.total,
      avgBatteryConsumed: raw?.trips?.avgBatteryConsumed ?? null,
      avgDistanceKm: raw?.trips?.avgDistanceKm ?? null,
      avgDurationMinutes: raw?.trips?.avgDurationMinutes ?? null,
      totalVehicles: raw?.vehicles?.total ?? 0,
      commentsToday: raw?.comments?.today ?? 0,
    } as DashboardStats;
  },
  getGrowth: async (days = 30): Promise<GrowthDataPoint[]> => {
    try {
      const { data } = await apiClient.get<any>("/admin/dashboard/growth", { params: { days } });
      const rows = data?.data ?? data ?? [];
      return Array.isArray(rows) ? rows as GrowthDataPoint[] : [];
    } catch {
      return [];
    }
  },
  getPopularRoutes: async (limit = 5): Promise<PopularRoute[]> => {
    try {
      const { data } = await apiClient.get<any>("/admin/dashboard/popular-routes", { params: { limit } });
      const rows = data?.data ?? data ?? [];
      return Array.isArray(rows) ? rows as PopularRoute[] : [];
    } catch {
      return [];
    }
  },
  getTopContributors: async (limit = 5): Promise<TopContributor[]> => {
    try {
      const { data } = await apiClient.get<any>("/admin/dashboard/top-contributors", { params: { limit } });
      const rows = data?.data ?? data ?? [];
      return Array.isArray(rows) ? rows as TopContributor[] : [];
    } catch {
      return [];
    }
  },
  getTopVehicles: async (limit = 5): Promise<TopVehicle[]> => {
    try {
      const { data } = await apiClient.get<any>("/admin/dashboard/top-vehicles", { params: { limit } });
      const rows = data?.data ?? data ?? [];
      return Array.isArray(rows) ? rows as TopVehicle[] : [];
    } catch {
      return [];
    }
  },
  getAnalyticsTimeSeries: async (days = 30): Promise<AnalyticsTimeSeries | null> => {
    try {
      const { data } = await apiClient.get<any>("/admin/analytics/time-series", { params: { days } });
      const body = data?.data ?? data;
      if (!body || !Array.isArray(body.series) || !body.summary) return null;
      return body as AnalyticsTimeSeries;
    } catch {
      return null;
    }
  },
  getRecentActivity: async (limit = 10): Promise<RecentActivity[]> => {
    try {
      const { data } = await apiClient.get<any>("/admin/logs", { params: { page: 1, limit } });
      const items = data?.data ?? [];
      return items.map((l: any) => ({
        id: l.id,
        type: (l.action || "").split(".")[0] || "system",
        description: l.action,
        actorName: l.actor?.full_name || l.actor?.username || "System",
        createdAt: l.created_at,
      })) as RecentActivity[];
    } catch {
      return [];
    }
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const usersApi = {
  list: (params: UsersQuery = {}) =>
    apiClient
      .get<PaginatedResponse<PlatformUser>>("/admin/users", { params })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<PlatformUser>(`/admin/users/${id}`).then((r) => r.data),
  // API exposes only PATCH /admin/users/:id/status with { status, reason? }.
  // Adapt high-level actions to that single endpoint.
  suspend: (id: string, reason: string) =>
    apiClient
      .patch(`/admin/users/${id}/status`, { status: "suspended", reason })
      .then((r) => r.data),
  ban: (id: string, reason: string) =>
    apiClient
      .patch(`/admin/users/${id}/status`, { status: "banned", reason })
      .then((r) => r.data),
  activate: (id: string) =>
    apiClient
      .patch(`/admin/users/${id}/status`, { status: "active" })
      .then((r) => r.data),
  // Dedicated verify endpoint on the API sets email_verified_at = NOW().
  verify: (id: string) =>
    apiClient.patch(`/admin/users/${id}/verify`).then((r) => r.data),
  // Admin controller expects `{ badgeId }`. Keep the param name on the client
  // for call-site simplicity but forward as badgeId.
  assignBadge: (id: string, badge: string) =>
    apiClient
      .post(`/admin/users/${id}/badges`, { badgeId: badge })
      .then((r) => r.data),
  removeBadge: (id: string, badgeKey: string) =>
    apiClient
      .delete(`/admin/users/${id}/badges/${badgeKey}`)
      .then((r) => r.data),
};

// ─── Trips ────────────────────────────────────────────────────────────────────

export interface TripsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  fromCity?: string;
  toCity?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const tripsApi = {
  list: (params: TripsQuery = {}) =>
    apiClient
      .get<PaginatedResponse<Trip>>("/admin/trips", { params })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Trip>(`/admin/trips/${id}`).then((r) => r.data),
  approve: (id: string) =>
    apiClient.patch(`/admin/trips/${id}/approve`).then((r) => r.data),
  reject: (id: string, reason: string) =>
    apiClient.patch(`/admin/trips/${id}/reject`, { reason }).then((r) => r.data),
  hide: (id: string) =>
    apiClient.patch(`/admin/trips/${id}/hide`).then((r) => r.data),
  feature: (id: string, featured: boolean) =>
    apiClient.patch(`/admin/trips/${id}/feature`, { featured }).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/admin/trips/${id}`).then((r) => r.data),
  getPending: (params: { page?: number; limit?: number } = {}) =>
    apiClient
      .get<PaginatedResponse<Trip>>("/admin/trips/pending", { params })
      .then((r) => r.data),
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const commentsApi = {
  list: (params: { page?: number; limit?: number; search?: string; status?: string } = {}) =>
    apiClient
      .get<PaginatedResponse<Comment>>("/admin/comments", { params })
      .then((r) => r.data),
  // API uses PATCH for the hide action.
  hide: (id: string) =>
    apiClient.patch(`/admin/comments/${id}/hide`).then((r) => r.data),
  restore: (id: string) =>
    apiClient.patch(`/admin/comments/${id}/restore`).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/admin/comments/${id}`).then((r) => r.data),
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reportsApi = {
  list: (params: { page?: number; limit?: number; type?: string; status?: string } = {}) =>
    apiClient
      .get<PaginatedResponse<Report>>("/admin/reports", { params })
      .then((r) => r.data),
  // API exposes PATCH /admin/reports/:id with { status, adminNotes? }.
  resolve: (id: string, notes?: string) =>
    apiClient
      .patch(`/admin/reports/${id}`, { status: "resolved", adminNotes: notes })
      .then((r) => r.data),
  dismiss: (id: string, notes?: string) =>
    apiClient
      .patch(`/admin/reports/${id}`, { status: "dismissed", adminNotes: notes })
      .then((r) => r.data),
};

// ─── Charging Stations ────────────────────────────────────────────────────────

export const stationsApi = {
  list: (params: { page?: number; limit?: number; search?: string; cityId?: string } = {}) =>
    apiClient
      .get<PaginatedResponse<ChargingStation>>("/admin/stations", { params })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<ChargingStation>(`/admin/stations/${id}`).then((r) => r.data),
  create: (data: Omit<ChargingStation, "id" | "createdAt">) =>
    apiClient.post<ChargingStation>("/admin/stations", data).then((r) => r.data),
  update: (id: string, data: Partial<ChargingStation>) =>
    apiClient.patch<ChargingStation>(`/admin/stations/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/admin/stations/${id}`).then((r) => r.data),
  toggleActive: (id: string) =>
    apiClient.post(`/admin/stations/${id}/toggle-active`).then((r) => r.data),
};

// ─── Brands ───────────────────────────────────────────────────────────────────

export const brandsApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    apiClient
      .get<PaginatedResponse<Brand>>("/admin/brands", { params })
      .then((r) => r.data),
  create: (data: Omit<Brand, "id" | "createdAt" | "modelsCount">) =>
    apiClient.post<Brand>("/admin/brands", data).then((r) => r.data),
  update: (id: string, data: Partial<Brand>) =>
    apiClient.patch<Brand>(`/admin/brands/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/admin/brands/${id}`).then((r) => r.data),
};

// ─── Cities ───────────────────────────────────────────────────────────────────

export const citiesApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    apiClient
      .get<PaginatedResponse<City>>("/admin/cities", { params })
      .then((r) => r.data),
  create: (data: Omit<City, "id" | "stationsCount" | "tripsCount">) =>
    apiClient.post<City>("/admin/cities", data).then((r) => r.data),
  update: (id: string, data: Partial<City>) =>
    apiClient.patch<City>(`/admin/cities/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/admin/cities/${id}`).then((r) => r.data),
};

// ─── Static Pages ─────────────────────────────────────────────────────────────

export const pagesApi = {
  list: () =>
    apiClient.get<StaticPage[]>("/admin/pages").then((r) => r.data),
  get: (key: string) =>
    apiClient.get<StaticPage>(`/admin/pages/${key}`).then((r) => r.data),
  create: (data: { key: string; title: string; title_ar?: string; content?: string; content_ar?: string; status?: string }) =>
    apiClient.post<StaticPage>("/admin/pages", data).then((r) => r.data),
  update: (key: string, data: Partial<StaticPage>) =>
    apiClient.patch<StaticPage>(`/admin/pages/${key}`, data).then((r) => r.data),
  remove: (key: string) =>
    apiClient.delete(`/admin/pages/${key}`).then((r) => r.data),
};

// ─── Banners ──────────────────────────────────────────────────────────────────

export const bannersApi = {
  list: (params: { page?: number; limit?: number; placement?: string } = {}) =>
    apiClient
      .get<PaginatedResponse<Banner>>("/admin/banners", { params })
      .then((r) => r.data),
  create: (data: FormData) =>
    apiClient
      .post<Banner>("/admin/banners", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),
  update: (id: string, data: Partial<Banner>) =>
    apiClient.patch<Banner>(`/admin/banners/${id}`, data).then((r) => r.data),
  // API has no toggle-active endpoint for banners — flip the `status` field on
  // the existing PATCH instead. Caller supplies the current state.
  toggleActive: (id: string, currentlyActive: boolean) =>
    apiClient
      .patch(`/admin/banners/${id}`, {
        status: currentlyActive ? "inactive" : "active",
      })
      .then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/admin/banners/${id}`).then((r) => r.data),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: async (): Promise<Record<string, unknown>> => {
    const { data } = await apiClient.get<any>("/admin/settings");
    const payload = data?.data ?? data;
    // API returns an array of { key, value, ... } rows. Flatten to a map so
    // the admin UI (keyed by setting key) stays unchanged.
    if (Array.isArray(payload)) {
      return payload.reduce<Record<string, unknown>>((acc, row) => {
        if (row?.key !== undefined) acc[row.key] = row.value;
        return acc;
      }, {});
    }
    return (payload ?? {}) as Record<string, unknown>;
  },
  // API exposes PATCH /admin/settings with body `{ key, value }`. The admin UI
  // passes a `{ key: value }` object; we translate to one PATCH per entry.
  update: async (data: Record<string, unknown>): Promise<void> => {
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
      await apiClient.patch("/admin/settings", { key, value: String(value) });
    }
  },
};

// ─── Logs ─────────────────────────────────────────────────────────────────────

export const logsApi = {
  list: (params: { page?: number; limit?: number; level?: string; search?: string } = {}) =>
    apiClient
      .get<PaginatedResponse<SystemLog>>("/admin/logs", { params })
      .then((r) => r.data),
};

// ─── Legacy raw-axios adapter ────────────────────────────────────────────────
//
// Older pages consume `response.data.data` directly off axios responses, so
// this map returns the raw axios response (unlike the typed `*Api` objects
// above which return `response.data`). All paths here are verified against
// `apps/api/src/modules/admin/admin.controller.ts` — broken legacy routes
// (e.g. `/admin/dashboard/stats`, `/admin/charging-stations`, `/admin/settings/:key`)
// have been removed. Prefer the typed `*Api` objects in new code.
export const adminApi = {
  // Alerts (admin notifications)
  getAdminAlerts: () => apiClient.get('/admin/alerts'),
  // Comments (list + delete used by comments page)
  getComments: (p?: any) => apiClient.get('/admin/comments', { params: p }),
  deleteComment: (id: string) => apiClient.delete(`/admin/comments/${id}`),
  // Brands
  getBrands: () => apiClient.get('/admin/brands'),
  createBrand: (data: any) => apiClient.post('/admin/brands', data),
  deleteBrand: (id: string) => apiClient.delete(`/admin/brands/${id}`),
  // Cities
  getCities: () => apiClient.get('/admin/cities'),
  createCity: (data: any) => apiClient.post('/admin/cities', data),
  updateCity: (id: string, data: any) => apiClient.patch(`/admin/cities/${id}`, data),
  deleteCity: (id: string) => apiClient.delete(`/admin/cities/${id}`),
  // Static pages
  getStaticPages: () => apiClient.get('/admin/pages'),
  getStaticPage: (key: string) => apiClient.get(`/admin/pages/${key}`),
  createStaticPage: (data: any) => apiClient.post('/admin/pages', data),
  updateStaticPage: (key: string, data: any) => apiClient.patch(`/admin/pages/${key}`, data),
  deleteStaticPage: (key: string) => apiClient.delete(`/admin/pages/${key}`),
  // FAQs
  getFaqs: () => apiClient.get('/admin/faqs'),
  createFaq: (data: any) => apiClient.post('/admin/faqs', data),
  updateFaq: (id: string, data: any) => apiClient.patch(`/admin/faqs/${id}`, data),
  deleteFaq: (id: string) => apiClient.delete(`/admin/faqs/${id}`),
  // Contact messages
  getContactMessages: (p?: any) => apiClient.get('/admin/contact-messages', { params: p }),
  updateContactMessage: (id: string, data: any) => apiClient.patch(`/admin/contact-messages/${id}`, data),
  deleteContactMessage: (id: string) => apiClient.delete(`/admin/contact-messages/${id}`),
  replyContactMessage: (id: string, reply: string) => apiClient.post(`/admin/contact-messages/${id}/reply`, { reply }),
  // Banners
  getBanners: () => apiClient.get('/admin/banners'),
  createBanner: (data: any) => apiClient.post('/admin/banners', data),
  updateBanner: (id: string, data: any) => apiClient.patch(`/admin/banners/${id}`, data),
  deleteBanner: (id: string) => apiClient.delete(`/admin/banners/${id}`),
  // Routes (read-only overview)
  getRoutes: (params?: {
    search?: string;
    from_city_id?: string;
    to_city_id?: string;
    sort?: 'trip_count' | 'last_trip_date' | 'avg_distance_km';
    limit?: number;
  }) => apiClient.get('/admin/routes', { params }),
};
