import type { UserRole, UserStatus } from '../enums';
import type { NotificationSettings } from './notification.types';

// ─────────────────────────────────────────────────────────────────────────────
// User domain types
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  isPublic: boolean;
  country: string | null;
  city: string | null;
  website: string | null;
  tripCount: number;
  followerCount: number;
  followingCount: number;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Minimal public representation of a user (for feeds, comment authors, etc.) */
export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
}

/** What the authenticated user sees about themselves */
export interface AuthenticatedUser extends User {
  notificationSettings: NotificationSettings;
}

/** Full admin view of a user */
export interface AdminUserView extends User {
  lastLoginAt: string | null;
  loginCount: number;
  reportCount: number;
  moderationNotes: string | null;
  ipAddress: string | null;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  isPublic: boolean;
  tripCount: number;
  followerCount: number;
  followingCount: number;
  helpfulCount: number;
  badges: UserBadge[];
  vehicles: UserVehicleSummary[];
  isFollowing?: boolean; // only when viewing as authenticated user
  createdAt: string;
}

export interface UserStats {
  totalTrips: number;
  publishedTrips: number;
  draftTrips: number;
  totalDistanceKm: number;
  totalChargingStops: number;
  averageConsumption: number | null;
  mostDrivenVehicle: UserVehicleSummary | null;
  helpfulReactions: number;
  favoritesByOthers: number;
}

export interface UserBadge {
  id: string;
  type: string;
  name: string;
  description: string;
  iconUrl: string;
  awardedAt: string;
}

export interface UserVehicleSummary {
  id: string;
  brandName: string;
  modelName: string;
  trimName: string | null;
  year: number;
  color: string | null;
  isDefault: boolean;
}

export interface FollowRelationship {
  followerId: string;
  followingId: string;
  createdAt: string;
}


// ─────────────────────
// Auth payloads
// ─────────────────────

export interface RegisterPayload {
  email: string;
  username: string;
  displayName: string;
  password: string;
  acceptTerms: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenFamily: string;
  iat: number;
  exp: number;
}
