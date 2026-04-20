export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  role: 'guest' | 'user' | 'moderator' | 'admin' | 'super_admin';
  status: string;
  email_verified_at?: string;
  is_contributor_verified: boolean;
  contributor_points: number;
  total_trips: number;
  total_views: number;
  total_favorites: number;
  country?: string;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface City {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  country: string;
}

export interface CarBrand {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
}

export interface CarModel {
  id: string;
  brand_id: string;
  name: string;
  name_ar?: string;
  slug: string;
}

export interface CarTrim {
  id: string;
  model_id: string;
  name: string;
  name_ar?: string;
  battery_capacity_kwh?: number;
  range_km_official?: number;
  drivetrain?: string;
}

export interface UserVehicle {
  id: string;
  user_id: string;
  brand_id: string;
  model_id: string;
  trim_id?: string;
  year: number;
  nickname?: string;
  image_url?: string;
  is_default: boolean;
  brand?: CarBrand;
  model?: CarModel;
  trim?: CarTrim;
}

export interface TripStop {
  id: string;
  trip_id: string;
  stop_order: number;
  station_name: string;
  provider_name?: string;
  charger_type?: string;
  city?: City;
  latitude?: number;
  longitude?: number;
  battery_before_pct?: number;
  battery_after_pct?: number;
  charging_duration_minutes?: number;
  charging_cost?: number;
  charging_cost_currency?: string;
  was_busy?: boolean;
  was_functioning_well?: boolean;
  notes?: string;
}

export interface TripMedia {
  id: string;
  url: string;
  thumbnail_url?: string;
  media_type: 'image' | 'video';
  sort_order: number;
}

export interface Trip {
  id: string;
  slug: string;
  title: string;
  user_id: string;
  user?: User;
  departure_city?: City;
  destination_city?: City;
  trip_date: string;
  departure_time?: string;
  arrival_time?: string;
  duration_minutes?: number;
  distance_km?: number;
  departure_battery_pct: number;
  arrival_battery_pct: number;
  estimated_range_at_departure_km?: number;
  remaining_range_at_arrival_km?: number;
  passengers_count: number;
  luggage_level?: string;
  ac_usage?: string;
  weather_condition?: string;
  average_speed_kmh?: number;
  driving_style?: string;
  route_notes?: string;
  trip_notes?: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'hidden' | 'archived';
  rejection_reason?: string;
  is_featured: boolean;
  view_count: number;
  favorite_count: number;
  helpful_count: number;
  comment_count: number;
  snap_brand_name?: string;
  snap_model_name?: string;
  snap_trim_name?: string;
  snap_year?: number;
  stops?: TripStop[];
  media?: TripMedia[];
  published_at?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  trip_id: string;
  user_id: string;
  user?: User;
  parent_id?: string;
  content: string;
  status: string;
  reply_count: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title?: string;
  title_ar?: string;
  body?: string;
  body_ar?: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface ChargingStation {
  id: string;
  name: string;
  name_ar?: string;
  provider?: string;
  charger_type: string;
  power_kw?: number;
  city?: City;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  is_verified: boolean;
}

export interface RouteInsights {
  route: { from: string; to: string; slug: string; distanceKm?: number };
  tripCount: number;
  batteryStats: {
    avgArrival: number;
    minArrival: number;
    maxArrival: number;
    avgDeparture: number;
  };
  avgChargingStops: number;
  avgDurationMinutes: number;
  topStations: { name: string; count: number }[];
  topProviders: string[];
  vehicles: { brand: string; model: string; tripCount: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
