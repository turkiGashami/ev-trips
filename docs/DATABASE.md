# EV Trips Community — Database Design

> **Document Version:** 1.0  
> **Last Updated:** April 2026  
> **Database:** PostgreSQL 16  
> **ORM:** TypeORM 0.3.x

---

## Table of Contents

1. [Overview & Principles](#1-overview--principles)
2. [Entity Relationship Map](#2-entity-relationship-map)
3. [Table Reference](#3-table-reference)
4. [Enum Definitions](#4-enum-definitions)
5. [Index Strategy](#5-index-strategy)
6. [Key Design Patterns](#6-key-design-patterns)
7. [Route Insights Query](#7-route-insights-query)
8. [Full-Text Search Setup](#8-full-text-search-setup)
9. [Sample Seed Data](#9-sample-seed-data)
10. [Migration Strategy](#10-migration-strategy)

---

## 1. Overview & Principles

### Design Principles

1. **No synchronize in production.** All schema changes go through numbered migration files. `synchronize: false` is enforced in all environments.
2. **Soft deletes everywhere user-generated content exists.** `deleted_at` column with partial index preserves data integrity and enables recovery.
3. **Denormalized counters for performance.** `favorite_count`, `comment_count`, `view_count`, `helpful_count` are maintained at application level (or via DB trigger) to avoid expensive COUNT queries on hot list views.
4. **Vehicle snapshot pattern.** Trips snapshot vehicle data at submission time so historical records remain accurate even after vehicle profile edits.
5. **Bilingual text stored as two columns.** Entities that require bilingual display (cities, brands, models, static pages) store `name_ar` and `name_en` as separate columns, never JSONB for names (simpler indexing and querying).
6. **JSONB for truly flexible metadata.** Trip media extra_data, station amenities, notification payload stored as JSONB where schema varies.
7. **UUID primary keys throughout.** Prevents enumeration attacks, consistent across distributed systems, no coordination required for ID generation.
8. **Timestamp conventions:** `created_at` and `updated_at` on every table (auto-managed by TypeORM). `deleted_at` on soft-deleteable tables. `published_at` on trips.
9. **snake_case column names.** Enforced via TypeORM `SnakeCaseNamingStrategy`.

### PostgreSQL Features Utilized

| Feature | Usage |
|---------|-------|
| JSONB | `trip_stops.metadata`, `notifications.payload`, `admin_logs.before_state`, `admin_logs.after_state` |
| Arrays | `trip_media.tags[]` |
| tsvector / GIN | Full-text search on trips |
| Partial indexes | Soft-delete filtering, active trip indexes |
| Enums | `trip_status`, `user_role`, `notification_type`, `report_status` |
| Generated columns | `search_vector` (tsvector, generated) — PostgreSQL 12+ |
| ON DELETE behaviors | FK constraints with CASCADE or SET NULL as appropriate |

---

## 2. Entity Relationship Map

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   brands    │──────<│  vehicle_models  │       │     cities      │
│─────────────│       │─────────────────│       │─────────────────│
│ id (PK)     │       │ id (PK)         │       │ id (PK)         │
│ name_ar     │       │ brand_id (FK)   │       │ name_ar         │
│ name_en     │       │ name_ar         │       │ name_en         │
│ logo_url    │       │ name_en         │       │ slug            │
│ slug        │       │ year_from       │       │ region_ar       │
│ is_active   │       │ year_to         │       │ region_en       │
└─────────────┘       │ battery_kwh     │       │ is_active       │
                      │ range_km        │       └────────┬────────┘
                      │ drive_type      │                │
                      └──────────┬──────┘                │
                                 │                        │
┌──────────────────┐             │             ┌──────────▼────────────────┐
│      users       │             │             │          trips            │
│──────────────────│             │             │───────────────────────────│
│ id (PK)          │             │             │ id (PK)                   │
│ username         │             │             │ slug (UNIQUE)             │
│ email (UNIQUE)   │             │             │ title                     │
│ password_hash    │             │             │ description               │
│ display_name     │             │             │ status (ENUM)             │
│ avatar_url       │             │             │ author_id (FK→users)      │
│ bio              │◄────────────┼─────────────│ vehicle_id (FK→vehicles)  │
│ role (ENUM)      │             │             │ — SNAPSHOT FIELDS —       │
│ is_verified      │             │             │ vehicle_brand_id (FK)     │
│ is_banned        │             │             │ vehicle_model_id (FK)     │
│ refresh_token_hash│            │             │ vehicle_brand_name        │
│ expo_push_token  │             │             │ vehicle_model_name        │
│ created_at       │             │             │ vehicle_year              │
│ updated_at       │             │             │ vehicle_battery_kwh       │
└──────┬───────────┘             │             │ vehicle_range_km          │
       │                         │             │ — ROUTE —                 │
       │ ┌───────────────────────┘             │ departure_city_id (FK)    │
       │ │                                     │ departure_city_name       │
       │ ▼                                     │ destination_city_id (FK)  │
┌──────┴──────────┐                            │ destination_city_name     │
│    vehicles     │                            │ — STATS —                 │
│─────────────────│                            │ total_distance_km         │
│ id (PK)         │                            │ energy_consumed_kwh       │
│ user_id (FK)    │◄───────────────────────────│ start_battery_pct         │
│ brand_id (FK)   │                            │ end_battery_pct           │
│ model_id (FK)   │                            │ duration_minutes          │
│ year            │                            │ avg_speed_kmh             │
│ color           │                            │ max_speed_kmh             │
│ plate_number    │                            │ — COUNTERS —              │
│ battery_kwh     │                            │ view_count                │
│ range_km        │                            │ favorite_count            │
│ nickname        │                            │ comment_count             │
│ is_primary      │                            │ helpful_count             │
│ deleted_at      │                            │ — META —                  │
│ created_at      │                            │ cover_image_url           │
│ updated_at      │                            │ published_at              │
└─────────────────┘                            │ rejection_reason          │
                                               │ search_vector (tsvector)  │
       ┌───────────────────────────────────────│ deleted_at                │
       │                         ┌─────────────│ created_at                │
       │                         │             │ updated_at                │
       ▼                         ▼             └───────────────────────────┘
┌───────────────┐     ┌──────────────────┐            │           │
│  trip_stops   │     │   trip_media     │            │           │
│───────────────│     │──────────────────│            │           │
│ id (PK)       │     │ id (PK)          │            │           │
│ trip_id (FK)  │     │ trip_id (FK)     │            │           │
│ order_index   │     │ media_type       │      ┌─────▼──────┐  ┌─▼──────────────┐
│ city_id (FK)  │     │ url              │      │  comments  │  │  favorites     │
│ city_name     │     │ thumbnail_url    │      │────────────│  │────────────────│
│ station_id    │     │ caption          │      │ id (PK)    │  │ id (PK)        │
│ charger_type  │     │ order_index      │      │ trip_id FK │  │ user_id (FK)   │
│ charge_added_pct│   │ extra_data(JSONB)│      │ user_id FK │  │ trip_id (FK)   │
│ charge_duration │   │ created_at       │      │ parent_id  │  │ created_at     │
│ cost_sar      │     └──────────────────┘      │ body       │  └────────────────┘
│ notes         │                               │ helpful_cnt│
│ latitude      │                               │ deleted_at │  ┌────────────────┐
│ longitude     │                               │ created_at │  │  reactions     │
│ created_at    │                               └────────────┘  │────────────────│
└───────────────┘                                               │ id (PK)        │
                                                                │ user_id (FK)   │
┌─────────────────────┐    ┌──────────────────────┐            │ trip_id (FK)   │
│    notifications    │    │  charging_stations   │            │ type (ENUM)    │
│─────────────────────│    │──────────────────────│            │ created_at     │
│ id (PK)             │    │ id (PK)              │            └────────────────┘
│ recipient_id (FK)   │    │ name_ar              │
│ actor_id (FK)       │    │ name_en              │  ┌──────────────────────┐
│ type (ENUM)         │    │ operator_ar          │  │  user_follows        │
│ entity_type         │    │ operator_en          │  │──────────────────────│
│ entity_id           │    │ city_id (FK)         │  │ id (PK)              │
│ payload (JSONB)     │    │ latitude             │  │ follower_id (FK)     │
│ is_read             │    │ longitude            │  │ following_id (FK)    │
│ created_at          │    │ charger_types[]      │  │ created_at           │
└─────────────────────┘    │ max_power_kw         │  └──────────────────────┘
                           │ num_ports            │
┌───────────────────┐      │ is_free              │  ┌──────────────────────┐
│    admin_logs     │      │ opening_hours        │  │    user_badges       │
│───────────────────│      │ amenities (JSONB)    │  │──────────────────────│
│ id (PK)           │      │ photos[]             │  │ id (PK)              │
│ admin_id (FK)     │      │ status               │  │ user_id (FK)         │
│ action            │      │ created_at           │  │ badge_type           │
│ entity_type       │      └──────────────────────┘  │ awarded_at           │
│ entity_id         │                                └──────────────────────┘
│ before_state JSONB│
│ after_state JSONB │      ┌──────────────────────┐
│ ip_address        │      │      reports         │
│ created_at        │      │──────────────────────│
└───────────────────┘      │ id (PK)              │
                           │ reporter_id (FK)     │
                           │ entity_type          │
                           │ entity_id            │
                           │ reason (ENUM)        │
                           │ description          │
                           │ status (ENUM)        │
                           │ resolved_by (FK)     │
                           │ resolution_note      │
                           │ created_at           │
                           └──────────────────────┘
```

---

## 3. Table Reference

### Table: `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | alphanumeric + hyphens, validated |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | lowercased on save |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt, cost factor 12 |
| `display_name` | VARCHAR(100) | NOT NULL | shown publicly |
| `display_name_ar` | VARCHAR(100) | NULL | optional Arabic display name |
| `avatar_url` | VARCHAR(500) | NULL | S3 public URL |
| `bio` | TEXT | NULL | max 500 chars (app-level) |
| `bio_ar` | TEXT | NULL | Arabic bio |
| `role` | user_role (ENUM) | NOT NULL, DEFAULT 'user' | |
| `is_email_verified` | BOOLEAN | NOT NULL, DEFAULT false | |
| `is_banned` | BOOLEAN | NOT NULL, DEFAULT false | |
| `ban_reason` | TEXT | NULL | set when banned |
| `email_verification_token` | VARCHAR(255) | NULL | hashed JWT |
| `email_verification_expires_at` | TIMESTAMPTZ | NULL | |
| `password_reset_token` | VARCHAR(255) | NULL | hashed random token |
| `password_reset_expires_at` | TIMESTAMPTZ | NULL | |
| `refresh_token_hash` | VARCHAR(255) | NULL | bcrypt hash of current refresh token |
| `refresh_token_expires_at` | TIMESTAMPTZ | NULL | |
| `expo_push_token` | VARCHAR(255) | NULL | Expo push notification token |
| `trip_count` | INTEGER | NOT NULL, DEFAULT 0 | denormalized counter |
| `follower_count` | INTEGER | NOT NULL, DEFAULT 0 | denormalized counter |
| `following_count` | INTEGER | NOT NULL, DEFAULT 0 | denormalized counter |
| `last_seen_at` | TIMESTAMPTZ | NULL | updated on API requests |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `vehicles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, NOT NULL | ON DELETE CASCADE |
| `brand_id` | UUID | FK → brands.id, NOT NULL | |
| `model_id` | UUID | FK → vehicle_models.id, NOT NULL | |
| `year` | SMALLINT | NOT NULL | e.g., 2024 |
| `color` | VARCHAR(50) | NULL | free text |
| `color_ar` | VARCHAR(50) | NULL | Arabic color name |
| `plate_number` | VARCHAR(20) | NULL | optional, not publicly shown |
| `battery_capacity_kwh` | DECIMAL(6,2) | NULL | overrides model default |
| `range_km` | SMALLINT | NULL | overrides model default |
| `nickname` | VARCHAR(100) | NULL | user's name for this vehicle |
| `is_primary` | BOOLEAN | NOT NULL, DEFAULT false | only one primary per user |
| `deleted_at` | TIMESTAMPTZ | NULL | soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `trips`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | SEO-friendly URL segment |
| `title` | VARCHAR(200) | NOT NULL | min 10 chars |
| `description` | TEXT | NOT NULL | min 50 chars |
| `status` | trip_status (ENUM) | NOT NULL, DEFAULT 'draft' | |
| `author_id` | UUID | FK → users.id, NOT NULL | ON DELETE CASCADE |
| `vehicle_id` | UUID | FK → vehicles.id | ON DELETE SET NULL (snapshot preserved) |
| `vehicle_brand_id` | UUID | FK → brands.id | SET NULL — snapshot field |
| `vehicle_model_id` | UUID | FK → vehicle_models.id | SET NULL — snapshot field |
| `vehicle_brand_name` | VARCHAR(100) | NOT NULL | snapshotted at submission |
| `vehicle_model_name` | VARCHAR(100) | NOT NULL | snapshotted at submission |
| `vehicle_year` | SMALLINT | NOT NULL | snapshotted |
| `vehicle_battery_kwh` | DECIMAL(6,2) | NULL | snapshotted |
| `vehicle_range_km` | SMALLINT | NULL | snapshotted |
| `departure_city_id` | UUID | FK → cities.id | |
| `departure_city_name` | VARCHAR(100) | NOT NULL | snapshotted |
| `departure_city_name_ar` | VARCHAR(100) | NOT NULL | snapshotted |
| `destination_city_id` | UUID | FK → cities.id | |
| `destination_city_name` | VARCHAR(100) | NOT NULL | snapshotted |
| `destination_city_name_ar` | VARCHAR(100) | NOT NULL | snapshotted |
| `trip_date` | DATE | NOT NULL | actual trip date |
| `total_distance_km` | DECIMAL(8,2) | NULL | total route distance |
| `energy_consumed_kwh` | DECIMAL(8,3) | NULL | total energy consumed |
| `start_battery_pct` | SMALLINT | NULL | 0-100 |
| `end_battery_pct` | SMALLINT | NULL | 0-100 |
| `duration_minutes` | INTEGER | NULL | total trip duration |
| `avg_speed_kmh` | DECIMAL(5,1) | NULL | |
| `max_speed_kmh` | DECIMAL(5,1) | NULL | |
| `outside_temp_celsius` | DECIMAL(4,1) | NULL | weather conditions |
| `ac_usage` | ac_usage_type (ENUM) | NULL | 'off','low','medium','high' |
| `road_conditions` | road_condition[] | NULL | array of conditions |
| `cover_image_url` | VARCHAR(500) | NULL | |
| `view_count` | INTEGER | NOT NULL, DEFAULT 0 | |
| `favorite_count` | INTEGER | NOT NULL, DEFAULT 0 | |
| `comment_count` | INTEGER | NOT NULL, DEFAULT 0 | |
| `helpful_count` | INTEGER | NOT NULL, DEFAULT 0 | |
| `published_at` | TIMESTAMPTZ | NULL | set when approved |
| `submitted_at` | TIMESTAMPTZ | NULL | set when user submits |
| `rejection_reason` | TEXT | NULL | filled by admin on rejection |
| `search_vector` | TSVECTOR | GENERATED | auto-updated, GIN indexed |
| `deleted_at` | TIMESTAMPTZ | NULL | soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `trip_stops`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `trip_id` | UUID | FK → trips.id, NOT NULL | ON DELETE CASCADE |
| `order_index` | SMALLINT | NOT NULL | display order |
| `city_id` | UUID | FK → cities.id | NULL if custom location |
| `city_name` | VARCHAR(100) | NULL | display name |
| `station_id` | UUID | FK → charging_stations.id | NULL if unknown |
| `station_name` | VARCHAR(200) | NULL | snapshotted or custom |
| `charger_type` | charger_type (ENUM) | NULL | 'ac_level2','dc_ccs','dc_chademo','tesla_sc' |
| `charge_from_pct` | SMALLINT | NULL | battery before charging |
| `charge_to_pct` | SMALLINT | NULL | battery after charging |
| `charge_duration_minutes` | INTEGER | NULL | time at charger |
| `cost_sar` | DECIMAL(8,2) | NULL | charging cost |
| `is_free_charging` | BOOLEAN | NULL | |
| `notes` | TEXT | NULL | user notes about stop |
| `latitude` | DECIMAL(10,7) | NULL | for map display |
| `longitude` | DECIMAL(10,7) | NULL | for map display |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `trip_media`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `trip_id` | UUID | FK → trips.id, NOT NULL | ON DELETE CASCADE |
| `media_type` | media_type (ENUM) | NOT NULL | 'image','video' |
| `url` | VARCHAR(500) | NOT NULL | S3 public URL |
| `thumbnail_url` | VARCHAR(500) | NULL | for video thumbs |
| `caption` | VARCHAR(300) | NULL | |
| `caption_ar` | VARCHAR(300) | NULL | |
| `order_index` | SMALLINT | NOT NULL, DEFAULT 0 | |
| `file_size_bytes` | INTEGER | NULL | |
| `width_px` | SMALLINT | NULL | for images |
| `height_px` | SMALLINT | NULL | for images |
| `duration_seconds` | INTEGER | NULL | for videos |
| `s3_key` | VARCHAR(500) | NOT NULL | for cleanup |
| `extra_data` | JSONB | NULL | additional metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `comments`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `trip_id` | UUID | FK → trips.id, NOT NULL | ON DELETE CASCADE |
| `user_id` | UUID | FK → users.id, NOT NULL | ON DELETE CASCADE |
| `parent_id` | UUID | FK → comments.id | NULL = top-level comment |
| `body` | TEXT | NOT NULL | min 2 chars, max 2000 |
| `helpful_count` | INTEGER | NOT NULL, DEFAULT 0 | |
| `deleted_at` | TIMESTAMPTZ | NULL | soft delete |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `favorites`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id | ON DELETE CASCADE |
| `trip_id` | UUID | FK → trips.id | ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

UNIQUE constraint: `(user_id, trip_id)`

### Table: `reactions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id | ON DELETE CASCADE |
| `trip_id` | UUID | FK → trips.id | ON DELETE CASCADE |
| `reaction_type` | reaction_type (ENUM) | NOT NULL | 'helpful','inspiring' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

UNIQUE constraint: `(user_id, trip_id, reaction_type)`

### Table: `brands`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `name_ar` | VARCHAR(100) | NOT NULL | |
| `name_en` | VARCHAR(100) | UNIQUE, NOT NULL | |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | |
| `logo_url` | VARCHAR(500) | NULL | |
| `country_of_origin` | VARCHAR(100) | NULL | |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | |
| `sort_order` | SMALLINT | NOT NULL, DEFAULT 0 | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `vehicle_models`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `brand_id` | UUID | FK → brands.id, NOT NULL | ON DELETE CASCADE |
| `name_ar` | VARCHAR(100) | NOT NULL | |
| `name_en` | VARCHAR(100) | NOT NULL | |
| `slug` | VARCHAR(100) | NOT NULL | |
| `year_from` | SMALLINT | NULL | e.g., 2020 |
| `year_to` | SMALLINT | NULL | NULL = still in production |
| `battery_capacity_kwh` | DECIMAL(6,2) | NULL | manufacturer spec |
| `range_km_wltp` | SMALLINT | NULL | WLTP range |
| `drivetrain` | drivetrain_type (ENUM) | NULL | 'rwd','fwd','awd' |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

UNIQUE constraint: `(brand_id, name_en)`

### Table: `cities`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `name_ar` | VARCHAR(100) | NOT NULL | |
| `name_en` | VARCHAR(100) | NOT NULL | |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | used in URLs |
| `region_ar` | VARCHAR(100) | NULL | e.g., منطقة الرياض |
| `region_en` | VARCHAR(100) | NULL | e.g., Riyadh Region |
| `country_code` | CHAR(2) | NOT NULL, DEFAULT 'SA' | ISO 3166-1 alpha-2 |
| `latitude` | DECIMAL(10,7) | NULL | |
| `longitude` | DECIMAL(10,7) | NULL | |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | |
| `sort_order` | SMALLINT | NOT NULL, DEFAULT 0 | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `charging_stations`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `name_ar` | VARCHAR(200) | NOT NULL | |
| `name_en` | VARCHAR(200) | NOT NULL | |
| `operator_ar` | VARCHAR(100) | NULL | e.g., STC Pay Charging |
| `operator_en` | VARCHAR(100) | NULL | |
| `city_id` | UUID | FK → cities.id | |
| `address_ar` | TEXT | NULL | |
| `address_en` | TEXT | NULL | |
| `latitude` | DECIMAL(10,7) | NOT NULL | |
| `longitude` | DECIMAL(10,7) | NOT NULL | |
| `charger_types` | charger_type[] | NOT NULL | PostgreSQL array of ENUM |
| `max_power_kw` | DECIMAL(6,1) | NULL | |
| `num_ports` | SMALLINT | NULL | |
| `is_free` | BOOLEAN | NULL | NULL = unknown |
| `opening_hours` | VARCHAR(100) | NULL | |
| `amenities` | JSONB | NULL | {'restrooms': true, 'cafe': true, ...} |
| `photos` | VARCHAR(500)[] | NULL | array of S3 URLs |
| `status` | station_status (ENUM) | NOT NULL, DEFAULT 'active' | 'active','temporarily_closed','decommissioned' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `notifications`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `recipient_id` | UUID | FK → users.id, NOT NULL | ON DELETE CASCADE |
| `actor_id` | UUID | FK → users.id | NULL for system notifications |
| `type` | notification_type (ENUM) | NOT NULL | |
| `entity_type` | VARCHAR(50) | NULL | 'trip','comment','user' |
| `entity_id` | UUID | NULL | FK to related entity |
| `payload` | JSONB | NULL | type-specific extra data |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT false | |
| `read_at` | TIMESTAMPTZ | NULL | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `user_follows`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `follower_id` | UUID | FK → users.id | ON DELETE CASCADE |
| `following_id` | UUID | FK → users.id | ON DELETE CASCADE |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

UNIQUE constraint: `(follower_id, following_id)`
CHECK constraint: `follower_id != following_id`

### Table: `user_badges`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, NOT NULL | ON DELETE CASCADE |
| `badge_type` | badge_type (ENUM) | NOT NULL | |
| `awarded_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `trip_id` | UUID | FK → trips.id | NULL for non-trip badges |

UNIQUE constraint: `(user_id, badge_type)` for most badges

### Table: `reports`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `reporter_id` | UUID | FK → users.id | ON DELETE SET NULL |
| `entity_type` | VARCHAR(50) | NOT NULL | 'trip','comment','user' |
| `entity_id` | UUID | NOT NULL | |
| `reason` | report_reason (ENUM) | NOT NULL | |
| `description` | TEXT | NULL | optional detail |
| `status` | report_status (ENUM) | NOT NULL, DEFAULT 'pending' | |
| `resolved_by` | UUID | FK → users.id | NULL until resolved |
| `resolution_note` | TEXT | NULL | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `admin_logs`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `admin_id` | UUID | FK → users.id, NOT NULL | |
| `action` | VARCHAR(100) | NOT NULL | e.g., 'trip.approve', 'user.ban' |
| `entity_type` | VARCHAR(50) | NOT NULL | |
| `entity_id` | UUID | NOT NULL | |
| `before_state` | JSONB | NULL | entity state before action |
| `after_state` | JSONB | NULL | entity state after action |
| `ip_address` | INET | NULL | admin's IP |
| `user_agent` | TEXT | NULL | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | **Append-only — no updates** |

### Table: `static_pages`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | 'terms','about','privacy','faq' |
| `title_ar` | VARCHAR(200) | NOT NULL | |
| `title_en` | VARCHAR(200) | NOT NULL | |
| `content_ar` | TEXT | NOT NULL | HTML/Markdown |
| `content_en` | TEXT | NOT NULL | |
| `is_published` | BOOLEAN | NOT NULL, DEFAULT true | |
| `updated_by` | UUID | FK → users.id | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

### Table: `notification_settings`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, NOT NULL | ON DELETE CASCADE |
| `channel` | notification_channel (ENUM) | NOT NULL | 'email','push','in_app' |
| `event_type` | notification_type (ENUM) | NOT NULL | |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT true | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

UNIQUE constraint: `(user_id, channel, event_type)`

---

## 4. Enum Definitions

### `user_role`
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
```
- `user` — Regular community member
- `admin` — Can moderate trips, manage reports, edit lookups
- `super_admin` — Full access including user role management, system config

### `trip_status`
```sql
CREATE TYPE trip_status AS ENUM (
  'draft',
  'pending_review',
  'published',
  'rejected',
  'archived'
);
```
- `draft` — Being edited, not submitted
- `pending_review` — Submitted by user, awaiting admin approval
- `published` — Approved and visible to public
- `rejected` — Rejected by admin (rejection_reason stored)
- `archived` — Hidden from public but preserved (e.g., user requested removal)

### `charger_type`
```sql
CREATE TYPE charger_type AS ENUM (
  'ac_level2',
  'dc_ccs2',
  'dc_chademo',
  'tesla_supercharger',
  'tesla_ccs',
  'gb_t'
);
```

### `notification_type`
```sql
CREATE TYPE notification_type AS ENUM (
  'trip_approved',
  'trip_rejected',
  'new_comment',
  'comment_reply',
  'trip_favorited',
  'new_follower',
  'trip_reaction',
  'badge_earned',
  'weekly_digest',
  'admin_message',
  'report_resolved'
);
```

### `notification_channel`
```sql
CREATE TYPE notification_channel AS ENUM ('email', 'push', 'in_app');
```

### `reaction_type`
```sql
CREATE TYPE reaction_type AS ENUM ('helpful', 'inspiring');
```

### `media_type`
```sql
CREATE TYPE media_type AS ENUM ('image', 'video');
```

### `drivetrain_type`
```sql
CREATE TYPE drivetrain_type AS ENUM ('rwd', 'fwd', 'awd');
```

### `report_reason`
```sql
CREATE TYPE report_reason AS ENUM (
  'spam',
  'misleading',
  'inappropriate_content',
  'copyright',
  'fake_data',
  'other'
);
```

### `report_status`
```sql
CREATE TYPE report_status AS ENUM (
  'pending',
  'reviewing',
  'resolved',
  'dismissed'
);
```

### `badge_type`
```sql
CREATE TYPE badge_type AS ENUM (
  'first_trip',
  'ten_trips',
  'fifty_trips',
  'hundred_trips',
  'first_long_haul',         -- trip > 500km
  'desert_driver',           -- trip in summer > 45°C
  'range_master',            -- high efficiency trip
  'route_explorer',          -- 10+ unique routes
  'helpful_contributor',     -- 50+ helpful reactions received
  'top_commenter',           -- 100+ comments
  'early_adopter'            -- among first 1000 users
);
```

### `station_status`
```sql
CREATE TYPE station_status AS ENUM (
  'active',
  'temporarily_closed',
  'decommissioned',
  'planned'
);
```

### `ac_usage_type`
```sql
CREATE TYPE ac_usage_type AS ENUM ('off', 'low', 'medium', 'high');
```

---

## 5. Index Strategy

### Users Table

```sql
-- Auth: email lookup on login
CREATE UNIQUE INDEX idx_users_email ON users (email);

-- Username lookup for profiles
CREATE UNIQUE INDEX idx_users_username ON users (username);

-- Active user queries (exclude banned)
CREATE INDEX idx_users_role_active ON users (role) WHERE is_banned = false;
```

### Trips Table

```sql
-- Primary public listing: published trips by date
CREATE INDEX idx_trips_status_published ON trips (published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Route search (most common search pattern)
CREATE INDEX idx_trips_route ON trips (departure_city_id, destination_city_id)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Route + brand search combination
CREATE INDEX idx_trips_route_brand ON trips (departure_city_id, destination_city_id, vehicle_brand_id)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Author's trips (my trips page)
CREATE INDEX idx_trips_author ON trips (author_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Admin moderation queue
CREATE INDEX idx_trips_pending ON trips (submitted_at DESC)
  WHERE status = 'pending_review';

-- Slug lookup (trip detail page)
CREATE UNIQUE INDEX idx_trips_slug ON trips (slug);

-- Full-text search
CREATE INDEX idx_trips_search_vector ON trips USING GIN (search_vector);

-- Popular trips (by engagement)
CREATE INDEX idx_trips_helpful ON trips (helpful_count DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
```

### Comments Table

```sql
-- Trip comments listing
CREATE INDEX idx_comments_trip ON comments (trip_id, created_at ASC)
  WHERE deleted_at IS NULL;

-- Replies lookup
CREATE INDEX idx_comments_parent ON comments (parent_id)
  WHERE parent_id IS NOT NULL AND deleted_at IS NULL;

-- User's comments (profile/moderation)
CREATE INDEX idx_comments_user ON comments (user_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

### Favorites Table

```sql
-- Has user favorited this trip? (most common check)
CREATE UNIQUE INDEX idx_favorites_user_trip ON favorites (user_id, trip_id);

-- User's favorites list
CREATE INDEX idx_favorites_user ON favorites (user_id, created_at DESC);

-- Trip's favorites count helper
CREATE INDEX idx_favorites_trip ON favorites (trip_id);
```

### Reactions Table

```sql
CREATE UNIQUE INDEX idx_reactions_user_trip_type ON reactions (user_id, trip_id, reaction_type);
CREATE INDEX idx_reactions_trip ON reactions (trip_id);
```

### Notifications Table

```sql
-- User's notification inbox (most recent first, unread)
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, created_at DESC)
  WHERE is_read = false;

-- All notifications for a user
CREATE INDEX idx_notifications_recipient_all ON notifications (recipient_id, created_at DESC);
```

### User Follows Table

```sql
CREATE UNIQUE INDEX idx_follows_pair ON user_follows (follower_id, following_id);
CREATE INDEX idx_follows_follower ON user_follows (follower_id);
CREATE INDEX idx_follows_following ON user_follows (following_id);
```

### Trip Stops Table

```sql
CREATE INDEX idx_trip_stops_trip ON trip_stops (trip_id, order_index ASC);
CREATE INDEX idx_trip_stops_station ON trip_stops (station_id) WHERE station_id IS NOT NULL;
```

### Vehicles Table

```sql
CREATE INDEX idx_vehicles_user ON vehicles (user_id)
  WHERE deleted_at IS NULL;

-- Primary vehicle lookup
CREATE INDEX idx_vehicles_user_primary ON vehicles (user_id)
  WHERE is_primary = true AND deleted_at IS NULL;
```

---

## 6. Key Design Patterns

### Vehicle Snapshot Pattern

**Problem:** A user creates 5 trips with their Tesla Model Y. They then sell the car and delete the vehicle from their profile. Without snapshots, those 5 trips would lose their vehicle information, making the data meaningless for community research.

**Solution:** At trip submission time (when `status` changes from `draft` to `pending_review`), the `TripsService` reads the vehicle record and copies key fields directly into the trip row:

```typescript
// In TripsService.submit(tripId, userId)
const vehicle = await this.vehiclesRepo.findOne({
  where: { id: trip.vehicleId, userId },
  relations: ['brand', 'model'],
});

await this.tripsRepo.update(tripId, {
  vehicleId: vehicle.id,
  vehicleBrandId: vehicle.brandId,
  vehicleModelId: vehicle.modelId,
  vehicleBrandName: vehicle.brand.nameEn,
  vehicleModelName: vehicle.model.nameEn,
  vehicleYear: vehicle.year,
  vehicleBatteryKwh: vehicle.batteryCapacityKwh ?? vehicle.model.batteryCapacityKwh,
  vehicleRangeKm: vehicle.rangeKm ?? vehicle.model.rangeKmWltp,
  departureCityName: trip.departureCity.nameEn,
  departureCityNameAr: trip.departureCity.nameAr,
  // ... same for destination
  status: TripStatus.PENDING_REVIEW,
  submittedAt: new Date(),
});
```

The FK columns (`vehicle_brand_id`, `vehicle_model_id`) are kept for relational integrity and filtering, but are set to `ON DELETE SET NULL` — the snapshot text fields always remain.

### Soft Delete Convention

TypeORM's `@DeleteDateColumn()` decorator adds `deleted_at TIMESTAMPTZ NULL` and automatically:
- Sets `deleted_at = NOW()` when `repo.softDelete(id)` is called
- Adds `WHERE deleted_at IS NULL` to all standard `find*` queries
- Allows `repo.findOne({ withDeleted: true })` for admin recovery

```typescript
@Entity()
export class Trip {
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}

// Soft delete — sets deleted_at, data preserved
await tripsRepo.softDelete(id);

// Regular find — automatically filters deleted_at IS NULL
const trip = await tripsRepo.findOne({ where: { slug } }); // only non-deleted

// Admin recovery
const trip = await tripsRepo.findOne({ where: { id }, withDeleted: true });
await tripsRepo.restore(id); // sets deleted_at = NULL
```

Partial indexes on `deleted_at IS NULL` ensure these filters are fast and don't scan deleted rows.

### Slug Generation Strategy

| Entity | Format | Example |
|--------|--------|---------|
| Trip | `{from-slug}-to-{to-slug}-{brand-slug}-{model-slug}-{nanoid8}` | `riyadh-to-dammam-tesla-model-y-a3b4c5d6` |
| User | `{username}` (alphanumeric, hyphens) | `turki-algashami` |
| City | `{transliterated-arabic}` | `riyadh`, `al-khobar`, `jeddah` |
| Brand | `{brand-name-en-lowercased}` | `tesla`, `byd`, `hyundai` |
| Model | `{model-name-en-slug}` | `model-y`, `atto-3`, `ioniq-5` |

Slug uniqueness is enforced at DB level via `UNIQUE INDEX`. If a collision occurs (extremely rare with nanoid), the generation retries with a new random suffix.

### Counter Denormalization

Rather than `SELECT COUNT(*) FROM favorites WHERE trip_id = $1` on every trip list render, counters are maintained in the parent record:

**Application-Level Maintenance (current approach):**
```typescript
// FavoritesService.add(userId, tripId)
await this.favoritesRepo.save({ userId, tripId });
await this.tripsRepo.increment({ id: tripId }, 'favoriteCount', 1);
await this.usersRepo.increment({ id: authorId }, 'tripFavoriteTotal', 1); // optional

// FavoritesService.remove(userId, tripId)
await this.favoritesRepo.delete({ userId, tripId });
await this.tripsRepo.decrement({ id: tripId }, 'favoriteCount', 1);
```

TypeORM's `increment` and `decrement` methods use atomic SQL `UPDATE trips SET favorite_count = favorite_count + 1 WHERE id = $1`, preventing race conditions.

**Periodic reconciliation:** A daily cron job recounts actual DB counts and corrects any drift:
```sql
UPDATE trips t SET
  favorite_count = (SELECT COUNT(*) FROM favorites f WHERE f.trip_id = t.id),
  comment_count  = (SELECT COUNT(*) FROM comments c WHERE c.trip_id = t.id AND c.deleted_at IS NULL),
  helpful_count  = (SELECT COUNT(*) FROM reactions r WHERE r.trip_id = t.id AND r.reaction_type = 'helpful');
```

---

## 7. Route Insights Query

This query powers the route insights page, showing community-aggregated statistics for a given departure → destination pair:

```sql
SELECT
  -- Trip counts
  COUNT(*)                                           AS total_trips,
  COUNT(DISTINCT t.author_id)                        AS unique_contributors,

  -- Distance stats
  ROUND(AVG(t.total_distance_km)::numeric, 1)       AS avg_distance_km,
  MIN(t.total_distance_km)                           AS min_distance_km,
  MAX(t.total_distance_km)                           AS max_distance_km,

  -- Energy stats
  ROUND(AVG(t.energy_consumed_kwh)::numeric, 2)     AS avg_energy_kwh,
  ROUND(
    AVG(t.energy_consumed_kwh / NULLIF(t.total_distance_km, 0))::numeric, 4
  )                                                  AS avg_kwh_per_km,

  -- Battery usage
  ROUND(AVG(t.start_battery_pct - t.end_battery_pct)::numeric, 1)
                                                     AS avg_battery_used_pct,
  MIN(t.end_battery_pct)                             AS min_end_battery_pct,

  -- Time stats
  ROUND(AVG(t.duration_minutes)::numeric, 0)        AS avg_duration_minutes,
  MIN(t.duration_minutes)                            AS min_duration_minutes,
  MAX(t.duration_minutes)                            AS max_duration_minutes,

  -- Speed stats
  ROUND(AVG(t.avg_speed_kmh)::numeric, 1)           AS avg_speed_kmh,
  MAX(t.max_speed_kmh)                               AS max_recorded_speed_kmh,

  -- Conditions breakdown
  COUNT(*) FILTER (WHERE t.ac_usage IN ('medium','high'))
                                                     AS trips_with_heavy_ac,
  ROUND(AVG(t.outside_temp_celsius)::numeric, 1)    AS avg_temp_celsius,

  -- Vehicle breakdown (top 5 by trip count)
  jsonb_agg(
    jsonb_build_object(
      'brandName', veh_stats.brand_name,
      'modelName', veh_stats.model_name,
      'tripCount', veh_stats.trip_count,
      'avgKwhPerKm', veh_stats.avg_kwh_per_km
    )
    ORDER BY veh_stats.trip_count DESC
  ) FILTER (WHERE veh_stats.rank <= 5)              AS top_vehicles,

  -- Most recent trip date
  MAX(t.published_at)                               AS last_trip_date,
  MIN(t.published_at)                               AS first_trip_date

FROM trips t
-- Vehicle stats subquery
LEFT JOIN LATERAL (
  SELECT
    t2.vehicle_brand_name  AS brand_name,
    t2.vehicle_model_name  AS model_name,
    COUNT(*)               AS trip_count,
    ROUND(AVG(t2.energy_consumed_kwh / NULLIF(t2.total_distance_km, 0))::numeric, 4)
                           AS avg_kwh_per_km,
    RANK() OVER (ORDER BY COUNT(*) DESC) AS rank
  FROM trips t2
  WHERE t2.departure_city_id  = $1
    AND t2.destination_city_id = $2
    AND t2.status = 'published'
    AND t2.deleted_at IS NULL
    AND t2.energy_consumed_kwh IS NOT NULL
    AND t2.total_distance_km > 0
  GROUP BY t2.vehicle_brand_name, t2.vehicle_model_name
) veh_stats ON true

WHERE t.departure_city_id  = $1   -- fromCityId
  AND t.destination_city_id = $2  -- toCityId
  AND t.status = 'published'
  AND t.deleted_at IS NULL
  AND t.total_distance_km > 0;   -- exclude incomplete data
```

**Result caching:** This query is cached in Redis with key `route_insights:{fromId}:{toId}` for 1 hour. Cache is invalidated when a new trip on the same route is published.

---

## 8. Full-Text Search Setup

### Column Definition

PostgreSQL generated column (auto-updated on insert/update):

```sql
ALTER TABLE trips ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('arabic', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('arabic', coalesce(departure_city_name_ar, '') || ' ' || coalesce(destination_city_name_ar, '')), 'B') ||
    setweight(to_tsvector('arabic', coalesce(vehicle_brand_name, '') || ' ' || coalesce(vehicle_model_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(departure_city_name, '') || ' ' || coalesce(destination_city_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) STORED;

-- GIN index for fast text search
CREATE INDEX idx_trips_search_vector ON trips USING GIN (search_vector);
```

The `setweight` function assigns relevance weights:
- **A (highest):** Title match
- **B (high):** City names, vehicle name match
- **C (medium):** Description match

### Search Query

```typescript
// TripsService.search(query: string, page: number)
const searchQuery = query.trim().split(/\s+/).join(' & '); // "riyadh tesla" → "riyadh & tesla"

const results = await dataSource.query(`
  SELECT
    t.*,
    ts_rank(t.search_vector,
      websearch_to_tsquery('simple', $1) ||
      websearch_to_tsquery('arabic', $1)
    ) AS rank
  FROM trips t
  WHERE t.search_vector @@
    (websearch_to_tsquery('simple', $1) ||
     websearch_to_tsquery('arabic', $1))
    AND t.status = 'published'
    AND t.deleted_at IS NULL
  ORDER BY rank DESC, t.published_at DESC
  LIMIT $2 OFFSET $3
`, [searchQuery, limit, offset]);
```

`websearch_to_tsquery` parses natural language ("riyadh tesla") into valid tsquery without special character errors.

### Headline / Snippet Generation

```sql
SELECT
  ts_headline('simple', description, websearch_to_tsquery('simple', $1),
    'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>'
  ) AS description_snippet
FROM trips WHERE ...;
```

---

## 9. Sample Seed Data

### Cities Seed

```sql
INSERT INTO cities (id, name_ar, name_en, slug, region_ar, region_en, latitude, longitude) VALUES
  (gen_random_uuid(), 'الرياض',       'Riyadh',    'riyadh',    'منطقة الرياض',    'Riyadh Region',      24.7136, 46.6753),
  (gen_random_uuid(), 'جدة',          'Jeddah',    'jeddah',    'منطقة مكة المكرمة','Makkah Region',      21.5433, 39.1728),
  (gen_random_uuid(), 'الدمام',        'Dammam',    'dammam',    'المنطقة الشرقية',  'Eastern Province',   26.4207, 50.0888),
  (gen_random_uuid(), 'الخبر',         'Al Khobar', 'al-khobar', 'المنطقة الشرقية',  'Eastern Province',   26.2172, 50.1971),
  (gen_random_uuid(), 'أبها',          'Abha',      'abha',      'منطقة عسير',      'Aseer Region',       18.2164, 42.5053),
  (gen_random_uuid(), 'تبوك',          'Tabuk',     'tabuk',     'منطقة تبوك',      'Tabuk Region',       28.3998, 36.5715),
  (gen_random_uuid(), 'المدينة المنورة','Madinah',   'madinah',   'منطقة المدينة المنورة','Madinah Region', 24.5247, 39.5692),
  (gen_random_uuid(), 'مكة المكرمة',   'Makkah',    'makkah',    'منطقة مكة المكرمة','Makkah Region',     21.3891, 39.8579),
  (gen_random_uuid(), 'الطائف',        'Taif',      'taif',      'منطقة مكة المكرمة','Makkah Region',     21.2703, 40.4158),
  (gen_random_uuid(), 'القصيم',        'Qassim',    'qassim',    'منطقة القصيم',    'Qassim Region',      26.3333, 43.9667);
```

### Vehicle Brands Seed

```sql
INSERT INTO brands (id, name_ar, name_en, slug, is_active) VALUES
  (gen_random_uuid(), 'تيسلا',    'Tesla',     'tesla',    true),
  (gen_random_uuid(), 'بي واي دي','BYD',        'byd',      true),
  (gen_random_uuid(), 'هيونداي',   'Hyundai',   'hyundai',  true),
  (gen_random_uuid(), 'كيا',      'Kia',        'kia',      true),
  (gen_random_uuid(), 'مرسيدس',   'Mercedes',  'mercedes', true),
  (gen_random_uuid(), 'بي إم دبليو','BMW',       'bmw',      true),
  (gen_random_uuid(), 'أودي',     'Audi',       'audi',     true),
  (gen_random_uuid(), 'فولكس واجن','Volkswagen','volkswagen',true),
  (gen_random_uuid(), 'نيو',      'NIO',        'nio',      true),
  (gen_random_uuid(), 'ريفيان',   'Rivian',    'rivian',   true);
```

### Vehicle Models Seed (Tesla subset)

```sql
-- Assuming tesla_brand_id is the Tesla brand's UUID
INSERT INTO vehicle_models (id, brand_id, name_ar, name_en, slug, year_from, battery_capacity_kwh, range_km_wltp, drivetrain) VALUES
  (gen_random_uuid(), :tesla_id, 'موديل 3',   'Model 3',   'model-3',   2017, 82.0,  602, 'rwd'),
  (gen_random_uuid(), :tesla_id, 'موديل Y',   'Model Y',   'model-y',   2020, 82.0,  533, 'awd'),
  (gen_random_uuid(), :tesla_id, 'موديل S',   'Model S',   'model-s',   2012, 100.0, 652, 'awd'),
  (gen_random_uuid(), :tesla_id, 'موديل X',   'Model X',   'model-x',   2015, 100.0, 560, 'awd'),
  (gen_random_uuid(), :tesla_id, 'سايبرتراك', 'Cybertruck','cybertruck', 2023, 123.0, 547, 'awd');
```

### Sample Charging Stations

```sql
INSERT INTO charging_stations (id, name_ar, name_en, operator_ar, operator_en, city_id, latitude, longitude, charger_types, max_power_kw, num_ports, is_free) VALUES
  (gen_random_uuid(), 'محطة شحن رياض بارك', 'Riyadh Park Station', 'تيسلا', 'Tesla',
   :riyadh_city_id, 24.7743, 46.7384, '{tesla_supercharger}', 250.0, 12, false),
  (gen_random_uuid(), 'محطة شحن طريق الملك فهد', 'King Fahd Road Station', 'زادن', 'Zain Energy',
   :riyadh_city_id, 24.7298, 46.6405, '{dc_ccs2, ac_level2}', 150.0, 8, false),
  (gen_random_uuid(), 'محطة شحن ذهب مول', 'Dhahran Mall Station', 'اس تي سي', 'STC',
   :dammam_city_id, 26.2789, 50.1467, '{dc_ccs2}', 120.0, 6, false);
```

---

## 10. Migration Strategy

### TypeORM Migration Workflow

**1. Generate a migration from entity changes:**
```bash
pnpm --filter @ev-trips/api migration:generate src/database/migrations/AddSearchVectorToTrips
```

**2. Review generated migration:** Always review auto-generated migrations before committing. TypeORM may generate unexpected DDL for complex changes.

**3. Run pending migrations:**
```bash
pnpm --filter @ev-trips/api migration:run
```

**4. Revert last migration (development only):**
```bash
pnpm --filter @ev-trips/api migration:revert
```

**5. Show migration status:**
```bash
pnpm --filter @ev-trips/api migration:show
```

### Migration File Naming

```
{timestamp}-{PascalCaseDescription}.ts
1700000000000-CreateInitialSchema.ts
1700000001000-AddSearchVectorToTrips.ts
1700000002000-AddExpoTokenToUsers.ts
1700000003000-CreateNotificationSettings.ts
```

### Production Migration Safety Rules

1. Never modify a migration file that has been applied to production
2. All `ALTER TABLE` operations that lock tables for extended periods must be coordinated with low-traffic windows or use `CONCURRENTLY` builds for indexes
3. Destructive migrations (DROP COLUMN, DROP TABLE) require a multi-step approach:
   - Step 1: Stop writing to the column (deploy code that ignores it)
   - Step 2: Wait for verification
   - Step 3: Drop the column in a subsequent deployment
4. All migrations are run in a transaction (TypeORM default) — they succeed fully or roll back entirely

### Data Source Configuration (TypeORM CLI)

```typescript
// src/database/datasource.ts (used by TypeORM CLI)
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
```

---

*End of Database Design Document — EV Trips Community v1.0*
