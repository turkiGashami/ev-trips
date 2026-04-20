import type { FilterState } from './index';

// ─── Generic API Response ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  messageAr?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  success: false;
  message: string;
  messageAr: string;
  statusCode: number;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
  messageAr: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  fullNameAr?: string;
  locale?: 'ar' | 'en';
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: import('./index').User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Trips ────────────────────────────────────────────────────────────────────

export interface CreateTripRequest {
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  vehicleId: string;
  startLocation: import('./index').Location;
  endLocation: import('./index').Location;
  departureAt: string;
  arrivalAt?: string;
  totalDistance: number;
  batteryStart: number;
  batteryEnd: number;
  batteryUsed: number;
  averageConsumption: number;
  weather?: import('./index').WeatherCondition;
  roadType?: import('./index').RoadType;
  drivingMode?: import('./index').DrivingMode;
  stops?: CreateChargingStopRequest[];
  mediaUrls?: string[];
  tags?: string[];
  visibility?: import('./index').TripVisibility;
  status?: import('./index').TripStatus;
}

export interface UpdateTripRequest extends Partial<CreateTripRequest> {}

export interface CreateChargingStopRequest {
  order: number;
  location: import('./index').Location;
  stationId?: string;
  batteryArrival: number;
  batteryDeparture: number;
  energyAdded: number;
  chargingDuration: number;
  chargingSpeed: number;
  cost?: number;
  notes?: string;
  arrivalAt: string;
  departureAt: string;
}

export type TripsFilter = FilterState;

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  fullName?: string;
  fullNameAr?: string;
  bio?: string;
  bioAr?: string;
  city?: string;
  country?: string;
}

export interface UpdatePreferencesRequest {
  locale?: 'ar' | 'en';
  distanceUnit?: 'km' | 'mi';
  temperatureUnit?: 'celsius' | 'fahrenheit';
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export interface CreateVehicleRequest {
  make: string;
  model: string;
  year: number;
  variant?: string;
  batteryCapacity: number;
  realWorldRange: number;
  chargingSpeedAc: number;
  chargingSpeedDc: number;
  color?: string;
  plateNumber?: string;
  isDefault?: boolean;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface CreateCommentRequest {
  tripId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface MarkNotificationsReadRequest {
  ids?: string[]; // if empty, mark all as read
}
