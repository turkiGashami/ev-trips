# EV Trips Community — System Architecture

> **Document Version:** 1.0  
> **Last Updated:** April 2026  
> **Status:** Living Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack & Justification](#2-tech-stack--justification)
3. [System Architecture](#3-system-architecture)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Backend Architecture (NestJS)](#5-backend-architecture-nestjs)
6. [Authentication & Security](#6-authentication--security)
7. [Database Design](#7-database-design)
8. [Frontend Architecture (Next.js)](#8-frontend-architecture-nextjs)
9. [Mobile Architecture (React Native Expo)](#9-mobile-architecture-react-native-expo)
10. [Admin Dashboard Architecture](#10-admin-dashboard-architecture)
11. [Arabic RTL Strategy](#11-arabic-rtl-strategy)
12. [Notification Architecture](#12-notification-architecture)
13. [Search & Discovery Architecture](#13-search--discovery-architecture)
14. [Moderation Architecture](#14-moderation-architecture)
15. [File Storage Strategy](#15-file-storage-strategy)
16. [Scalability Considerations](#16-scalability-considerations)
17. [Deployment Architecture](#17-deployment-architecture)

---

## 1. Executive Summary

### Platform Purpose

EV Trips Community is a bilingual (Arabic/English) social platform purpose-built for electric vehicle owners in the Arabian Gulf and wider MENA region. The platform enables EV drivers to document, share, and discover real-world road trip experiences — covering charging stops, range observations, energy consumption data, and road conditions. It bridges the gap between theoretical EV specifications and actual on-the-road experience in regional conditions (extreme heat, limited charging infrastructure, long inter-city distances).

### Value Proposition

| Audience | Value |
|----------|-------|
| EV Owner (Tripper) | Share experiences, gain community recognition, help others plan trips |
| Prospective EV Buyer | Research real-world range on Saudi/Gulf routes before purchasing |
| EV Community | Discover best routes, charging strategies, vehicle comparisons |
| Admins | Moderate quality content, manage community health, track platform growth |

### Key Design Decisions

1. **Arabic-First, RTL-Native:** The platform is designed from the ground up to fully support Arabic right-to-left layout and Arabic locale formatting — not retrofitted as an afterthought.
2. **Content Moderation by Default:** All trip submissions require admin approval before becoming publicly visible, ensuring content quality and community trust.
3. **Vehicle Snapshot Pattern:** Trip records capture vehicle data at submission time, preserving historical accuracy even if the user later modifies their vehicle profile.
4. **Progressive Enhancement:** The web app is server-side rendered for SEO and initial load performance, with client-side hydration for interactivity.
5. **Mobile-Parity:** The React Native mobile app provides the same core feature set as the web frontend, with native capabilities (push notifications, camera, secure storage).
6. **Monorepo Architecture:** All applications share types, utilities, and validation schemas via a common `packages/shared` workspace, eliminating drift between frontend, backend, and mobile contracts.
7. **Stateless API:** The NestJS backend stores no session state — all authentication is token-based (JWT), enabling horizontal scaling without sticky sessions.

---

## 2. Tech Stack & Justification

### Backend

| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| Framework | NestJS | 10.x | Opinionated structure, decorator-based DI, excellent TypeScript integration, built-in module system, Swagger integration |
| ORM | TypeORM | 0.3.x | Mature PostgreSQL support, migrations, active record / data mapper patterns, good NestJS integration |
| Database | PostgreSQL | 16 | JSONB for flexible metadata, arrays, full-text search (tsvector/GIN), PostGIS-ready for future geospatial features, ACID compliance |
| Cache / Queue Broker | Redis | 7 | Fast in-memory store for caching, Bull job queue backend, token allowlisting |
| Job Queue | Bull (BullMQ) | 5.x | Reliable async job processing, retry logic, priority queues, cron jobs |
| Authentication | JWT + Passport | — | Stateless auth, ecosystem support, refresh token rotation |
| Validation | class-validator + class-transformer | — | Declarative, decorator-based validation matching NestJS DTO patterns |
| API Docs | @nestjs/swagger | — | Auto-generated OpenAPI docs from decorators, keeps docs in sync with code |
| File Upload | Multer | — | Streaming multipart parser, memory/disk/S3 storage adapters |
| S3 Client | @aws-sdk/client-s3 | v3 | Official AWS SDK v3, tree-shakeable, supports presigned URLs |
| Email | Nodemailer + SendGrid | — | Flexible email sending with reliable delivery via SendGrid SMTP |
| HTTP Security | Helmet | — | Secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.) |
| Rate Limiting | @nestjs/throttler | — | Per-endpoint rate limiting integrated with NestJS guards |

### Web Frontend

| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| Framework | Next.js | 14 (App Router) | SSR/SSG for SEO, React Server Components, image optimization, built-in routing |
| Language | TypeScript | 5.x | Type safety, shared types with backend via packages/shared |
| Styling | Tailwind CSS | 3.x | Utility-first, RTL logical properties (ms-/me-/ps-/pe-), dark mode, responsive |
| Global State | Zustand | 4.x | Minimal boilerplate, no context prop-drilling, devtools support |
| Server State | TanStack Query | v5 | Caching, background refetch, optimistic updates, SSR hydration |
| Forms | React Hook Form | 7.x | Uncontrolled inputs, excellent performance, Zod resolver |
| Validation | Zod | 3.x | Runtime type validation, shared schemas with mobile |
| i18n | next-intl | 3.x | Next.js App Router compatible, server + client component support |
| Maps | Mapbox GL JS | 3.x | Interactive maps, custom styling, Arabic label support |
| HTTP Client | Axios | 1.x | Interceptors for token refresh, consistent with mobile |

### Mobile

| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| Framework | React Native | 0.74 | Cross-platform iOS/Android from shared codebase |
| Build Platform | Expo SDK | 51 | Managed workflow, OTA updates, access to native APIs |
| Navigation | React Navigation | v6 | Stack, Tab, Drawer navigators; deep link support |
| Global State | Zustand | 4.x | Same state library as web for team familiarity |
| Server State | TanStack Query | v5 | Same as web, offline support, background refetch |
| Fast Storage | MMKV | 2.x | 10x faster than AsyncStorage, synchronous reads, encrypted |
| Secure Storage | expo-secure-store | — | Keychain (iOS) / Keystore (Android) backed secure storage for tokens |
| Push Notifications | expo-notifications | — | Expo Push API → FCM (Android) / APNs (iOS) |
| Image Picker | expo-image-picker | — | Camera and gallery access with cropping |
| HTTP Client | Axios | 1.x | Same interceptor pattern as web |

### Admin Dashboard

| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| Framework | Next.js | 14 | Standalone app in monorepo, same stack as web |
| Charts | Recharts | 2.x | React-native chart library, responsive, composable |
| Same stack | TypeScript, Tailwind, Zustand, TanStack Query | — | Team consistency |

### Infrastructure

| Component | Technology | Reason |
|-----------|-----------|--------|
| Container Runtime | Docker + Docker Compose | Reproducible dev and prod environments |
| Database | PostgreSQL 16 | Primary data store |
| Cache/Queue | Redis 7 | Caching + async job queues |
| Object Storage | AWS S3 / MinIO | Media file storage, presigned URL support |
| Email Delivery | SendGrid | Reliable transactional email with MENA delivery |
| Reverse Proxy | Nginx | SSL termination, load balancing, static file serving |
| CI/CD | GitHub Actions | Automated test, lint, build, deploy pipeline |

---

## 3. System Architecture

### High-Level ASCII Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                      │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Web App     │  │  Mobile App  │  │  Admin App   │              │
│  │  (Next.js)   │  │  (RN/Expo)   │  │  (Next.js)   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼─────────────────┼─────────────────┼────────────────────── ┘
          │                 │                 │
          │         HTTPS / REST API          │
          └─────────────────┼─────────────────┘
                            │
                     ┌──────▼───────┐
                     │    Nginx     │
                     │  (Reverse    │
                     │   Proxy /    │
                     │   SSL Term)  │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │  NestJS API  │
                     │  (Port 3001) │
                     │              │
                     │ ┌──────────┐ │
                     │ │ Auth     │ │
                     │ │ Module   │ │
                     │ └──────────┘ │
                     │ ┌──────────┐ │
                     │ │ Trips    │ │
                     │ │ Module   │ │
                     │ └──────────┘ │
                     │ ┌──────────┐ │
                     │ │ Users    │ │
                     │ │ Module   │ │
                     │ └──────────┘ │
                     │ ┌──────────┐ │
                     │ │ Admin    │ │
                     │ │ Module   │ │
                     │ └──────────┘ │
                     │ ┌──────────┐ │
                     │ │Notif.    │ │
                     │ │ Module   │ │
                     │ └──────────┘ │
                     └──────┬───────┘
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
       │ PostgreSQL  │ │ Redis  │ │  AWS S3 /   │
       │  (Port 5432)│ │(6379)  │ │  MinIO      │
       │             │ │        │ │             │
       │ • trips     │ │ • Cache│ │ • avatars/  │
       │ • users     │ │ • Bull │ │ • trips/    │
       │ • vehicles  │ │   Queue│ │ • stations/ │
       │ • comments  │ │ • Rate │ │             │
       │ • notifs    │ │   Limit│ └─────────────┘
       └─────────────┘ └───┬────┘
                           │
                    ┌──────▼──────┐
                    │  Bull Queue │
                    │  Workers    │
                    │             │
                    │ • Email Q   │──── SendGrid ──► User Inbox
                    │ • Notif Q   │
                    │ • Cleanup Q │
                    └─────────────┘
```

### Component Interactions

**Web App ↔ API:**
- Web frontend uses Axios with an instance configured for `NEXT_PUBLIC_API_URL`
- TanStack Query manages caching and refetching
- Server components fetch directly during SSR (no token needed for public pages)
- Client components hydrate and use TanStack Query with auth tokens

**Mobile App ↔ API:**
- Same REST API as web
- Axios instance with request interceptor attaching Bearer token
- Response interceptor handles 401 → refresh token → retry
- Tokens stored in expo-secure-store (encrypted native keychain)

**Admin App ↔ API:**
- Separate admin Axios instance targeting same API
- Admin-specific endpoints under `/admin/*` require `admin` or `super_admin` role
- Role verified server-side via JWT claims on every request

**API ↔ Redis:**
- Cache Manager (NestJS built-in) wraps Redis for key-value caching
- Bull connects to Redis for job queue persistence
- Throttler stores rate limit counters in Redis

**API ↔ PostgreSQL:**
- TypeORM manages connection pool (default 10 connections)
- Migrations are version-controlled and run on deployment
- Read-heavy queries use cached results where appropriate

### Request Flow Examples

**Flow 1: Guest Browse → Trip Details**
```
1. Browser → GET /trips?from=riyadh&to=dammam (no auth)
2. Nginx → forwards to NestJS API
3. ThrottlerGuard → check rate limit (IP-based for guests)
4. TripsController.findAll() → TripsService.search()
5. TypeORM QueryBuilder → PostgreSQL (trips + user JOIN, status='published')
6. Cache check → Redis (TTL 5min for popular routes)
7. Response → serialized TripListDto (no private fields)
8. Next.js Server Component → renders page SSR → sends HTML
9. Browser → displays content (no JS needed for initial paint)
```

**Flow 2: Auth → Create Trip → Submit → Publish**
```
1. POST /auth/login → JwtService.sign() → return {accessToken, refreshToken}
2. Client stores tokens (localStorage/expo-secure-store)
3. POST /trips (Authorization: Bearer <token>)
4. JwtAuthGuard → validates accessToken → attaches user to request
5. RolesGuard → checks user is not banned
6. ValidationPipe → validates CreateTripDto (class-validator)
7. TripsService.create() → snapshot vehicle data → save draft trip
8. Return trip with status='draft', trip.id
9. User edits trip, adds stops → PATCH /trips/:id/stops (multiple calls)
10. User submits → POST /trips/:id/submit → status='pending_review'
11. NotificationService → create admin notification (in-app + email queue)
12. Bull queue processes email → SendGrid → admin email sent
13. Admin reviews → PATCH /admin/trips/:id/approve → status='published'
14. NotificationService → notify trip author → Bull email queue
15. Trip now visible in public search results
```

**Flow 3: Token Refresh**
```
1. API returns 401 Unauthorized (access token expired)
2. Axios response interceptor catches 401
3. POST /auth/refresh with {refreshToken} (from secure storage)
4. API validates refresh token: hash match + not expired + not revoked
5. Issue new accessToken (15min) + new refreshToken (30 days, rotation)
6. Old refresh token marked as used/revoked in DB
7. Axios interceptor retries original request with new token
8. Subsequent requests use new token pair
```

---

## 4. Monorepo Structure

### Overview

The project uses **pnpm workspaces** with **Turborepo** for task orchestration. This enables:
- Shared TypeScript types between all apps
- Single `pnpm install` at root
- Parallel task execution (lint, test, build) across workspaces
- Remote caching for CI speed

### Directory Layout

```
ev-trips-community/
│
├── apps/
│   ├── api/                    # NestJS backend API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── vehicles/
│   │   │   │   ├── trips/
│   │   │   │   ├── comments/
│   │   │   │   ├── favorites/
│   │   │   │   ├── reactions/
│   │   │   │   ├── notifications/
│   │   │   │   ├── lookups/
│   │   │   │   ├── reports/
│   │   │   │   ├── admin/
│   │   │   │   └── upload/
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── pipes/
│   │   │   │   └── utils/
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   │   ├── entities/
│   │   │   │   ├── migrations/
│   │   │   │   └── seeds/
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                    # Next.js web frontend
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── (public)/
│   │   │   │   │   ├── page.tsx          # Home
│   │   │   │   │   ├── trips/
│   │   │   │   │   │   ├── page.tsx      # Trip search/list
│   │   │   │   │   │   └── [slug]/
│   │   │   │   │   │       └── page.tsx  # Trip detail (SSR)
│   │   │   │   │   ├── routes/
│   │   │   │   │   │   └── [from]/[to]/
│   │   │   │   │   │       └── page.tsx  # Route insights
│   │   │   │   │   └── stations/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   ├── verify-email/
│   │   │   │   │   └── reset-password/
│   │   │   │   └── (dashboard)/
│   │   │   │       ├── dashboard/
│   │   │   │       ├── trips/
│   │   │   │       │   ├── new/
│   │   │   │       │   └── [id]/edit/
│   │   │   │       ├── vehicles/
│   │   │   │       ├── favorites/
│   │   │   │       ├── notifications/
│   │   │   │       └── profile/
│   │   ├── components/
│   │   │   ├── ui/             # Atomic UI components
│   │   │   ├── trips/          # Trip-specific components
│   │   │   ├── layout/         # Header, footer, nav
│   │   │   └── maps/           # Mapbox components
│   │   ├── lib/
│   │   │   ├── api/            # Axios instance + query functions
│   │   │   ├── store/          # Zustand stores
│   │   │   └── utils/
│   │   ├── messages/           # i18n translation files
│   │   │   ├── ar.json
│   │   │   └── en.json
│   │   ├── public/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── mobile/                 # React Native Expo app
│   │   ├── src/
│   │   │   ├── navigation/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   │   ├── api/
│   │   │   │   ├── store/
│   │   │   │   └── i18n/
│   │   │   └── hooks/
│   │   ├── app.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── admin/                  # Admin dashboard (Next.js)
│       ├── app/
│       │   └── (admin)/
│       │       ├── dashboard/
│       │       ├── trips/
│       │       ├── users/
│       │       ├── reports/
│       │       ├── lookups/
│       │       └── settings/
│       ├── components/
│       ├── lib/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                 # Shared types, enums, utils
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── trip.types.ts
│   │   │   │   ├── user.types.ts
│   │   │   │   ├── vehicle.types.ts
│   │   │   │   └── api.types.ts
│   │   │   ├── enums/
│   │   │   │   ├── trip-status.enum.ts
│   │   │   │   ├── user-role.enum.ts
│   │   │   │   └── notification-type.enum.ts
│   │   │   ├── schemas/        # Zod schemas (shared validation)
│   │   │   │   ├── trip.schema.ts
│   │   │   │   └── user.schema.ts
│   │   │   └── utils/
│   │   │       ├── slug.utils.ts
│   │   │       └── format.utils.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                     # Shared React component library
│       ├── src/
│       │   ├── Button/
│       │   ├── Card/
│       │   ├── Input/
│       │   └── Badge/
│       ├── package.json
│       └── tsconfig.json
│
├── docker-compose.yml          # Production-like compose
├── docker-compose.dev.yml      # Development compose (with hot reload)
├── package.json                # Root package.json (workspaces)
├── pnpm-workspace.yaml
├── turbo.json                  # Turborepo pipeline config
├── tsconfig.base.json          # Base TypeScript config
└── .eslintrc.js                # Root ESLint config
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### turbo.json Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Shared Code Strategy

`packages/shared` is consumed by all apps via workspace imports (`@ev-trips/shared`). It exports:

- **TypeScript interfaces:** `ITrip`, `IUser`, `IVehicle`, `INotification`, `IPaginatedResponse<T>` — single source of truth for all data shapes
- **Enums:** `TripStatus`, `UserRole`, `NotificationType`, `FuelType`, `DrivetrainType` — referenced by backend entities and frontend type guards
- **Zod schemas:** `createTripSchema`, `loginSchema`, `registerSchema` — used by web and mobile for form validation, matching backend class-validator rules
- **Utility functions:** `generateSlug()`, `formatArabicDate()`, `truncateText()`, `formatDistance()` — tested once, used everywhere

---

## 5. Backend Architecture (NestJS)

### Module Graph

```
AppModule
├── ConfigModule (global)
├── TypeOrmModule (global)
├── CacheModule (global, Redis)
├── ThrottlerModule (global)
│
├── AuthModule
│   ├── JwtModule
│   ├── PassportModule
│   └── → UsersModule (import)
│
├── UsersModule
│   ├── UsersController
│   ├── UsersService
│   └── UserEntity
│
├── VehiclesModule
│   ├── VehiclesController
│   ├── VehiclesService
│   ├── VehicleEntity
│   └── → LookupsModule (import, for brand/model validation)
│
├── TripsModule
│   ├── TripsController
│   ├── TripsService
│   ├── TripEntity, TripStopEntity, TripMediaEntity
│   ├── → VehiclesModule
│   ├── → LookupsModule
│   └── → NotificationsModule
│
├── CommentsModule
│   ├── CommentsController
│   ├── CommentsService
│   └── → TripsModule, NotificationsModule
│
├── FavoritesModule
│   └── → TripsModule, NotificationsModule
│
├── ReactionsModule
│   └── → TripsModule
│
├── NotificationsModule
│   ├── NotificationsController
│   ├── NotificationsService
│   ├── EmailService (Bull queue producer)
│   ├── PushService (Expo push API)
│   └── NotificationEntity
│
├── LookupsModule (global)
│   ├── BrandsController, ModelsController
│   ├── CitiesController, RoutesController
│   ├── ChargingStationsController
│   └── All lookup entities
│
├── ReportsModule
│   └── → NotificationsModule (admin alert)
│
├── AdminModule
│   ├── AdminController
│   ├── AdminService
│   └── → All modules (admin operations on all entities)
│
└── UploadModule
    ├── UploadController
    └── S3Service
```

### Dependency Injection Patterns

NestJS uses constructor-based DI. Services are `@Injectable()` providers registered in module `providers` arrays. The `forwardRef()` utility handles circular dependencies (e.g., `TripsModule` ↔ `NotificationsModule`).

```typescript
// Example: TripsService DI
@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripsRepository: Repository<Trip>,
    @InjectRepository(TripStop)
    private stopsRepository: Repository<TripStop>,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    @InjectQueue('email')
    private emailQueue: Queue,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}
}
```

### Configuration Management

`ConfigModule.forRoot({ isGlobal: true, validationSchema: Joi.object({...}) })` loads environment variables with runtime validation at startup. Typed config is accessed via `ConfigService.get<string>('DATABASE_URL')`.

Configuration is organized by namespace:
- `database.*` — PostgreSQL connection params
- `jwt.*` — secret, expiry values
- `redis.*` — host, port, password
- `s3.*` — bucket, region, credentials
- `email.*` — SMTP / SendGrid settings
- `app.*` — port, cors origin, env name

### Database Layer

TypeORM is configured with:
- `synchronize: false` in all environments (migrations only)
- `logging: ['error', 'warn']` in production
- Connection pool: `extra: { max: 10, idleTimeoutMillis: 30000 }`
- `namingStrategy: new SnakeCaseNamingStrategy()` for consistent column names
- Entities auto-loaded from `entities: [__dirname + '/**/*.entity{.ts,.js}']`

### Caching Strategy

| Cache Key Pattern | TTL | Content |
|-------------------|-----|---------|
| `brands:all` | 1 hour | All vehicle brands |
| `models:brand:{brandId}` | 1 hour | Models for a brand |
| `cities:all` | 1 hour | All cities |
| `route_insights:{fromId}:{toId}` | 1 hour | Aggregated route stats |
| `trip:{slug}` | 5 minutes | Trip detail (public) |
| `search:{hash}` | 2 minutes | Search result page |
| `user:stats:{userId}` | 10 minutes | User public stats |

Cache is invalidated on mutation: when a trip is approved, `cache.del('trip:' + slug)` and `cache.del('route_insights:...')` are called.

### Queue Strategy

Two Bull queues backed by Redis:

**Email Queue (`email-queue`):**
- Jobs: `verify-email`, `password-reset`, `trip-approved`, `trip-rejected`, `new-comment`, `weekly-digest`
- Processor runs in separate worker process
- Retry: 3 attempts with exponential backoff
- Bilingual email templates (Arabic + English)

**Notification Queue (`notification-queue`):**
- Jobs: `push-notification` (Expo Push API batch)
- Batches up to 100 push tokens per Expo API call
- Dead letter queue for failed tokens

**Cleanup Queue (`cleanup-queue`):**
- Cron job: daily S3 orphan cleanup
- Cron job: purge old soft-deleted records (>90 days)
- Cron job: expire unverified accounts (>7 days)

### File Upload Flow

```
Browser/Mobile
    │
    ├─► POST /upload/presign  (request presigned URL)
    │        │
    │        └─► S3Service.getPresignedUrl(key, contentType, expiresIn: 300)
    │                └─► return { uploadUrl, key, publicUrl }
    │
    ├─► PUT {uploadUrl}  (browser → S3 directly, no API proxy)
    │        └─► S3 stores file, returns 200
    │
    └─► PATCH /trips/:id  (save publicUrl to trip record)
             └─► DB: trip.cover_image_url = publicUrl
```

For admin uploads (small files), direct Multer → S3 streaming is used.

### Error Handling

A global `AllExceptionsFilter` catches all thrown exceptions:

- `HttpException` → uses its status code and message
- `QueryFailedError` (TypeORM) → 400 with sanitized message (no SQL leakage)
- `EntityNotFoundError` → 404
- Unknown errors → 500 with generic message (error logged internally)

All errors follow the standard response envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "must be a valid email" }]
  }
}
```

### Request Lifecycle

```
Incoming Request
    │
    ├── 1. Middleware (Helmet, CORS, cookie-parser, Logger)
    │
    ├── 2. Guards (JwtAuthGuard → RolesGuard → ThrottlerGuard)
    │       └── 401/403/429 if failed
    │
    ├── 3. Interceptors (before) (LoggingInterceptor, TransformInterceptor)
    │
    ├── 4. Pipes (ValidationPipe → class-validator on DTOs)
    │       └── 400 if validation fails
    │
    ├── 5. Controller method
    │
    ├── 6. Service method (business logic, DB queries, cache)
    │
    ├── 7. Interceptors (after) (TransformInterceptor wraps response)
    │
    └── Response (standard envelope)
```

### Logging Strategy

- **Development:** `Logger.log()` (NestJS built-in) to stdout
- **Production:** Winston logger with JSON format, timestamps, correlation IDs
- **HTTP Logs:** Nginx access logs for all requests
- **Error Logs:** Alert on 5xx errors via log aggregation (CloudWatch / Datadog)
- **Audit Logs:** `admin_logs` table records all admin actions (immutable)

---

## 6. Authentication & Security

### JWT Token Strategy

```
┌─────────────────────────────────────────────────────┐
│  Access Token                                        │
│  ─────────────────────────────────────────────────  │
│  Payload: { sub: userId, email, role, iat, exp }    │
│  Expiry: 15 minutes                                  │
│  Stored: Memory (web) / expo-secure-store (mobile)  │
│  Used: Authorization: Bearer <token> on all reqs    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Refresh Token                                       │
│  ─────────────────────────────────────────────────  │
│  Format: Random 64-byte hex string                   │
│  Expiry: 30 days                                     │
│  Stored: HttpOnly cookie (web) + DB (hashed)        │
│          expo-secure-store (mobile)                  │
│  DB: users.refresh_token_hash (bcrypt hash)          │
│  DB: users.refresh_token_expires_at (timestamp)      │
└─────────────────────────────────────────────────────┘
```

### Refresh Token Rotation

On each `POST /auth/refresh`:
1. Validate the provided refresh token against `refresh_token_hash` in DB
2. Check `refresh_token_expires_at` is in the future
3. Generate new access token + new refresh token
4. Hash new refresh token → update DB
5. Return new token pair
6. Old refresh token is now invalid (DB record replaced)

This provides single-use refresh tokens, preventing token replay attacks.

### Email Verification Flow

```
Register → Save user (verified: false) → Bull: send-verification email
→ Email: link with JWT token (expires 24h)
→ User clicks link → GET /auth/verify?token=...
→ API: verifies token, sets user.email_verified = true
→ Redirect to /dashboard
```

Unverified users can log in but cannot create trips or interact with content.

### Password Reset Flow

```
POST /auth/forgot-password { email }
→ Generate reset token (random UUID, store hashed in DB, expires 1h)
→ Bull: send reset-password email with link
→ User clicks link → load reset form
→ POST /auth/reset-password { token, newPassword }
→ API: verify token, update password hash, invalidate token
→ Invalidate all existing refresh tokens (force re-login)
```

### Rate Limiting (Throttler)

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| `POST /auth/*` | 5 | 15 min |
| `POST /auth/register` | 3 | 1 hour |
| `GET /trips` (guest) | 100 | 1 min |
| `GET /trips` (auth) | 300 | 1 min |
| `POST /trips` | 10 | 1 hour |
| `POST /upload/*` | 20 | 1 hour |
| `POST /reports` | 5 | 1 hour |
| All other endpoints | 60 | 1 min |

### CORS Configuration

```typescript
app.enableCors({
  origin: [
    process.env.WEB_URL,        // https://evtrips.sa
    process.env.ADMIN_URL,      // https://admin.evtrips.sa
    'http://localhost:3000',    // dev web
    'http://localhost:3002',    // dev admin
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### Helmet Headers

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', '*.amazonaws.com', '*.mapbox.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'api.mapbox.com'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));
```

### RBAC Implementation

Three roles: `user`, `admin`, `super_admin`

```typescript
// Guard checks JWT payload role
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Decorator usage
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Patch(':id/approve')
async approveTrip(@Param('id') id: string) { ... }
```

---

## 7. Database Design

### PostgreSQL Choice Rationale

- **JSONB:** Store flexible metadata (charger specs, route metadata) without schema changes
- **Arrays:** Store image URL arrays, tag arrays efficiently
- **Full-text search:** Native `tsvector`/`tsquery` for trip search without Elasticsearch
- **PostGIS extension:** Future-ready for geospatial queries (nearest charging station, route mapping)
- **ACID compliance:** Critical for trip submission workflows and financial-adjacent operations
- **Mature ecosystem:** Excellent TypeORM support, managed services (RDS, Cloud SQL, Supabase)

See `DATABASE.md` for full entity relationship diagram and table definitions.

### Key Design Decisions

**Vehicle Snapshot Pattern:**
When a trip is created, a snapshot of the vehicle's key fields (`brand_name`, `model_name`, `year`, `battery_capacity_kwh`, `range_km`) is saved directly on the trip record. This ensures historical accuracy — if a user modifies or deletes their vehicle profile, existing trip data remains valid and display correctly.

**Soft Delete Convention:**
All user-generated content entities include `deleted_at TIMESTAMP NULL`. Application queries always append `WHERE deleted_at IS NULL` (TypeORM `@DeleteDateColumn()` with `softDelete()` method handles this automatically). Hard deletes are reserved for GDPR/data deletion requests and are performed by a super_admin action.

**Slug Generation:**
- Trips: `{city-from-slug}-to-{city-to-slug}-{vehicle-brand}-{vehicle-model}-{nanoid(8)}`
- Users: `{username}` (unique, alphanumeric + hyphens)
- Cities: `{arabic-transliteration}` (e.g., `riyadh`, `dammam`)

**Index Strategy:**
Hot query paths are indexed: `trips(status, published_at)`, `trips(departure_city_id, destination_city_id, status)`, `users(email)`, `comments(trip_id, deleted_at)`, full-text `GIN(search_vector)`.

### Migration Approach

TypeORM migrations are generated via CLI (`typeorm migration:generate`), committed to version control, and run automatically on deployment via `typeorm migration:run`. Rollback uses `typeorm migration:revert`. Migrations are never edited after being applied to production.

---

## 8. Frontend Architecture (Next.js)

### App Router Structure

The web app uses Next.js 14 App Router with locale-based routing via next-intl:

```
app/
└── [locale]/           # 'ar' | 'en' — locale-based routing
    ├── layout.tsx      # Root layout (sets dir, font, providers)
    ├── (public)/       # No auth required, SSR-rendered
    ├── (auth)/         # Auth pages (redirect if logged in)
    └── (dashboard)/    # Protected, auth required
        └── layout.tsx  # Dashboard layout (checks auth, redirects)
```

### Route Groups

**`(public)`** — Server components by default, SSR for SEO:
- `/` — Home page with search hero and recent trips
- `/trips` — Trip listing with filters (search params → server fetch)
- `/trips/[slug]` — Trip detail (SSR, full metadata for social sharing)
- `/routes/[from]/[to]` — Route insights page
- `/stations` — Charging stations directory
- `/users/[username]` — Public user profile

**`(auth)`** — Client components, redirect logged-in users:
- `/login`, `/register`, `/verify-email`, `/reset-password`

**`(dashboard)`** — Protected client components, redirect unauthenticated:
- `/dashboard` — User's personal hub
- `/trips/new` — Multi-step trip creation wizard
- `/trips/[id]/edit` — Edit draft trip
- `/vehicles` — Vehicle management
- `/favorites` — Saved trips
- `/notifications` — Notification center

### Server vs Client Component Strategy

| Component Type | When to Use |
|----------------|-------------|
| Server Component | Public page layouts, data fetching for SEO, non-interactive content |
| Client Component | Forms, interactive UI, state-dependent rendering, map components |
| Hybrid | Server fetches initial data → passes to client component as props |

The pattern for trip detail page:
```
TripDetailPage (Server Component)
├── fetch trip data from API (server-side, no auth needed)
├── generateMetadata() for SEO (og:title, og:image, etc.)
└── render:
    ├── TripHeader (Server Component — static content)
    ├── TripMap (Client Component — "use client", Mapbox)
    ├── TripStats (Server Component)
    └── CommentsSection (Client Component — TanStack Query)
```

### State Management

**Zustand stores:**
- `useAuthStore` — `{ user, accessToken, setAuth, clearAuth, isAuthenticated }`
- `useUIStore` — `{ locale, theme, sidebarOpen, toasts }`
- `useTripDraftStore` — Multi-step form state persisted to sessionStorage

**TanStack Query:**
- All server data (trips list, trip detail, notifications) fetched via queries
- Mutations (favorite, react, comment) with optimistic updates
- SSR hydration: server fetches data → dehydrates → client rehydrates

### Form Strategy

React Hook Form + Zod resolver pattern:
```typescript
const schema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(5000),
  vehicleId: z.string().uuid(),
  // ...
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { title: '', ... },
});
```

Zod schemas imported from `@ev-trips/shared` match backend validation exactly.

### RTL/i18n Implementation

**next-intl configuration:**
- `i18n.ts` defines `locales: ['ar', 'en']` and `defaultLocale: 'ar'`
- Middleware redirects root `/` to `/ar/`
- `getRequestConfig` loads translation messages by locale

**HTML dir attribute:**
```typescript
// app/[locale]/layout.tsx
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

**Tailwind logical properties:**
```html
<!-- Instead of mr-4 (margin-right), use me-4 (margin-end) -->
<div className="ms-4 pe-6 text-start border-s-2">
  <!-- In RTL: margin-left, padding-left, text-right, border-left -->
  <!-- In LTR: margin-right, padding-right, text-left, border-right -->
</div>
```

**Arabic font:**
```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap');

[dir="rtl"] { font-family: 'Noto Kufi Arabic', sans-serif; }
```

### Protected Route Implementation

```typescript
// app/[locale]/(dashboard)/layout.tsx
export default async function DashboardLayout({ children }) {
  const session = await getServerSession();   // reads cookie/token
  if (!session) redirect(`/${locale}/login`);
  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
```

On the client, `useAuthStore` maintains session state. Axios interceptors handle token expiry and redirect to login on 401 after failed refresh.

---

## 9. Mobile Architecture (React Native Expo)

### Navigation Structure

```
RootNavigator (Stack)
├── SplashScreen          (checks token, routes to auth or main)
│
├── AuthNavigator (Stack) — visible when not authenticated
│   ├── LoginScreen
│   ├── RegisterScreen
│   ├── VerifyEmailScreen
│   └── ForgotPasswordScreen
│
└── MainTabNavigator (Bottom Tabs) — visible when authenticated
    ├── HomeTab (Stack)
    │   ├── HomeScreen       (search + recent trips)
    │   ├── TripListScreen   (search results)
    │   └── TripDetailScreen
    │
    ├── ExploreTab (Stack)
    │   ├── RouteInsightsScreen
    │   └── StationsScreen
    │
    ├── MyTripsTab (Stack)
    │   ├── MyTripsScreen
    │   ├── CreateTripScreen (multi-step wizard)
    │   └── EditTripScreen
    │
    ├── NotificationsTab
    │   └── NotificationsScreen
    │
    └── ProfileTab (Stack)
        ├── ProfileScreen
        ├── VehiclesScreen
        ├── SettingsScreen
        └── LanguageScreen
```

### State Management

- **Zustand + MMKV persistence:** Auth state persisted to MMKV storage synchronously
- MMKV is 10x faster than AsyncStorage and supports encryption
- Token state hydrated synchronously on app start (no flash of unauthenticated UI)

```typescript
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, token) => set({ user, accessToken: token }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    { name: 'auth-store', storage: createJSONStorage(() => mmkvStorage) }
  )
);
```

### API Client

```typescript
// Axios instance with interceptors
const apiClient = axios.create({ baseURL: API_URL });

// Request: attach token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: handle 401 → refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshTokens();    // POST /auth/refresh
      apiClient.defaults.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(error.config);            // retry original request
    }
    return Promise.reject(error);
  }
);
```

### RTL Implementation

```typescript
// app entry point
import { I18nManager } from 'react-native';

const isArabic = getCurrentLocale() === 'ar';
if (isArabic && !I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  // Restart app to apply (done via expo-updates or RNRestart)
}
```

RTL-aware flex: React Native automatically mirrors `flexDirection: 'row'` in RTL mode. Custom RTL overrides use `I18nManager.isRTL` conditional styles.

### Push Notifications

```
expo-notifications registers device → Expo Push Token
    │
    └─► POST /users/push-token { token }
            └─► DB: users.expo_push_token = token

Server event occurs (new comment, trip approved, etc.)
    │
    └─► NotificationsService.sendPush()
            └─► Bull queue: push-notification job
                    └─► Worker: POST https://exp.host/--/api/v2/push/send
                            ├─► Expo → FCM → Android device
                            └─► Expo → APNs → iOS device
```

### Image Upload

```typescript
// 1. Pick image
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true, aspect: [16, 9], quality: 0.85,
});

// 2. Get presigned URL
const { uploadUrl, key, publicUrl } = await api.post('/upload/presign', {
  contentType: 'image/jpeg',
  folder: `trips/${tripId}`,
});

// 3. Upload directly to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: { uri: result.assets[0].uri, type: 'image/jpeg', name: key },
  headers: { 'Content-Type': 'image/jpeg' },
});

// 4. Save URL to trip
await api.patch(`/trips/${tripId}`, { coverImageUrl: publicUrl });
```

### Deep Linking Configuration

```json
// app.json
{
  "expo": {
    "scheme": "evtrips",
    "ios": { "bundleIdentifier": "sa.evtrips.app" },
    "android": { "package": "sa.evtrips.app" }
  }
}
```

Supported deep links:
- `evtrips://trips/{slug}` — Open trip detail
- `evtrips://profile/{username}` — Open user profile
- `evtrips://notifications` — Open notifications
- `https://evtrips.sa/trips/{slug}` — Universal link (iOS) / App Link (Android)

---

## 10. Admin Dashboard Architecture

### Structure

The admin app is a standalone Next.js application in `apps/admin`. It authenticates via the same JWT system but only allows users with `role: 'admin'` or `role: 'super_admin'` to access any page.

### Role Guard Implementation

```typescript
// middleware.ts (admin app)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  if (!token) return NextResponse.redirect('/login');

  const payload = verifyJwt(token);
  if (!['admin', 'super_admin'].includes(payload?.role)) {
    return NextResponse.redirect('/unauthorized');
  }
  return NextResponse.next();
}
```

### Admin Features

- **Moderation Queue:** Paginated list of `pending_review` trips with approve/reject actions
- **User Management:** Search users, view profiles, ban/unban, role assignment (super_admin only)
- **Reports Management:** Pending reports with resolution workflow
- **Lookups CRUD:** Manage vehicle brands, models, cities, charging stations
- **Static Pages:** Edit Terms of Service, About Us, FAQ content (stored in DB)
- **Banners:** Create/schedule promotional banners visible on web/mobile
- **Analytics Dashboard:** Trip submissions over time, user growth, popular routes — using Recharts

### Real-Time Stats Polling

The admin dashboard stats page polls `GET /admin/stats` every 30 seconds using TanStack Query's `refetchInterval`:

```typescript
const { data: stats } = useQuery({
  queryKey: ['admin-stats'],
  queryFn: () => adminApi.get('/admin/stats'),
  refetchInterval: 30_000,
  staleTime: 25_000,
});
```

---

## 11. Arabic RTL Strategy

### Core Principle

RTL is not a style override — it is a foundational design decision. Every UI decision is made with both LTR and RTL in mind simultaneously.

### Web Implementation

**1. HTML dir attribute on root:**
```html
<html lang="ar" dir="rtl">  <!-- Arabic -->
<html lang="en" dir="ltr">  <!-- English -->
```

**2. Tailwind CSS logical properties:**
All margin, padding, border, text-align utilities use logical variants:

| Physical (avoid) | Logical (use) | RTL Effect |
|------------------|---------------|------------|
| `ml-4` | `ms-4` (margin-start) | Becomes `mr-4` in RTL |
| `pr-6` | `pe-6` (padding-end) | Becomes `pl-6` in RTL |
| `text-left` | `text-start` | Becomes `text-right` in RTL |
| `border-l-2` | `border-s-2` | Becomes `border-r-2` in RTL |
| `left-0` | `start-0` | Becomes `right-0` in RTL |
| `rounded-l-md` | `rounded-s-md` | Flips in RTL |

**3. Arabic font: Noto Kufi Arabic**
```css
[dir="rtl"] * {
  font-family: 'Noto Kufi Arabic', sans-serif;
  font-feature-settings: 'kern' 1;
}
```

**4. Icon mirroring:**
Icons with directional meaning (arrows, chevrons, back button) are mirrored:
```html
<svg className="rtl:scale-x-[-1]" ...>  <!-- Mirrors horizontally in RTL -->
```

### Mobile Implementation

```typescript
// i18n initialization (app boot)
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';

const locale = Localization.getLocales()[0]?.languageCode ?? 'ar';
I18nManager.allowRTL(true);
I18nManager.forceRTL(locale === 'ar');
```

StyleSheet uses `start` and `end` instead of `left` and `right`:
```typescript
// RTL-aware styles
const styles = StyleSheet.create({
  container: {
    paddingStart: 16,   // paddingLeft in LTR, paddingRight in RTL
    paddingEnd: 16,
    flexDirection: 'row', // automatically mirrored in RTL
  },
});
```

### Date/Number Formatting

```typescript
// Arabic locale formatting
const formatDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(date);

// Arabic numerals: ١٢٣ vs 123
const formatNumber = (n: number, locale: string) =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US').format(n);
```

### Form Direction

Forms with mixed Arabic/English content use `dir="auto"` on text inputs so the browser detects directionality per field:
```html
<input dir="auto" type="text" placeholder="اكتب هنا أو Type here" />
```

---

## 12. Notification Architecture

### Event-Driven Notification Flow

```
User Action / System Event
        │
        ▼
Service Method (e.g., CommentsService.create())
        │
        ├─► NotificationsService.create({
        │       recipientId, type, actorId, entityId, entityType
        │   })
        │       └─► INSERT INTO notifications (in-app notification)
        │
        ├─► EmailService.queue({
        │       to, template, data, locale
        │   })
        │       └─► Bull: email-queue job (async, non-blocking)
        │               └─► Worker: Nodemailer → SendGrid SMTP
        │
        └─► PushService.queue({
                token, title, body, data
            })
                └─► Bull: notification-queue job
                        └─► Worker: Expo Push API → FCM/APNs
```

### Notification Types

| Type | In-App | Email | Push |
|------|--------|-------|------|
| `trip_approved` | Yes | Yes | Yes |
| `trip_rejected` | Yes | Yes | Yes |
| `new_comment` | Yes | No | Yes |
| `comment_reply` | Yes | No | Yes |
| `trip_favorited` | Yes (batched) | No | No |
| `new_follower` | Yes | No | Yes |
| `trip_reaction` | Yes (batched) | No | No |
| `badge_earned` | Yes | Yes | Yes |
| `weekly_digest` | No | Yes | No |

### User Notification Settings

```
notifications_settings table:
- user_id
- channel: 'email' | 'push' | 'in_app'
- event_type: NotificationType
- enabled: boolean
```

Before sending, the service checks user preferences:
```typescript
const pref = await this.settingsRepo.findOne({
  where: { userId, channel, eventType },
});
if (pref?.enabled === false) return; // user has disabled this
```

### Batching for High-Volume Events

`trip_favorited` events are batched — instead of sending a push notification for every favorite, a daily digest is prepared:
- Increment a counter in Redis: `INCR notif:favorites:{userId}:{date}`
- Daily cron job reads counters → sends one "Your trip was favorited 12 times today" notification

---

## 13. Search & Discovery Architecture

### Full-Text Search

PostgreSQL `tsvector` column on trips:

```sql
ALTER TABLE trips ADD COLUMN search_vector tsvector;

CREATE INDEX trips_search_idx ON trips USING GIN (search_vector);

-- Update on insert/update via trigger
CREATE TRIGGER trips_search_update
  BEFORE INSERT OR UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION
    tsvector_update_trigger(
      search_vector, 'pg_catalog.arabic',
      title, description, departure_city_name, destination_city_name
    );
```

Search query:
```sql
SELECT *, ts_rank(search_vector, query) AS rank
FROM trips, plainto_tsquery('arabic', $1) query
WHERE search_vector @@ query
  AND status = 'published'
  AND deleted_at IS NULL
ORDER BY rank DESC
LIMIT 20 OFFSET $2;
```

### Filter Strategy

TypeORM QueryBuilder with dynamic WHERE clauses:

```typescript
const qb = this.tripsRepository.createQueryBuilder('trip')
  .where('trip.status = :status', { status: 'published' })
  .andWhere('trip.deleted_at IS NULL');

if (filters.fromCityId) {
  qb.andWhere('trip.departure_city_id = :from', { from: filters.fromCityId });
}
if (filters.toCityId) {
  qb.andWhere('trip.destination_city_id = :to', { to: filters.toCityId });
}
if (filters.brandId) {
  qb.andWhere('trip.vehicle_brand_id = :brand', { brand: filters.brandId });
}
if (filters.vehicleYear) {
  qb.andWhere('trip.vehicle_year = :year', { year: filters.vehicleYear });
}
if (filters.q) {
  qb.andWhere('trip.search_vector @@ plainto_tsquery(:q)', { q: filters.q });
}
```

### Sorting Options

| Sort Key | SQL Order |
|----------|-----------|
| `published_at|-1` | `ORDER BY trip.published_at DESC` |
| `helpful_count|-1` | `ORDER BY trip.helpful_count DESC` |
| `view_count|-1` | `ORDER BY trip.view_count DESC` |
| `distance_km|1` | `ORDER BY trip.total_distance_km ASC` |

### Route Insights Aggregation

```sql
SELECT
  AVG(total_distance_km)             AS avg_distance_km,
  AVG(energy_consumed_kwh)           AS avg_energy_kwh,
  AVG(energy_consumed_kwh / NULLIF(total_distance_km, 0)) AS avg_kwh_per_km,
  AVG(duration_minutes)              AS avg_duration_minutes,
  COUNT(*)                           AS total_trips,
  MIN(total_distance_km)             AS min_distance_km,
  MAX(total_distance_km)             AS max_distance_km,
  MIN(avg_speed_kmh)                 AS min_speed,
  MAX(avg_speed_kmh)                 AS max_speed,
  AVG(start_battery_pct - end_battery_pct) AS avg_battery_used_pct
FROM trips
WHERE departure_city_id = $1
  AND destination_city_id = $2
  AND status = 'published'
  AND deleted_at IS NULL;
```

Cached in Redis with key `route_insights:{fromId}:{toId}` for 1 hour.

---

## 14. Moderation Architecture

### Trip Submission State Machine

```
[draft] ──submit──► [pending_review]
                          │
               ┌──────────┴──────────┐
            approve                reject
               │                    │
               ▼                    ▼
         [published]          [rejected]
               │                    │
            soft-delete         re-edit
               │                    │
               ▼                    ▼
          [deleted]            [draft] ──► (cycle repeats)
```

### Admin Moderation Queue

- Admin views `GET /admin/trips?status=pending_review`
- Admin sees trip content, media, author info, submission history
- `PATCH /admin/trips/:id/approve` → status = 'published', notify author
- `PATCH /admin/trips/:id/reject { reason }` → status = 'rejected', rejection_reason stored, notify author
- `GET /admin/logs` → immutable audit log of all admin actions

### Report Workflow

```
User reports content → POST /reports { entityType, entityId, reason }
→ Report created (status: 'pending')
→ Admin notified (in-app + email)
→ Admin reviews → PATCH /admin/reports/:id/resolve { action, note }
→ action: 'dismissed' | 'content_removed' | 'user_warned' | 'user_banned'
→ Report status: 'resolved', resolution details stored
```

### Admin Log Immutability

The `admin_logs` table is append-only:
- No `UPDATE` or `DELETE` permissions granted to the API service user
- Logs include: `admin_id`, `action`, `entity_type`, `entity_id`, `before_state (JSONB)`, `after_state (JSONB)`, `created_at`
- Provides full audit trail for content moderation decisions

---

## 15. File Storage Strategy

### Storage Backend

- **Production:** AWS S3 (`evtrips-media` bucket, `ap-south-1` region)
- **Development/Self-hosted:** MinIO (S3-compatible, runs in Docker)

### Folder Structure

```
bucket: evtrips-media
├── avatars/
│   └── {userId}/
│       ├── avatar-{timestamp}.jpg
│       └── avatar-{timestamp}-thumb.jpg
├── trips/
│   └── {tripId}/
│       ├── cover-{timestamp}.jpg
│       ├── media-{nanoid}.jpg
│       └── media-{nanoid}.mp4
└── stations/
    └── {stationId}/
        └── photo-{nanoid}.jpg
```

### Presigned URL Flow

```typescript
// S3Service
async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: this.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(this.s3Client, command, { expiresIn: 300 }); // 5 min
}
```

The presigned URL allows the client to PUT directly to S3 without routing through the API, avoiding memory pressure on the server for large media files.

### File Validation

Server-side validation before issuing presigned URL:

```typescript
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'video/mp4',
];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;   // 10 MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;   // 50 MB
```

MIME type is validated by extension + magic bytes (client cannot spoof Content-Type as S3 enforces the presigned URL's ContentType).

### CDN

CloudFront distribution sits in front of S3:
- `media.evtrips.sa/{key}` resolves to CloudFront → S3
- Cache-Control: `max-age=31536000` for immutable media files
- Images served via CloudFront + Lambda@Edge for on-the-fly resizing (planned)

---

## 16. Scalability Considerations

### Horizontal API Scaling

- API is fully stateless: no in-memory session state
- All session data (refresh tokens) stored in PostgreSQL
- All cache/queue state in Redis
- Multiple API instances can run behind Nginx load balancer with round-robin

### Database Scaling

- **Connection Pooling:** TypeORM pool (max 10 per instance) + PgBouncer in front of PostgreSQL for connection multiplexing
- **Read Replicas:** Analytics and reporting queries routed to a read replica to avoid impacting write performance
- **Partitioning:** `notifications` table will be range-partitioned by `created_at` month as volume grows
- **VACUUM:** Regular autovacuum tuned for write-heavy tables (`trips`, `comments`, `notifications`)

### Caching Layers

1. **Nginx Cache:** Static assets (HTML for SSR pages) cached at edge for 1 minute
2. **Redis Application Cache:** API response caching for lookup data and aggregations
3. **TanStack Query:** Client-side cache eliminates redundant API calls during navigation
4. **CDN:** Media files globally cached (CloudFront)

### Rate Limiting

Two-layer rate limiting:
1. **Nginx:** IP-based request limiting (prevent DDoS) — 100 req/sec per IP
2. **NestJS Throttler:** Business logic limits per endpoint per user (prevent abuse)

### Future Scaling Path

| Bottleneck | Solution |
|------------|---------|
| High read traffic on trips | Redis page cache + CDN for SSR pages |
| Large media uploads | Direct S3 upload via presigned URLs (already implemented) |
| Notification volume | Separate notification microservice with dedicated Bull workers |
| Search query load | Migrate full-text search to Elasticsearch/Typesense |
| Real-time features | Add Socket.io or Server-Sent Events for live notifications |

---

## 17. Deployment Architecture

### Docker Compose (Development)

```yaml
# docker-compose.dev.yml
services:
  api:
    build: ./apps/api
    volumes: ['./apps/api:/app']   # hot reload
    environment: [DATABASE_URL, REDIS_URL, ...]
    ports: ['3001:3001']

  web:
    build: ./apps/web
    volumes: ['./apps/web:/app']
    ports: ['3000:3000']

  admin:
    build: ./apps/admin
    ports: ['3002:3002']

  postgres:
    image: postgres:16-alpine
    volumes: ['postgres_data:/var/lib/postgresql/data']

  redis:
    image: redis:7-alpine

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ['9000:9000', '9001:9001']
```

### Production Deployment

```
Internet
    │
    ▼
Route 53 (DNS)
    │
    ├── evtrips.sa        → CloudFront → Next.js Web (Vercel / EC2)
    ├── admin.evtrips.sa  → CloudFront → Admin App (Vercel / EC2)
    ├── api.evtrips.sa    → ALB → ECS/EC2 API containers (2+ instances)
    └── media.evtrips.sa  → CloudFront → S3

API Containers (ECS):
    ├── api-1 (NestJS)
    ├── api-2 (NestJS)
    └── worker-1 (Bull queue processor)

Data Layer:
    ├── RDS PostgreSQL 16 (Multi-AZ)
    ├── ElastiCache Redis 7 (cluster mode)
    └── S3 (Standard storage class)
```

### Environment Configuration

Each app has `.env.example` committed to the repo. Actual `.env` files are never committed. Production secrets are stored in AWS Secrets Manager or GitHub Actions Secrets and injected at deployment time.

### CI/CD Pipeline (GitHub Actions)

```yaml
on: [push, pull_request]

jobs:
  lint:    pnpm lint (all workspaces)
  typecheck: pnpm type-check
  test:    pnpm test (unit + e2e)
  build:   pnpm build (Turborepo, uses remote cache)
  deploy:  (main branch only) deploy API to ECS, web/admin to Vercel
```

### Nginx Configuration

```nginx
upstream api {
  server api-1:3001;
  server api-2:3001;
}

server {
  listen 443 ssl http2;
  server_name api.evtrips.sa;

  ssl_certificate     /etc/ssl/evtrips.sa.crt;
  ssl_certificate_key /etc/ssl/evtrips.sa.key;

  location / {
    proxy_pass http://api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Rate limiting
    limit_req zone=api_limit burst=20 nodelay;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;
  }

  # Upload endpoint — longer timeout for file uploads
  location /upload {
    proxy_pass http://api;
    client_max_body_size 55M;
    proxy_read_timeout 300s;
  }
}
```

---

*End of Architecture Document — EV Trips Community v1.0*
