import apiClient from "./client";
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
  PaginatedResponse,
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

    if (!user || !accessToken) {
      throw new Error("Invalid login response");
    }

    const role = user.role as string;
    if (!ADMIN_ROLES.has(role)) {
      throw Object.assign(new Error("غير مصرّح لك بدخول لوحة الإدارة"), {
        response: { status: 403, data: { message: "غير مصرّح لك بدخول لوحة الإدارة" } },
      });
    }

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
  logout: () => apiClient.post("/auth/logout").then((r) => r.data).catch(() => null),
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
      usersGrowthPercent: undefined,
      tripsToday: raw?.users?.newToday ?? 0,
      tripsTodayGrowthPercent: undefined,
      pendingModeration: raw?.trips?.pending ?? 0,
      openReports: raw?.reports?.open ?? 0,
      totalTrips: raw?.trips?.total ?? 0,
      totalStations: raw?.stations?.total,
    } as DashboardStats;
  },
  getGrowth: async (_days = 30): Promise<GrowthDataPoint[]> => [],
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
  suspend: (id: string, reason: string) =>
    apiClient.post(`/admin/users/${id}/suspend`, { reason }).then((r) => r.data),
  ban: (id: string, reason: string) =>
    apiClient.post(`/admin/users/${id}/ban`, { reason }).then((r) => r.data),
  activate: (id: string) =>
    apiClient.post(`/admin/users/${id}/activate`).then((r) => r.data),
  verify: (id: string) =>
    apiClient.post(`/admin/users/${id}/verify`).then((r) => r.data),
  assignBadge: (id: string, badge: string) =>
    apiClient.post(`/admin/users/${id}/badges`, { badge }).then((r) => r.data),
  removeBadge: (id: string, badge: string) =>
    apiClient.delete(`/admin/users/${id}/badges/${badge}`).then((r) => r.data),
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
  hide: (id: string) =>
    apiClient.post(`/admin/comments/${id}/hide`).then((r) => r.data),
  restore: (id: string) =>
    apiClient.post(`/admin/comments/${id}/restore`).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/admin/comments/${id}`).then((r) => r.data),
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reportsApi = {
  list: (params: { page?: number; limit?: number; type?: string; status?: string } = {}) =>
    apiClient
      .get<PaginatedResponse<Report>>("/admin/reports", { params })
      .then((r) => r.data),
  resolve: (id: string, notes?: string) =>
    apiClient.post(`/admin/reports/${id}/resolve`, { notes }).then((r) => r.data),
  dismiss: (id: string) =>
    apiClient.post(`/admin/reports/${id}/dismiss`).then((r) => r.data),
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
  update: (key: string, data: Partial<StaticPage>) =>
    apiClient.patch<StaticPage>(`/admin/pages/${key}`, data).then((r) => r.data),
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
  toggleActive: (id: string) =>
    apiClient.post(`/admin/banners/${id}/toggle-active`).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/admin/banners/${id}`).then((r) => r.data),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () =>
    apiClient.get<Record<string, unknown>>("/admin/settings").then((r) => r.data),
  update: (data: Record<string, unknown>) =>
    apiClient.patch<Record<string, unknown>>("/admin/settings", data).then((r) => r.data),
};

// ─── Logs ─────────────────────────────────────────────────────────────────────

export const logsApi = {
  list: (params: { page?: number; limit?: number; level?: string; search?: string } = {}) =>
    apiClient
      .get<PaginatedResponse<SystemLog>>("/admin/logs", { params })
      .then((r) => r.data),
};

// ─── Combined default export ──────────────────────────────────────────────────

export const adminApi = {
  // Dashboard
  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),
  // Users
  getUsers: (p?: any) => apiClient.get('/admin/users', { params: p }),
  getUser: (id: string) => apiClient.get(`/admin/users/${id}`),
  suspendUser: (id: string, reason: string) => apiClient.post(`/admin/users/${id}/suspend`, { reason }),
  activateUser: (id: string) => apiClient.post(`/admin/users/${id}/activate`),
  // Trips
  getTrips: (p?: any) => apiClient.get('/admin/trips', { params: p }),
  approveTrip: (id: string) => apiClient.patch(`/admin/trips/${id}/approve`),
  rejectTrip: (id: string, reason: string) => apiClient.patch(`/admin/trips/${id}/reject`, { reason }),
  featureTrip: (id: string, featured: boolean) => apiClient.patch(`/admin/trips/${id}/feature`, { featured }),
  // Comments
  getComments: (p?: any) => apiClient.get('/admin/comments', { params: p }),
  hideComment: (id: string) => apiClient.patch(`/admin/comments/${id}/hide`),
  deleteComment: (id: string) => apiClient.delete(`/admin/comments/${id}`),
  // Reports
  getReports: (p?: any) => apiClient.get('/admin/reports', { params: p }),
  updateReport: (id: string, status: string) => apiClient.patch(`/admin/reports/${id}`, { status }),
  // Brands
  getBrands: () => apiClient.get('/admin/brands'),
  createBrand: (data: any) => apiClient.post('/admin/brands', data),
  deleteBrand: (id: string) => apiClient.delete(`/admin/brands/${id}`),
  // Cities
  getCities: () => apiClient.get('/admin/cities'),
  createCity: (data: any) => apiClient.post('/admin/cities', data),
  deleteCity: (id: string) => apiClient.delete(`/admin/cities/${id}`),
  // Static pages
  getStaticPages: () => apiClient.get('/admin/pages'),
  getStaticPage: (key: string) => apiClient.get(`/admin/pages/${key}`),
  updateStaticPage: (key: string, data: any) => apiClient.patch(`/admin/pages/${key}`, data),
  // Banners
  getBanners: () => apiClient.get('/admin/banners'),
  createBanner: (data: any) => apiClient.post('/admin/banners', data),
  updateBanner: (id: string, data: any) => apiClient.patch(`/admin/banners/${id}`, data),
  deleteBanner: (id: string) => apiClient.delete(`/admin/banners/${id}`),
  // Settings
  getSettings: () => apiClient.get('/admin/settings'),
  updateSetting: (key: string, value: string) => apiClient.patch(`/admin/settings/${key}`, { value }),
  // Logs
  getLogs: (p?: any) => apiClient.get('/admin/logs', { params: p }),
  // Charging stations
  getChargingStations: (p?: any) => apiClient.get('/admin/charging-stations', { params: p }),
  createChargingStation: (data: any) => apiClient.post('/admin/charging-stations', data),
  deleteChargingStation: (id: string) => apiClient.delete(`/admin/charging-stations/${id}`),
};
