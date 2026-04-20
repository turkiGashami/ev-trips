// ─────────────────────────────────────────────────────────────────────────────
// EV Trips Community — Platform-wide Enums
// Single source of truth for all enumerated values.
// These are shared between the API (NestJS), web (Next.js), and mobile (Expo).
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────
// User & Auth
// ─────────────────────

export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
  DELETED = 'deleted',
}

// ─────────────────────
// Trip lifecycle
// ─────────────────────

export enum TripStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  HIDDEN = 'hidden',
  ARCHIVED = 'archived',
}

// ─────────────────────
// Social interactions
// ─────────────────────

export enum ReactionType {
  HELPFUL = 'helpful',
  NOT_HELPFUL = 'not_helpful',
}

// ─────────────────────
// Moderation
// ─────────────────────

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ReportType {
  MISLEADING_DATA = 'misleading_data',
  FALSE_BATTERY_INFO = 'false_battery_info',
  INAPPROPRIATE_MEDIA = 'inappropriate_media',
  SPAM = 'spam',
  ABUSE = 'abuse',
  DUPLICATE = 'duplicate',
  OFF_TOPIC = 'off_topic',
}

export enum CommentStatus {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  DELETED = 'deleted',
}

// ─────────────────────
// Notifications
// ─────────────────────

export enum NotificationType {
  TRIP_APPROVED = 'trip_approved',
  TRIP_REJECTED = 'trip_rejected',
  TRIP_HIDDEN = 'trip_hidden',
  NEW_COMMENT = 'new_comment',
  COMMENT_REPLY = 'comment_reply',
  TRIP_FAVORITED = 'trip_favorited',
  TRIP_HELPFUL = 'trip_helpful',
  NEW_FOLLOWER = 'new_follower',
  BADGE_AWARDED = 'badge_awarded',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ADMIN_MESSAGE = 'admin_message',
  MODERATION_NOTICE = 'moderation_notice',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  PUSH = 'push',
}

// ─────────────────────
// Charging infrastructure
// ─────────────────────

export enum ChargerType {
  AC_LEVEL1 = 'ac_level1',
  AC_LEVEL2 = 'ac_level2',
  DC_FAST = 'dc_fast',
  SUPERCHARGER = 'supercharger',
  CCS = 'ccs',
  CHADEMO = 'chademo',
  TYPE2 = 'type2',
}

export enum ChargingStationStatus {
  OPERATIONAL = 'operational',
  COMING_SOON = 'coming_soon',
  OFFLINE = 'offline',
  UNDER_MAINTENANCE = 'under_maintenance',
  PERMANENTLY_CLOSED = 'permanently_closed',
}

// ─────────────────────
// Trip conditions & context
// ─────────────────────

export enum WeatherCondition {
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  FOGGY = 'foggy',
  WINDY = 'windy',
  EXTREME_HEAT = 'extreme_heat',
  COLD = 'cold',
  SANDSTORM = 'sandstorm',
}

export enum DrivingStyle {
  ECO = 'eco',
  CALM = 'calm',
  NORMAL = 'normal',
  SPORTY = 'sporty',
  AGGRESSIVE = 'aggressive',
}

export enum LuggageLevel {
  NONE = 'none',
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  FULL = 'full',
}

export enum AcUsage {
  OFF = 'off',
  PARTIAL = 'partial',
  FULL = 'full',
}

// ─────────────────────
// Vehicle specifications
// ─────────────────────

export enum DrivetrainType {
  RWD = 'rwd',
  FWD = 'fwd',
  AWD = 'awd',
  SINGLE_MOTOR = 'single_motor',
  DUAL_MOTOR = 'dual_motor',
  TRI_MOTOR = 'tri_motor',
}

export enum VehicleBodyStyle {
  SEDAN = 'sedan',
  SUV = 'suv',
  HATCHBACK = 'hatchback',
  CROSSOVER = 'crossover',
  PICKUP = 'pickup',
  VAN = 'van',
  COUPE = 'coupe',
  WAGON = 'wagon',
}

// ─────────────────────
// Media & uploads
// ─────────────────────

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum MediaStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

// ─────────────────────
// Road types
// ─────────────────────

export enum RoadType {
  HIGHWAY = 'highway',
  CITY = 'city',
  MIXED = 'mixed',
  MOUNTAIN = 'mountain',
  DESERT = 'desert',
  COASTAL = 'coastal',
}

// ─────────────────────
// Stop types on a trip
// ─────────────────────

export enum StopType {
  CHARGING = 'charging',
  REST = 'rest',
  FOOD = 'food',
  ATTRACTION = 'attraction',
  FUEL = 'fuel',
  OVERNIGHT = 'overnight',
  OTHER = 'other',
}

// ─────────────────────
// Badges
// ─────────────────────

export enum BadgeType {
  FIRST_TRIP = 'first_trip',
  ROAD_WARRIOR = 'road_warrior',
  LONG_HAULER = 'long_hauler',
  EARLY_ADOPTER = 'early_adopter',
  HELPFUL_REVIEWER = 'helpful_reviewer',
  SUPER_CONTRIBUTOR = 'super_contributor',
  EFFICIENCY_MASTER = 'efficiency_master',
  CITY_EXPLORER = 'city_explorer',
}

// ─────────────────────
// Sort & filter options
// ─────────────────────

export enum TripSortField {
  CREATED_AT = 'createdAt',
  PUBLISHED_AT = 'publishedAt',
  DISTANCE = 'distance',
  HELPFUL_COUNT = 'helpfulCount',
  FAVORITE_COUNT = 'favoriteCount',
  COMMENT_COUNT = 'commentCount',
  VIEW_COUNT = 'viewCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
