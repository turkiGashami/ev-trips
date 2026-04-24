// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "moderator";
  avatar?: string;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  admin: AdminUser;
}

// ─── Platform Users ───────────────────────────────────────────────────────────

export type UserStatus = "active" | "suspended" | "banned" | "pending";
export type UserRole = "user" | "verified" | "premium";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: UserStatus;
  role: UserRole;
  badges: string[];
  tripsCount: number;
  joinedAt: string;
  lastActiveAt?: string;
  bio?: string;
  vehicles?: Vehicle[];
}

// ─── Trips ────────────────────────────────────────────────────────────────────

export type TripStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "hidden";

export interface ChargingStop {
  id: string;
  name: string;
  location: string;
  durationMin: number;
  chargeAddedPercent: number;
  chargerType: string;
  connectorType: string;
  cost?: number;
  currency?: string;
  notes?: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  authorId: string;
  author: Pick<PlatformUser, "id" | "name" | "avatar">;
  status: TripStatus;
  fromCity: string;
  toCity: string;
  distanceKm: number;
  durationMin: number;
  startBatteryPercent: number;
  endBatteryPercent: number;
  vehicle: Vehicle;
  chargingStops: ChargingStop[];
  coverImage?: string;
  images: string[];
  tags: string[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  rejectionReason?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export type CommentStatus = "visible" | "hidden" | "reported";

export interface Comment {
  id: string;
  tripId: string;
  trip: Pick<Trip, "id" | "title">;
  authorId: string;
  author: Pick<PlatformUser, "id" | "name" | "avatar">;
  content: string;
  status: CommentStatus;
  reportCount: number;
  createdAt: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportType = "trip" | "comment" | "user";
export type ReportStatus = "open" | "resolved" | "dismissed";
export type ReportReason =
  | "spam"
  | "inappropriate"
  | "misleading"
  | "harassment"
  | "other";

export interface Report {
  id: string;
  type: ReportType;
  targetId: string;
  reporterId: string;
  reporter: Pick<PlatformUser, "id" | "name">;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

// ─── Charging Stations ────────────────────────────────────────────────────────

export interface ChargingStation {
  id: string;
  name: string;
  nameAr?: string;
  city: string;
  cityId: string;
  address: string;
  lat: number;
  lng: number;
  connectorTypes: string[];
  maxPowerKw: number;
  availableSlots: number;
  totalSlots: number;
  isVerified: boolean;
  isActive: boolean;
  openHours?: string;
  phone?: string;
  website?: string;
  createdAt: string;
}

// ─── Brands / Vehicles ────────────────────────────────────────────────────────

export interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  country?: string;
  isActive: boolean;
  modelsCount: number;
  createdAt: string;
}

export interface VehicleModel {
  id: string;
  brandId: string;
  name: string;
  nameAr?: string;
  year: number;
  rangeKm: number;
  batteryKwh: number;
  isActive: boolean;
}

export interface Vehicle {
  id: string;
  userId: string;
  brandId: string;
  brand: Pick<Brand, "id" | "name" | "logo">;
  modelId: string;
  model: Pick<VehicleModel, "id" | "name" | "year">;
  color?: string;
  plateNumber?: string;
  isPrimary: boolean;
}

// ─── Cities ───────────────────────────────────────────────────────────────────

export interface City {
  id: string;
  name: string;
  nameAr: string;
  country: string;
  countryCode: string;
  isActive: boolean;
  stationsCount: number;
  tripsCount: number;
}

// ─── Static Pages ─────────────────────────────────────────────────────────────

export interface StaticPage {
  id: string;
  key: string;
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
  isPublished: boolean;
  updatedAt: string;
  updatedBy: string;
}

// ─── Banners ──────────────────────────────────────────────────────────────────

export type BannerPlacement = "home_top" | "home_mid" | "search" | "trips";

export interface Banner {
  id: string;
  titleEn: string;
  titleAr?: string;
  imageUrl: string;
  linkUrl?: string;
  placement: BannerPlacement;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  clickCount: number;
  createdAt: string;
}

// ─── System Logs ─────────────────────────────────────────────────────────────

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface SystemLog {
  id: string;
  level: LogLevel;
  action: string;
  message: string;
  adminId?: string;
  adminName?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

// ─── Pagination & API ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  usersGrowthPercent?: number;
  tripsToday: number;
  tripsTodayGrowthPercent?: number;
  pendingModeration: number;
  openReports: number;
  totalTrips: number;
  totalStations?: number;
}

export interface GrowthDataPoint {
  date: string;
  users: number;
  trips: number;
}

export interface PopularRoute {
  from_ar?: string | null;
  from_en?: string | null;
  to_ar?: string | null;
  to_en?: string | null;
  trip_count: number;
  avg_arrival_battery: number | null;
}

export interface RecentActivity {
  id: string;
  type: "user_joined" | "trip_submitted" | "report_filed" | "trip_approved";
  description: string;
  actorName: string;
  actorAvatar?: string;
  createdAt: string;
}
