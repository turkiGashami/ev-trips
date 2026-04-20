// ─── User & Auth ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  fullNameAr?: string;
  avatarUrl?: string;
  bio?: string;
  bioAr?: string;
  city?: string;
  country?: string;
  joinedAt: string;
  isVerified: boolean;
  isActive: boolean;
  role: UserRole;
  stats: UserStats;
  preferences: UserPreferences;
}

export type UserRole = 'user' | 'moderator' | 'admin';

export interface UserStats {
  tripsCount: number;
  totalDistance: number; // km
  totalEnergyUsed: number; // kWh
  savedTripsCount: number;
  likesReceived: number;
  commentsCount: number;
  reputation: number;
  badges: Badge[];
}

export interface UserPreferences {
  locale: 'ar' | 'en';
  distanceUnit: 'km' | 'mi';
  temperatureUnit: 'celsius' | 'fahrenheit';
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface Badge {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  iconUrl: string;
  awardedAt: string;
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  variant?: string;
  batteryCapacity: number; // kWh
  realWorldRange: number; // km
  chargingSpeedAc: number; // kW
  chargingSpeedDc: number; // kW
  color?: string;
  plateNumber?: string;
  imageUrl?: string;
  isDefault: boolean;
  tripsCount: number;
  totalDistance: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleMake {
  id: string;
  name: string;
  logoUrl?: string;
  models: VehicleModel[];
}

export interface VehicleModel {
  id: string;
  makeId: string;
  name: string;
  variants: VehicleVariant[];
}

export interface VehicleVariant {
  id: string;
  modelId: string;
  name: string;
  year: number;
  batteryCapacity: number;
  wltp: number;
  chargingSpeedAc: number;
  chargingSpeedDc: number;
}

// ─── Trip ─────────────────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  slug: string;
  userId: string;
  user: Pick<User, 'id' | 'username' | 'fullName' | 'fullNameAr' | 'avatarUrl'>;
  vehicleId: string;
  vehicle: Pick<Vehicle, 'id' | 'make' | 'model' | 'year' | 'batteryCapacity'>;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  status: TripStatus;
  visibility: TripVisibility;
  startLocation: Location;
  endLocation: Location;
  route?: GeoJSON;
  departureAt: string;
  arrivalAt?: string;
  totalDistance: number; // km
  totalDuration: number; // minutes
  batteryStart: number; // %
  batteryEnd: number; // %
  batteryUsed: number; // kWh
  averageConsumption: number; // kWh/100km
  weather?: WeatherCondition;
  outsideTemperatureC?: number;
  windSpeedKmh?: number;
  roadType?: RoadType;
  drivingMode?: DrivingMode;
  averageSpeedKmh?: number;
  acLevel?: 'off' | 'low' | 'medium' | 'high' | 'auto';
  acFanSpeed?: number; // 1–5
  passengersCount?: number;
  hasLuggage?: boolean;
  luggageWeight?: number; // kg approx
  stops: ChargingStop[];
  mediaUrls: string[];
  tags: string[];
  likesCount: number;
  isLikedByMe: boolean;
  commentsCount: number;
  savesCount: number;
  isSavedByMe: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TripStatus = 'draft' | 'published' | 'archived';
export type TripVisibility = 'public' | 'followers' | 'private';
export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'sandstorm' | 'foggy' | 'windy';
export type RoadType = 'highway' | 'city' | 'mixed' | 'mountain' | 'desert';
export type DrivingMode = 'eco' | 'normal' | 'sport';

export interface ChargingStop {
  id: string;
  tripId: string;
  order: number;
  location: Location;
  stationId?: string;
  station?: ChargingStation;
  batteryArrival: number; // %
  batteryDeparture: number; // %
  energyAdded: number; // kWh
  chargingDuration: number; // minutes
  chargingSpeed: number; // kW
  cost?: number; // SAR
  notes?: string;
  arrivalAt: string;
  departureAt: string;
  distanceFromPrevKm?: number;
  durationFromPrevMinutes?: number;
  providerName?: string;
}

export interface Location {
  lat: number;
  lng: number;
  name: string;
  nameAr?: string;
  city?: string;
  cityAr?: string;
  country?: string;
  countryAr?: string;
  placeId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GeoJSON = Record<string, any>;

// ─── Charging Station ─────────────────────────────────────────────────────────

export interface ChargingStation {
  id: string;
  name: string;
  nameAr?: string;
  network: string;
  networkAr?: string;
  location: Location;
  address: string;
  addressAr?: string;
  phone?: string;
  website?: string;
  operatingHours?: string;
  isOpen24h: boolean;
  amenities: string[];
  connectors: Connector[];
  rating: number;
  reviewsCount: number;
  tripsCount: number;
  imageUrls: string[];
  isVerified: boolean;
  updatedAt: string;
}

export interface Connector {
  type: ConnectorType;
  count: number;
  maxPower: number; // kW
  isAvailable: boolean;
}

export type ConnectorType = 'Type2' | 'CCS' | 'CHAdeMO' | 'Tesla' | 'GBT' | 'Type1';

// ─── Route ────────────────────────────────────────────────────────────────────

export interface RouteInsight {
  id: string;
  slug: string;
  origin: Location;
  destination: Location;
  distance: number; // km
  tripsCount: number;
  averageDuration: number; // minutes
  averageConsumption: number; // kWh/100km
  chargingStopsCount: number;
  stations: ChargingStation[];
  popularVehicles: Array<{ make: string; model: string; count: number }>;
  recentTrips: Trip[];
  difficulty: 'easy' | 'moderate' | 'challenging';
  tags: string[];
}

// ─── Comment ──────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  tripId: string;
  userId: string;
  user: Pick<User, 'id' | 'username' | 'fullName' | 'fullNameAr' | 'avatarUrl'>;
  content: string;
  parentId?: string;
  replies?: Comment[];
  likesCount: number;
  isLikedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  isRead: boolean;
  actionUrl?: string;
  actorId?: string;
  actor?: Pick<User, 'id' | 'username' | 'fullName' | 'avatarUrl'>;
  entityId?: string;
  entityType?: 'trip' | 'comment' | 'vehicle' | 'station';
  createdAt: string;
}

export type NotificationType =
  | 'trip_like'
  | 'trip_comment'
  | 'comment_reply'
  | 'comment_like'
  | 'trip_save'
  | 'new_follower'
  | 'system'
  | 'achievement';

// ─── Common ───────────────────────────────────────────────────────────────────

export interface Contributor {
  user: User;
  rank: number;
  period: 'week' | 'month' | 'all';
}

export type Locale = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

export interface SelectOption {
  value: string;
  label: string;
  labelAr?: string;
}

export interface FilterState {
  search?: string;
  fromCity?: string;
  toCity?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleTrim?: string;
  yearFrom?: number;
  yearTo?: number;
  batteryDepartureMin?: number;
  batteryArrivalMin?: number;
  numStops?: number;
  chargerType?: ConnectorType;
  minDistanceKm?: number;
  maxDistanceKm?: number;
  minDurationMinutes?: number;
  maxDurationMinutes?: number;
  weatherCondition?: WeatherCondition;
  acUsage?: boolean;
  windSpeedMax?: number;
  passengersCount?: number;
  hasLuggage?: boolean;
  roadType?: RoadType;
  drivingMode?: DrivingMode;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: TripSortField;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export type TripSortField = 'createdAt' | 'distance' | 'likesCount' | 'viewsCount' | 'departureAt' | 'batteryArrival' | 'numStops';
