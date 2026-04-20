import type {
  AcUsage,
  DrivingStyle,
  LuggageLevel,
  MediaType,
  ReactionType,
  RoadType,
  StopType,
  TripStatus,
  WeatherCondition,
} from '../enums';
import type { UserSummary } from './user.types';
import type { VehicleSnapshot } from './vehicle.types';

// ─────────────────────────────────────────────────────────────────────────────
// Trip domain types
// ─────────────────────────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  status: TripStatus;

  // Route data
  originCity: string;
  originCityAr: string | null;
  destinationCity: string;
  destinationCityAr: string | null;
  distanceKm: number;
  durationMinutes: number;
  waypoints: GeoPoint[] | null;

  // Battery data
  batteryStartPercent: number;
  batteryEndPercent: number;
  batteryUsedPercent: number;
  batteryStartKwh: number | null;
  batteryEndKwh: number | null;
  realRangeAchievedKm: number | null;
  officialRangeKm: number | null;
  rangeEfficiencyPercent: number | null;
  consumptionKwhPer100km: number | null;
  regeneratedKwh: number | null;

  // Conditions at time of trip
  weather: WeatherCondition | null;
  drivingStyle: DrivingStyle | null;
  luggageLevel: LuggageLevel | null;
  acUsage: AcUsage | null;
  roadType: RoadType | null;
  passengerCount: number | null;
  outsideTempCelsius: number | null;
  elevationGainMeters: number | null;

  // Charging summary
  totalChargingStops: number;
  totalChargingMinutes: number;
  totalEnergyAddedKwh: number | null;
  chargingCostSar: number | null;

  // Engagement counts (denormalized for perf)
  helpfulCount: number;
  notHelpfulCount: number;
  favoriteCount: number;
  commentCount: number;
  viewCount: number;

  // Relations
  author: UserSummary;
  vehicle: VehicleSnapshot;
  stops: TripStop[];
  media: TripMedia[];
  tags: string[];

  // User-specific state (only when authenticated)
  userReaction?: ReactionType | null;
  isFavorited?: boolean;

  // Admin fields
  moderatorNote: string | null;
  rejectionReason: string | null;

  tripDate: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TripSummary {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  status: TripStatus;
  originCity: string;
  originCityAr: string | null;
  destinationCity: string;
  destinationCityAr: string | null;
  distanceKm: number;
  durationMinutes: number;
  batteryStartPercent: number;
  batteryEndPercent: number;
  batteryUsedPercent: number;
  consumptionKwhPer100km: number | null;
  rangeEfficiencyPercent: number | null;
  totalChargingStops: number;
  weather: WeatherCondition | null;
  drivingStyle: DrivingStyle | null;
  acUsage: AcUsage | null;
  helpfulCount: number;
  favoriteCount: number;
  commentCount: number;
  coverImageUrl: string | null;
  author: UserSummary;
  vehicleSummary: string; // e.g. "2023 Tesla Model 3 Long Range"
  isFavorited?: boolean;
  userReaction?: ReactionType | null;
  tripDate: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface TripStop {
  id: string;
  tripId: string;
  type: StopType;
  order: number;
  name: string;
  nameAr: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  batteryOnArrivalPercent: number | null;
  batteryOnDeparturePercent: number | null;
  chargingDurationMinutes: number | null;
  energyAddedKwh: number | null;
  chargerType: string | null;
  chargingNetworkName: string | null;
  costSar: number | null;
  notes: string | null;
  notesAr: string | null;
  stayDurationMinutes: number | null;
  createdAt: string;
}

export interface TripMedia {
  id: string;
  tripId: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  altTextAr: string | null;
  isCover: boolean;
  order: number;
  widthPx: number | null;
  heightPx: number | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

// ─────────────────────
// Route Insights (aggregated analytics)
// ─────────────────────

export interface RouteInsights {
  originCity: string;
  destinationCity: string;
  tripCount: number;
  avgDistanceKm: number;
  avgBatteryUsedPercent: number;
  avgConsumptionKwhPer100km: number | null;
  avgRangeEfficiencyPercent: number | null;
  avgChargingStops: number;
  avgDurationMinutes: number;
  mostCommonWeather: WeatherCondition | null;
  mostCommonDrivingStyle: DrivingStyle | null;
  mostCommonAcUsage: AcUsage | null;
  popularVehicles: RouteVehicleStat[];
  lastUpdatedAt: string;
}

export interface RouteVehicleStat {
  vehicleLabel: string; // e.g. "Tesla Model 3 LR AWD"
  tripCount: number;
  avgBatteryUsed: number;
  avgConsumption: number | null;
}

// ─────────────────────
// Comments
// ─────────────────────

export interface Comment {
  id: string;
  tripId: string;
  parentId: string | null;
  author: UserSummary;
  content: string;
  status: string;
  replyCount: number;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────
// Reports
// ─────────────────────

export interface Report {
  id: string;
  reporterId: string;
  tripId: string | null;
  commentId: string | null;
  type: string;
  description: string | null;
  status: string;
  moderatorNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

// ─────────────────────
// Filters & query params
// ─────────────────────

export interface TripFilters {
  originCity?: string;
  destinationCity?: string;
  vehicleBrandId?: string;
  vehicleModelId?: string;
  vehicleTrimId?: string;
  weather?: WeatherCondition;
  drivingStyle?: DrivingStyle;
  acUsage?: AcUsage;
  roadType?: RoadType;
  minDistanceKm?: number;
  maxDistanceKm?: number;
  minBatteryStart?: number;
  maxBatteryEnd?: number;
  minRangeEfficiency?: number;
  maxChargingStops?: number;
  authorId?: string;
  tags?: string[];
  search?: string;
  tripDateFrom?: string;
  tripDateTo?: string;
}
