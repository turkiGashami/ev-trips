-- ============================================================
-- EV Trips Community Platform — Initial Schema Migration
-- Migration: 001_initial_schema.sql
-- Created: 2026-04-12
-- ============================================================

BEGIN;

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'guest',
  'user',
  'moderator',
  'admin',
  'super_admin'
);

CREATE TYPE user_status AS ENUM (
  'active',
  'suspended',
  'banned',
  'pending_verification',
  'deleted'
);

CREATE TYPE trip_status AS ENUM (
  'draft',
  'pending_review',
  'published',
  'rejected',
  'hidden',
  'archived'
);

CREATE TYPE reaction_type AS ENUM (
  'helpful',
  'not_helpful'
);

CREATE TYPE report_status AS ENUM (
  'pending',
  'reviewed',
  'resolved',
  'dismissed'
);

CREATE TYPE report_type AS ENUM (
  'misleading_data',
  'false_battery_info',
  'inappropriate_media',
  'spam',
  'abuse',
  'duplicate',
  'off_topic'
);

CREATE TYPE comment_status AS ENUM (
  'visible',
  'hidden',
  'deleted'
);

CREATE TYPE notification_type AS ENUM (
  'trip_approved',
  'trip_rejected',
  'trip_hidden',
  'new_comment',
  'comment_reply',
  'trip_favorited',
  'trip_helpful',
  'new_follower',
  'badge_awarded',
  'system_announcement',
  'admin_message',
  'moderation_notice'
);

CREATE TYPE charger_type AS ENUM (
  'ac_level1',
  'ac_level2',
  'dc_fast',
  'supercharger',
  'ccs',
  'chademo',
  'type2'
);

CREATE TYPE weather_condition AS ENUM (
  'sunny',
  'cloudy',
  'rainy',
  'foggy',
  'windy',
  'extreme_heat',
  'cold',
  'sandstorm'
);

CREATE TYPE driving_style AS ENUM (
  'eco',
  'calm',
  'normal',
  'sporty',
  'aggressive'
);

CREATE TYPE luggage_level AS ENUM (
  'none',
  'light',
  'medium',
  'heavy',
  'full'
);

CREATE TYPE ac_usage AS ENUM (
  'off',
  'partial',
  'full'
);

CREATE TYPE drivetrain_type AS ENUM (
  'rwd',
  'fwd',
  'awd',
  'single_motor',
  'dual_motor',
  'tri_motor'
);

CREATE TYPE banner_status AS ENUM (
  'active',
  'inactive',
  'scheduled'
);

CREATE TYPE page_status AS ENUM (
  'published',
  'draft'
);

-- ============================================================
-- TABLE: cities  (referenced by users, must come first)
-- ============================================================
CREATE TABLE cities (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(100)  NOT NULL,
  name_ar           VARCHAR(100),
  slug              VARCHAR(100)  UNIQUE NOT NULL,
  country           VARCHAR(100)  NOT NULL DEFAULT 'SA',
  latitude          DECIMAL(10,7),
  longitude         DECIMAL(10,7),
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
  id                                      UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                                   VARCHAR(255)  UNIQUE NOT NULL,
  username                                VARCHAR(50)   UNIQUE NOT NULL,
  password_hash                           VARCHAR(255)  NOT NULL,
  full_name                               VARCHAR(255)  NOT NULL,
  bio                                     TEXT,
  avatar_url                              VARCHAR(500),
  country                                 VARCHAR(100),
  city_id                                 UUID          REFERENCES cities(id) ON DELETE SET NULL,
  role                                    user_role     NOT NULL DEFAULT 'user',
  status                                  user_status   NOT NULL DEFAULT 'pending_verification',
  email_verified_at                       TIMESTAMPTZ,
  email_verification_token                VARCHAR(255),
  email_verification_token_expires_at     TIMESTAMPTZ,
  password_reset_token                    VARCHAR(255),
  password_reset_token_expires_at         TIMESTAMPTZ,
  is_contributor_verified                 BOOLEAN       NOT NULL DEFAULT FALSE,
  contributor_points                      INTEGER       NOT NULL DEFAULT 0,
  total_trips                             INTEGER       NOT NULL DEFAULT 0,
  total_views                             INTEGER       NOT NULL DEFAULT 0,
  total_favorites                         INTEGER       NOT NULL DEFAULT 0,
  profile_visibility                      VARCHAR(20)   NOT NULL DEFAULT 'public',
  website_url                             VARCHAR(500),
  twitter_url                             VARCHAR(500),
  instagram_url                           VARCHAR(500),
  linkedin_url                            VARCHAR(500),
  notification_email                      BOOLEAN       NOT NULL DEFAULT TRUE,
  notification_push                       BOOLEAN       NOT NULL DEFAULT TRUE,
  last_login_at                           TIMESTAMPTZ,
  deleted_at                              TIMESTAMPTZ,
  created_at                              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255)  NOT NULL,
  expires_at    TIMESTAMPTZ   NOT NULL,
  revoked_at    TIMESTAMPTZ,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: car_brands
-- ============================================================
CREATE TABLE car_brands (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100)  NOT NULL,
  name_ar     VARCHAR(100),
  slug        VARCHAR(100)  UNIQUE NOT NULL,
  logo_url    VARCHAR(500),
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: car_models
-- ============================================================
CREATE TABLE car_models (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID          NOT NULL REFERENCES car_brands(id) ON DELETE CASCADE,
  name        VARCHAR(100)  NOT NULL,
  name_ar     VARCHAR(100),
  slug        VARCHAR(100)  NOT NULL,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: car_trims
-- ============================================================
CREATE TABLE car_trims (
  id                    UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id              UUID            NOT NULL REFERENCES car_models(id) ON DELETE CASCADE,
  name                  VARCHAR(100)    NOT NULL,
  name_ar               VARCHAR(100),
  battery_capacity_kwh  DECIMAL(5,2),
  range_km_official     INTEGER,
  drivetrain            drivetrain_type,
  is_active             BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: user_vehicles
-- ============================================================
CREATE TABLE user_vehicles (
  id                    UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id              UUID            NOT NULL REFERENCES car_brands(id) ON DELETE RESTRICT,
  model_id              UUID            NOT NULL REFERENCES car_models(id) ON DELETE RESTRICT,
  trim_id               UUID            REFERENCES car_trims(id) ON DELETE SET NULL,
  year                  SMALLINT        NOT NULL,
  nickname              VARCHAR(100),
  image_url             VARCHAR(500),
  battery_capacity_kwh  DECIMAL(5,2),
  drivetrain            drivetrain_type,
  is_default            BOOLEAN         NOT NULL DEFAULT FALSE,
  deleted_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: routes
-- ============================================================
CREATE TABLE routes (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  departure_city_id     UUID          NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  destination_city_id   UUID          NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  slug                  VARCHAR(200)  UNIQUE NOT NULL,
  distance_km           INTEGER,
  is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
  trip_count            INTEGER       NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: charging_stations
-- ============================================================
CREATE TABLE charging_stations (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR(200)  NOT NULL,
  name_ar               VARCHAR(200),
  provider              VARCHAR(100),
  charger_type          charger_type  NOT NULL,
  power_kw              DECIMAL(6,2),
  city_id               UUID          REFERENCES cities(id) ON DELETE SET NULL,
  address               TEXT,
  latitude              DECIMAL(10,7),
  longitude             DECIMAL(10,7),
  opening_hours         VARCHAR(200),
  image_urls            TEXT[],
  is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
  notes                 TEXT,
  suggested_by_user_id  UUID          REFERENCES users(id) ON DELETE SET NULL,
  is_verified           BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: trips
-- ============================================================
CREATE TABLE trips (
  id                                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                           UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id                        UUID          REFERENCES user_vehicles(id) ON DELETE SET NULL,

  -- Vehicle snapshot
  snap_brand_name                   VARCHAR(100),
  snap_model_name                   VARCHAR(100),
  snap_trim_name                    VARCHAR(100),
  snap_year                         SMALLINT,
  snap_battery_capacity_kwh         DECIMAL(5,2),
  snap_drivetrain                   VARCHAR(50),

  -- Route
  departure_city_id                 UUID          NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  destination_city_id               UUID          NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
  route_id                          UUID          REFERENCES routes(id) ON DELETE SET NULL,
  slug                              VARCHAR(300)  UNIQUE NOT NULL,
  title                             VARCHAR(300)  NOT NULL,

  -- Trip date/time
  trip_date                         DATE          NOT NULL,
  departure_time                    TIME,
  arrival_time                      TIME,
  duration_minutes                  INTEGER,
  distance_km                       DECIMAL(8,2),

  -- Battery
  departure_battery_pct             SMALLINT      NOT NULL,
  arrival_battery_pct               SMALLINT      NOT NULL,
  estimated_range_at_departure_km   INTEGER,
  remaining_range_at_arrival_km     INTEGER,
  consumption_rate                  DECIMAL(5,2),

  -- Trip conditions
  passengers_count                  SMALLINT      NOT NULL DEFAULT 1,
  luggage_level                     luggage_level,
  ac_usage                          ac_usage,
  weather_condition                  weather_condition,
  average_speed_kmh                 SMALLINT,
  driving_style                     driving_style,

  -- Content
  route_notes                       TEXT,
  trip_notes                        TEXT,

  -- Status & quality
  status                            trip_status   NOT NULL DEFAULT 'draft',
  rejection_reason                  TEXT,
  completeness_score                SMALLINT      NOT NULL DEFAULT 0,
  is_admin_reviewed                 BOOLEAN       NOT NULL DEFAULT FALSE,
  is_featured                       BOOLEAN       NOT NULL DEFAULT FALSE,

  -- Stats
  view_count                        INTEGER       NOT NULL DEFAULT 0,
  favorite_count                    INTEGER       NOT NULL DEFAULT 0,
  helpful_count                     INTEGER       NOT NULL DEFAULT 0,
  comment_count                     INTEGER       NOT NULL DEFAULT 0,

  -- Timestamps
  submitted_at                      TIMESTAMPTZ,
  published_at                      TIMESTAMPTZ,
  deleted_at                        TIMESTAMPTZ,
  created_at                        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_battery_departure CHECK (departure_battery_pct BETWEEN 0 AND 100),
  CONSTRAINT chk_battery_arrival   CHECK (arrival_battery_pct BETWEEN 0 AND 100),
  CONSTRAINT chk_passengers        CHECK (passengers_count >= 1)
);

-- ============================================================
-- TABLE: trip_stops
-- ============================================================
CREATE TABLE trip_stops (
  id                        UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id                   UUID          NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_order                SMALLINT      NOT NULL,
  charging_station_id       UUID          REFERENCES charging_stations(id) ON DELETE SET NULL,
  station_name              VARCHAR(200)  NOT NULL,
  provider_name             VARCHAR(100),
  charger_type              charger_type,
  city_id                   UUID          REFERENCES cities(id) ON DELETE SET NULL,
  latitude                  DECIMAL(10,7),
  longitude                 DECIMAL(10,7),
  battery_before_pct        SMALLINT,
  battery_after_pct         SMALLINT,
  charging_duration_minutes INTEGER,
  charging_cost             DECIMAL(8,2),
  charging_cost_currency    VARCHAR(3)    NOT NULL DEFAULT 'SAR',
  arrival_time              TIME,
  departure_time            TIME,
  was_busy                  BOOLEAN,
  was_functioning_well      BOOLEAN,
  chargers_available        SMALLINT,
  connector_power_kw        DECIMAL(6,2),
  congestion_note           TEXT,
  quality_note              TEXT,
  notes                     TEXT,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_stop_battery_before CHECK (battery_before_pct IS NULL OR battery_before_pct BETWEEN 0 AND 100),
  CONSTRAINT chk_stop_battery_after  CHECK (battery_after_pct  IS NULL OR battery_after_pct  BETWEEN 0 AND 100)
);

-- ============================================================
-- TABLE: trip_media
-- ============================================================
CREATE TABLE trip_media (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id           UUID          NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id           UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url               VARCHAR(500)  NOT NULL,
  thumbnail_url     VARCHAR(500),
  media_type        VARCHAR(20)   NOT NULL DEFAULT 'image',
  file_size_bytes   INTEGER,
  sort_order        SMALLINT      NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: comments
-- ============================================================
CREATE TABLE comments (
  id                UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id           UUID            NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id           UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id         UUID            REFERENCES comments(id) ON DELETE CASCADE,
  content           TEXT            NOT NULL,
  status            comment_status  NOT NULL DEFAULT 'visible',
  moderation_note   TEXT,
  reply_count       INTEGER         NOT NULL DEFAULT 0,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: trip_reactions
-- ============================================================
CREATE TABLE trip_reactions (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id         UUID           NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id         UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type   reaction_type  NOT NULL,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_trip_reactions UNIQUE (trip_id, user_id, reaction_type)
);

-- ============================================================
-- TABLE: favorites
-- ============================================================
CREATE TABLE favorites (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID        NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_favorites UNIQUE (trip_id, user_id)
);

-- ============================================================
-- TABLE: follows
-- ============================================================
CREATE TABLE follows (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_follows         UNIQUE (follower_id, following_id),
  CONSTRAINT chk_no_self_follow CHECK (follower_id != following_id)
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE notifications (
  id          UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       VARCHAR(255),
  title_ar    VARCHAR(255),
  body        TEXT,
  body_ar     TEXT,
  data        JSONB,
  is_read     BOOLEAN           NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: notification_settings
-- ============================================================
CREATE TABLE notification_settings (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  comments              BOOLEAN     NOT NULL DEFAULT TRUE,
  replies               BOOLEAN     NOT NULL DEFAULT TRUE,
  favorites             BOOLEAN     NOT NULL DEFAULT TRUE,
  helpful_reactions     BOOLEAN     NOT NULL DEFAULT TRUE,
  follows               BOOLEAN     NOT NULL DEFAULT TRUE,
  system_updates        BOOLEAN     NOT NULL DEFAULT TRUE,
  email_notifications   BOOLEAN     NOT NULL DEFAULT TRUE,
  push_notifications    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: reports
-- ============================================================
CREATE TABLE reports (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            report_type     NOT NULL,
  status          report_status   NOT NULL DEFAULT 'pending',
  target_type     VARCHAR(50)     NOT NULL,
  target_id       UUID            NOT NULL,
  reason          TEXT,
  admin_notes     TEXT,
  reviewed_by_id  UUID            REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: badges
-- ============================================================
CREATE TABLE badges (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  key               VARCHAR(100) UNIQUE NOT NULL,
  name              VARCHAR(200) NOT NULL,
  name_ar           VARCHAR(200),
  description       TEXT,
  description_ar    TEXT,
  icon_url          VARCHAR(500),
  criteria          JSONB,
  is_auto_awarded   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: user_badges
-- ============================================================
CREATE TABLE user_badges (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id        UUID        NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_by_id   UUID        REFERENCES users(id) ON DELETE SET NULL,
  awarded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_badges UNIQUE (user_id, badge_id)
);

-- ============================================================
-- TABLE: static_pages
-- ============================================================
CREATE TABLE static_pages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  key             VARCHAR(100) UNIQUE NOT NULL,
  title           VARCHAR(255) NOT NULL,
  title_ar        VARCHAR(255),
  content         TEXT         NOT NULL,
  content_ar      TEXT,
  status          page_status  NOT NULL DEFAULT 'published',
  updated_by_id   UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: admin_logs
-- ============================================================
CREATE TABLE admin_logs (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id      UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action        VARCHAR(100) NOT NULL,
  target_type   VARCHAR(50),
  target_id     UUID,
  payload       JSONB,
  ip_address    VARCHAR(45),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: banners
-- ============================================================
CREATE TABLE banners (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(255)  NOT NULL,
  title_ar        VARCHAR(255),
  body            TEXT,
  body_ar         TEXT,
  image_url       VARCHAR(500),
  link_url        VARCHAR(500),
  status          banner_status NOT NULL DEFAULT 'active',
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  sort_order      SMALLINT      NOT NULL DEFAULT 0,
  created_by_id   UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: system_settings
-- ============================================================
CREATE TABLE system_settings (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  key             VARCHAR(100)  UNIQUE NOT NULL,
  value           TEXT          NOT NULL,
  description     TEXT,
  updated_by_id   UUID          REFERENCES users(id) ON DELETE SET NULL,
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- users
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_users_username     ON users(username);
CREATE INDEX idx_users_status       ON users(status);
CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_users_deleted_at   ON users(deleted_at);
CREATE INDEX idx_users_city_id      ON users(city_id);

-- refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- car_models
CREATE INDEX idx_car_models_brand_id ON car_models(brand_id);

-- car_trims
CREATE INDEX idx_car_trims_model_id ON car_trims(model_id);

-- user_vehicles
CREATE INDEX idx_user_vehicles_user_id  ON user_vehicles(user_id);
CREATE INDEX idx_user_vehicles_brand_id ON user_vehicles(brand_id);
CREATE INDEX idx_user_vehicles_model_id ON user_vehicles(model_id);

-- routes
CREATE INDEX idx_routes_departure_city_id   ON routes(departure_city_id);
CREATE INDEX idx_routes_destination_city_id ON routes(destination_city_id);

-- charging_stations
CREATE INDEX idx_charging_stations_city_id      ON charging_stations(city_id);
CREATE INDEX idx_charging_stations_charger_type ON charging_stations(charger_type);

-- trips
CREATE INDEX idx_trips_user_id              ON trips(user_id);
CREATE INDEX idx_trips_departure_city_id    ON trips(departure_city_id);
CREATE INDEX idx_trips_destination_city_id  ON trips(destination_city_id);
CREATE INDEX idx_trips_status               ON trips(status);
CREATE INDEX idx_trips_trip_date            ON trips(trip_date);
CREATE INDEX idx_trips_view_count           ON trips(view_count DESC);
CREATE INDEX idx_trips_published_at         ON trips(published_at DESC);
CREATE INDEX idx_trips_deleted_at           ON trips(deleted_at);
CREATE UNIQUE INDEX idx_trips_slug          ON trips(slug);
CREATE INDEX idx_trips_composite_route_status
  ON trips(departure_city_id, destination_city_id, status);
CREATE INDEX idx_trips_is_featured          ON trips(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_trips_route_id             ON trips(route_id);

-- trip_stops
CREATE INDEX idx_trip_stops_trip_id             ON trip_stops(trip_id);
CREATE INDEX idx_trip_stops_charging_station_id ON trip_stops(charging_station_id);
CREATE INDEX idx_trip_stops_stop_order          ON trip_stops(trip_id, stop_order);

-- trip_media
CREATE INDEX idx_trip_media_trip_id  ON trip_media(trip_id);
CREATE INDEX idx_trip_media_user_id  ON trip_media(user_id);

-- comments
CREATE INDEX idx_comments_trip_id    ON comments(trip_id);
CREATE INDEX idx_comments_user_id    ON comments(user_id);
CREATE INDEX idx_comments_parent_id  ON comments(parent_id);
CREATE INDEX idx_comments_status     ON comments(status);
CREATE INDEX idx_comments_deleted_at ON comments(deleted_at);

-- trip_reactions
CREATE INDEX idx_trip_reactions_trip_id  ON trip_reactions(trip_id);
CREATE INDEX idx_trip_reactions_user_id  ON trip_reactions(user_id);

-- favorites
CREATE INDEX idx_favorites_trip_id  ON favorites(trip_id);
CREATE INDEX idx_favorites_user_id  ON favorites(user_id);

-- follows
CREATE INDEX idx_follows_follower_id   ON follows(follower_id);
CREATE INDEX idx_follows_following_id  ON follows(following_id);

-- notifications
CREATE INDEX idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX idx_notifications_is_read    ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;

-- reports
CREATE INDEX idx_reports_status          ON reports(status);
CREATE INDEX idx_reports_target          ON reports(target_type, target_id);
CREATE INDEX idx_reports_reporter_id     ON reports(reporter_id);

-- user_badges
CREATE INDEX idx_user_badges_user_id   ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id  ON user_badges(badge_id);

-- admin_logs
CREATE INDEX idx_admin_logs_actor_id   ON admin_logs(actor_id);
CREATE INDEX idx_admin_logs_action     ON admin_logs(action);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- banners
CREATE INDEX idx_banners_status    ON banners(status);
CREATE INDEX idx_banners_starts_at ON banners(starts_at);
CREATE INDEX idx_banners_ends_at   ON banners(ends_at);

-- ============================================================
-- TRIGGERS — auto-update updated_at columns
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_car_brands_updated_at
  BEFORE UPDATE ON car_brands
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_car_models_updated_at
  BEFORE UPDATE ON car_models
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_car_trims_updated_at
  BEFORE UPDATE ON car_trims
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_user_vehicles_updated_at
  BEFORE UPDATE ON user_vehicles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_charging_stations_updated_at
  BEFORE UPDATE ON charging_stations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_trip_stops_updated_at
  BEFORE UPDATE ON trip_stops
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_badges_updated_at
  BEFORE UPDATE ON badges
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_static_pages_updated_at
  BEFORE UPDATE ON static_pages
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMIT;
