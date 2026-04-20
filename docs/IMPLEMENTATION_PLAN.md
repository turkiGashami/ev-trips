# EV Trips Community — Implementation Roadmap

> **Document Version:** 1.0  
> **Last Updated:** April 2026  
> **Total Duration:** ~26 weeks (6.5 months)  
> **Team:** 2 backend, 2 frontend, 1 mobile, 1 product/design

---

## Table of Contents

- [Phase 0: Project Setup (Week 1)](#phase-0-project-setup-week-1)
- [Phase 1: Core MVP (Weeks 2–6)](#phase-1-core-mvp-weeks-26)
- [Phase 2: Social Features (Weeks 7–10)](#phase-2-social-features-weeks-710)
- [Phase 3: Admin Dashboard & Moderation (Weeks 11–14)](#phase-3-admin-dashboard--moderation-weeks-1114)
- [Phase 4: Mobile App (Weeks 15–19)](#phase-4-mobile-app-weeks-1519)
- [Phase 5: Discovery & Route Insights (Weeks 20–23)](#phase-5-discovery--route-insights-weeks-2023)
- [Phase 6: Production Hardening (Weeks 24–26)](#phase-6-production-hardening-weeks-2426)

---

## Phase 0: Project Setup (Week 1)

### Goal

Establish a working monorepo foundation with infrastructure, tooling, CI/CD, and shared code skeletons — so every developer can clone and run the full stack within 10 minutes.

### Backend Tasks

- [ ] Initialize pnpm monorepo with `pnpm-workspace.yaml`
- [ ] Set up Turborepo (`turbo.json`) with `build`, `dev`, `lint`, `test`, `type-check` pipelines
- [ ] Bootstrap NestJS API in `apps/api`:
  - Install core dependencies (NestJS, TypeORM, PostgreSQL driver, Redis, Bull, Passport, JWT, Helmet, Throttler, class-validator, swagger)
  - Configure `AppModule` with `ConfigModule`, `TypeOrmModule`, `CacheModule` (Redis), `ThrottlerModule`
  - Set up `main.ts` with Helmet, CORS, global pipes (ValidationPipe), global filters (AllExceptionsFilter), global interceptors (TransformInterceptor)
  - Configure Swagger at `/docs`
  - Set up health check endpoint `GET /health`
- [ ] Bootstrap `packages/shared`:
  - Create base TypeScript types: `IUser`, `ITrip`, `IVehicle`, `IPaginatedResponse<T>`
  - Create base enums: `TripStatus`, `UserRole`, `NotificationType`
  - Configure package.json with proper exports
- [ ] Docker Compose setup:
  - `docker-compose.yml` — production-like stack (PostgreSQL 16, Redis 7, MinIO)
  - `docker-compose.dev.yml` — development with volume mounts for hot reload
  - Health checks on all services
- [ ] Database configuration:
  - TypeORM DataSource configuration
  - SnakeCaseNamingStrategy
  - Migration CLI scripts in `package.json`
  - Initial empty migration to verify pipeline works
- [ ] CI/CD skeleton (GitHub Actions):
  - `ci.yml`: on push/PR — lint, type-check, test, build
  - `deploy.yml`: on merge to main — placeholder deploy step
  - Turborepo remote caching configured (Vercel or self-hosted)

### Frontend Tasks

- [ ] Bootstrap Next.js 14 (App Router) in `apps/web`:
  - Install: Tailwind CSS, next-intl, Zustand, TanStack Query, React Hook Form, Zod, Axios, Mapbox GL JS
  - Configure Tailwind with RTL logical properties
  - Set up `i18n.ts` and middleware for `/ar` and `/en` locale routing
  - Set up `packages/ui` with a shared Button component to verify workspace imports work
- [ ] Bootstrap Next.js 14 admin in `apps/admin`:
  - Same stack as web
  - Basic protected layout skeleton
- [ ] Root layout with:
  - `html dir` attribute based on locale
  - Noto Kufi Arabic font loading
  - Providers: `QueryClientProvider`, auth context

### Acceptance Criteria

- [ ] `pnpm install` succeeds from repo root
- [ ] `pnpm dev` starts all apps without errors
- [ ] `GET http://localhost:3001/health` returns `{"status":"ok"}`
- [ ] PostgreSQL migrations run successfully
- [ ] Docker Compose brings up all services
- [ ] CI pipeline passes on GitHub Actions (lint + type-check + build)
- [ ] A developer can onboard by following `DEVELOPMENT.md` in under 15 minutes

### Dependencies

None — this is the foundation phase.

---

## Phase 1: Core MVP (Weeks 2–6)

### Goal

A user can: register → verify email → add vehicle → create trip → submit for review → admin approves → trip visible to anyone searching that route.

### Backend Tasks

#### Auth Module (Week 2)
- [ ] `User` entity with all fields (see DATABASE.md)
- [ ] `POST /v1/auth/register` — create user, send verification email via Bull queue
- [ ] `POST /v1/auth/login` — verify credentials, issue JWT access + refresh token pair
- [ ] `GET /v1/auth/me` — return authenticated user
- [ ] `POST /v1/auth/refresh` — refresh token rotation
- [ ] `POST /v1/auth/logout` — revoke refresh token
- [ ] `GET /v1/auth/verify-email?token=...` — verify email
- [ ] `POST /v1/auth/forgot-password` — send reset email
- [ ] `POST /v1/auth/reset-password` — update password
- [ ] `JwtAuthGuard`, `RolesGuard`, `JwtStrategy`, `RefreshTokenStrategy`
- [ ] Bull email queue with `EmailWorker` processor
- [ ] Email templates: verification, password reset (bilingual: AR + EN)
- [ ] `ThrottlerGuard` applied to auth endpoints with strict limits

#### User Profile Module (Week 2)
- [ ] `PATCH /v1/users/me` — update display name, bio, avatar URL
- [ ] `PATCH /v1/users/me/password` — change password
- [ ] `GET /v1/users/:username` — public profile
- [ ] Avatar upload via presigned URL flow (UploadModule)

#### Lookup Module (Week 2–3)
- [ ] `Brand`, `VehicleModel`, `City`, `ChargingStation` entities
- [ ] `GET /v1/lookups/brands`
- [ ] `GET /v1/lookups/brands/:id/models`
- [ ] `GET /v1/lookups/cities`
- [ ] `GET /v1/lookups/charging-stations?cityId=...`
- [ ] Seed data: 10 cities, 10 brands, ~50 models, 10 stations (see DATABASE.md seed section)
- [ ] Redis caching (1 hour TTL) on all lookup responses

#### Vehicle Module (Week 3)
- [ ] `Vehicle` entity
- [ ] `GET /v1/vehicles` — list user's vehicles
- [ ] `POST /v1/vehicles` — add vehicle
- [ ] `PATCH /v1/vehicles/:id` — update vehicle
- [ ] `DELETE /v1/vehicles/:id` — soft delete (prevent if active trip drafts)
- [ ] `PATCH /v1/vehicles/:id/primary` — set as primary vehicle

#### Trip Module (Weeks 3–5)
- [ ] `Trip`, `TripStop`, `TripMedia` entities
- [ ] `POST /v1/trips` — create draft trip with vehicle snapshot
- [ ] `PATCH /v1/trips/:id` — update draft/rejected trip
- [ ] `GET /v1/trips` — public listing with filters (from, to, brandId, sort, page, limit)
- [ ] `GET /v1/trips/:slug` — trip detail (increments view_count)
- [ ] `POST /v1/trips/:id/submit` — submit for review (status → pending_review)
- [ ] `POST /v1/trips/:id/stops` — add charging stop
- [ ] `PATCH /v1/trips/:id/stops/:stopId` — edit stop
- [ ] `DELETE /v1/trips/:id/stops/:stopId` — remove stop
- [ ] `DELETE /v1/trips/:id` — soft delete
- [ ] `GET /v1/trips/mine` — authenticated user's own trips (all statuses)
- [ ] Trip slug generation on create
- [ ] Basic full-text search vector setup (tsvector + GIN index)
- [ ] Vehicle snapshot logic in submit handler
- [ ] All DB indexes from INDEX STRATEGY section

#### Upload Module (Week 4)
- [ ] `POST /v1/upload/presign` — return S3 presigned PUT URL
- [ ] `POST /v1/upload/avatar` — direct upload with Multer (small files)
- [ ] S3 MIME type validation
- [ ] MinIO in development, AWS S3 in production

#### Admin Basic (Week 5)
- [ ] Admin role guard
- [ ] `GET /v1/admin/trips?status=pending_review` — moderation queue
- [ ] `PATCH /v1/admin/trips/:id/approve` — approve + notify author
- [ ] `PATCH /v1/admin/trips/:id/reject` — reject with reason + notify
- [ ] `GET /v1/admin/stats` — basic counts
- [ ] `AdminLog` entity — append-only audit log of admin actions

### Web Frontend Tasks

#### Auth Pages (Week 2)
- [ ] `/login` — login form with React Hook Form + Zod, error handling
- [ ] `/register` — registration form with all fields
- [ ] `/verify-email` — verify page (reads token from URL, calls API)
- [ ] `/reset-password` — forgot + reset password pages
- [ ] Zustand `useAuthStore` — stores user + tokens
- [ ] Axios instance with auth interceptor + 401 → refresh → retry logic
- [ ] Protected route layout (redirects unauthenticated users)
- [ ] Public route layout (redirects authenticated users away from auth pages)

#### Home Page (Week 3)
- [ ] Search hero — city-pair search (from/to dropdowns loaded from `GET /lookups/cities`)
- [ ] "Recent Trips" section — SSR with TanStack Query hydration
- [ ] Statistics bar (total trips, cities covered, contributors)
- [ ] RTL layout correct for Arabic locale

#### Trip Listing / Search (Week 3–4)
- [ ] `/trips` — trip list with filters:
  - From/To city selectors
  - Brand/Model dropdown (cascading: select brand → models update)
  - Sort selector
  - Pagination
- [ ] SSR for first load (server components fetch from API)
- [ ] Client-side filter updates via TanStack Query (no full page reload)
- [ ] `TripCard` component — cover image, vehicle info, route, stats badges, author
- [ ] Loading skeleton states

#### Trip Detail Page (Week 4)
- [ ] `/trips/[slug]` — SSR trip detail
- [ ] `generateMetadata()` for SEO (og:title, og:description, og:image)
- [ ] Trip header: title, author, vehicle info, route
- [ ] Trip stats section: distance, energy, battery %, speed, temp, AC usage
- [ ] Charging stops timeline
- [ ] Media gallery (images, basic video player)
- [ ] Simple Mapbox map showing departure → stop → destination pins
- [ ] Helpful/Inspiring reaction buttons (client component)
- [ ] Favorite button (client component)
- [ ] Comments section (client, TanStack Query)
- [ ] "More trips on this route" sidebar (SSR)

#### My Trips Page (Week 5)
- [ ] `/dashboard/trips` — list of user's own trips (all statuses)
- [ ] Status badges (draft / pending / published / rejected)
- [ ] If rejected: show rejection reason
- [ ] Link to edit draft/rejected trips
- [ ] Delete button (with confirmation modal)

#### Create Trip Form (Week 5)
- [ ] `/dashboard/trips/new` — multi-step wizard:
  - Step 1: Vehicle selection (from user's vehicles, or "add new")
  - Step 2: Route (departure city, destination city, trip date)
  - Step 3: Performance data (distance, energy, battery %, duration, speed, temperature, AC usage)
  - Step 4: Charging stops (add/remove stops with inline forms)
  - Step 5: Photos & description (cover image upload, description textarea)
  - Step 6: Review & submit
- [ ] Draft auto-save (debounced PATCH on each field change)
- [ ] Presigned URL image upload with progress indicator
- [ ] Form validation: React Hook Form + Zod schemas matching backend DTOs

#### My Vehicles Page (Week 5)
- [ ] `/dashboard/vehicles` — list vehicles
- [ ] Add vehicle modal (brand → model cascade, year, color, nickname)
- [ ] Set primary vehicle
- [ ] Delete vehicle

### Admin Tasks (Phase 1 — basic)

Admin app gets a basic skeleton in Phase 1 so developers can approve trips during testing:

- [ ] `/login` — admin login (same API endpoint)
- [ ] `/dashboard` — placeholder with pending trip count
- [ ] `/trips` — trip list with status filter
- [ ] Trip detail view with Approve / Reject (with reason) buttons

### Milestone — Phase 1 Complete

A user can:
1. Register an account and verify their email
2. Add their EV to their vehicle list
3. Create a trip, fill in all details, add charging stops, upload photos
4. Submit the trip for review
5. Admin (in admin app) reviews and approves the trip
6. The trip is visible to anyone searching that route on the web

**Demo script:** New user sign-up → Tesla Model Y → Riyadh to Dammam, 410km, 62kWh → 1 supercharger stop → submit → admin approves → visible on site.

### Dependencies

Phase 0 must be complete.

---

## Phase 2: Social Features (Weeks 7–10)

### Goal

Enable community interaction: reactions, favorites, comments, follow/unfollow, user profiles, notifications, and basic view counting.

### Backend Tasks

#### Reactions & Favorites (Week 7)
- [ ] `Reaction` entity (helpful, inspiring)
- [ ] `POST /v1/trips/:id/react` — toggle reaction, update `helpful_count`/`inspiring_count`
- [ ] `Favorite` entity + unique constraint
- [ ] `POST /v1/trips/:id/favorite` — toggle, update `favorite_count` atomically
- [ ] `GET /v1/favorites` — paginated list of user's favorited trips

#### Comments (Week 7)
- [ ] `Comment` entity with `parent_id` for nested replies
- [ ] `GET /v1/trips/:id/comments` — paginated, with top-level comments + replies nested
- [ ] `POST /v1/trips/:id/comments` — create comment or reply
- [ ] `PATCH /v1/comments/:id` — edit own comment (within 15 min grace period)
- [ ] `DELETE /v1/comments/:id` — soft delete own comment; admin can delete any
- [ ] `trip.comment_count` maintained atomically on create/delete

#### Follow System (Week 8)
- [ ] `UserFollow` entity with unique + self-follow constraint
- [ ] `POST /v1/users/:id/follow` — toggle follow/unfollow
- [ ] `GET /v1/users/:id/followers` — paginated follower list
- [ ] `GET /v1/users/:id/following` — paginated following list
- [ ] `follower_count`, `following_count` maintained atomically

#### Notifications (Week 8)
- [ ] `Notification` entity
- [ ] `NotificationSettings` entity
- [ ] `NotificationsService.create()` — in-app notification
- [ ] `NotificationsService.queueEmail()` — Bull job for email
- [ ] `NotificationsService.queuePush()` — Bull job for Expo push
- [ ] `GET /v1/notifications` — paginated, with unread count
- [ ] `PATCH /v1/notifications/:id/read` — mark read
- [ ] `POST /v1/notifications/read-all` — mark all read
- [ ] `GET /v1/notifications/settings` — get settings
- [ ] `PATCH /v1/notifications/settings` — update settings
- [ ] Notification types implemented:
  - `trip_approved` → author notified
  - `new_comment` → trip author notified
  - `comment_reply` → comment author notified
  - `trip_favorited` → trip author notified (batched daily)
  - `new_follower` → user notified
  - `trip_reaction` → trip author notified (batched)

#### View Count (Week 7)
- [ ] `GET /v1/trips/:slug` increments `view_count` atomically
- [ ] Debounce: only count 1 view per user per trip per 24 hours (Redis key: `view:{userId}:{tripId}`)

#### Badges Infrastructure (Week 9)
- [ ] `UserBadge` entity
- [ ] `BadgeService.checkAndAward(userId)` — evaluates all badge criteria
- [ ] Called after: new trip approved, comment created, follower gained
- [ ] Badge types: `first_trip`, `ten_trips`, `fifty_trips`, `first_long_haul`, `helpful_contributor`
- [ ] `badge_earned` notification on award

#### User Profiles (Week 9)
- [ ] Enhance `GET /v1/users/:username` with:
  - Full stats (trip count, follower count, following count)
  - Published trips (paginated)
  - Badges earned
  - `isFollowing` field for authenticated viewer
- [ ] `GET /v1/users/:username/trips` — user's published trips

### Web Frontend Tasks

#### Comments UI (Week 7)
- [ ] Comment list with nested replies
- [ ] Post comment form (authenticated users only)
- [ ] Reply inline form
- [ ] Edit/delete own comment
- [ ] Loading state, empty state

#### Favorites & Reactions UI (Week 7)
- [ ] Favorite button in TripCard and TripDetail (optimistic update)
- [ ] Helpful/Inspiring reaction buttons with count display
- [ ] `/dashboard/favorites` — favorited trips page

#### User Profile Pages (Week 8)
- [ ] `/users/[username]` — public profile:
  - Avatar, display name, bio
  - Badge display row
  - Published trips grid
  - Followers/following counts
  - Follow/unfollow button
- [ ] `/dashboard/profile` — edit own profile

#### Notifications UI (Week 8–9)
- [ ] Notification bell icon in header with unread badge count
- [ ] `/dashboard/notifications` — notification list
- [ ] Notification item → links to relevant content
- [ ] Mark as read on click
- [ ] "Mark all read" button
- [ ] Empty state (no notifications yet)

#### Follow UI (Week 9)
- [ ] Follow/unfollow button on public profiles
- [ ] Follower/following lists (modal or separate page)

#### Badges Display (Week 9)
- [ ] Badge icons with tooltips (what the badge means, when it was earned)
- [ ] Badge awarded toast notification

### Acceptance Criteria — Phase 2

- [ ] Users can react to trips (helpful/inspiring) with real-time count updates
- [ ] Users can comment, reply, edit, and delete their comments
- [ ] Users can favorite trips and view their favorites list
- [ ] Users can follow/unfollow other users
- [ ] Notifications are created for all relevant events
- [ ] Users can control their notification preferences
- [ ] Badges are automatically awarded when criteria are met
- [ ] Public profile pages show all user activity

### Dependencies

Phase 1 must be complete. Trip, User, and Vehicle entities must be stable.

---

## Phase 3: Admin Dashboard & Moderation (Weeks 11–14)

### Goal

A full-featured admin application for content moderation, user management, platform configuration, and analytics.

### Backend Tasks

#### Full Admin API (Week 11)
- [ ] `GET /v1/admin/stats` — comprehensive dashboard statistics:
  - User stats (total, verified, new today/week/month)
  - Trip stats (by status, new today/week/month)
  - Engagement stats (total comments, favorites, reactions, views)
  - Report stats (pending, resolved this week)
  - Top routes, top vehicles
- [ ] `GET /v1/admin/users` — full user list with filters (q, role, isBanned)
- [ ] `GET /v1/admin/users/:id` — full user detail
- [ ] `PATCH /v1/admin/users/:id/ban` — ban/unban with reason
- [ ] `PATCH /v1/admin/users/:id/role` — change role (super_admin only)
- [ ] `DELETE /v1/admin/users/:id` — GDPR delete (hard delete + S3 cleanup job)

#### Reports System (Week 12)
- [ ] `Report` entity (already defined in schema)
- [ ] `POST /v1/reports` — create report (user-facing)
- [ ] `GET /v1/admin/reports` — admin report list with filters
- [ ] `GET /v1/admin/reports/:id` — report detail with entity context
- [ ] `PATCH /v1/admin/reports/:id/resolve` — resolve with action
- [ ] Actions: `dismissed`, `content_removed`, `user_warned`, `user_banned`
- [ ] Auto-notify reporter when report is resolved

#### Lookups Admin (Week 12)
- [ ] `POST /v1/admin/lookups/brands` — create brand
- [ ] `PATCH /v1/admin/lookups/brands/:id` — update brand
- [ ] `DELETE /v1/admin/lookups/brands/:id` — deactivate brand
- [ ] Same CRUD for models, cities, charging stations
- [ ] Cache invalidation on any lookup mutation

#### Static Pages Admin (Week 13)
- [ ] `StaticPage` entity (already in schema)
- [ ] `GET /v1/pages/:slug` — public page content
- [ ] `GET /v1/admin/pages` — admin list all pages
- [ ] `PATCH /v1/admin/pages/:id` — edit page content (AR + EN)
- [ ] Pages: `terms`, `privacy`, `about`, `faq`

#### Admin Logs (Week 13)
- [ ] Log all admin actions via `AdminLogService.log()` interceptor
- [ ] `GET /v1/admin/logs` — admin audit log (super_admin only)
- [ ] Filter by admin, entity type, date range

### Admin Dashboard Frontend Tasks

#### Dashboard Home (Week 11)
- [ ] Stats cards: total users, published trips, pending trips, pending reports
- [ ] Charts (Recharts):
  - Line chart: daily new users (last 30 days)
  - Bar chart: daily new trips (last 30 days)
  - Pie chart: trips by status
- [ ] Top routes table
- [ ] Auto-refresh every 30 seconds

#### Moderation Queue (Week 11)
- [ ] Pending trips table with:
  - Thumbnail, title, author, submitted date
  - Link to full trip preview (same as public detail view)
  - Approve button (green)
  - Reject button (opens modal with reason input)
- [ ] Approved/Rejected history

#### User Management (Week 12)
- [ ] User list with search, role filter, banned filter
- [ ] User detail modal/page: profile, trips list, ban history
- [ ] Ban/unban action with reason
- [ ] Role change (super_admin only)

#### Reports Management (Week 12)
- [ ] Pending reports list with entity preview
- [ ] Resolution workflow UI (action dropdown + note)
- [ ] Resolved reports history

#### Lookups Management (Week 13)
- [ ] CRUD tables for brands, models, cities, stations
- [ ] Inline editing
- [ ] Activate/deactivate toggles

#### Static Pages Editor (Week 13)
- [ ] Rich text or Markdown editor for each page
- [ ] Side-by-side AR/EN editing
- [ ] Preview before saving

#### Admin Audit Log (Week 14)
- [ ] Timeline view of all admin actions
- [ ] Filter by admin user, action type, date

### Acceptance Criteria — Phase 3

- [ ] All platform content can be moderated through the admin app
- [ ] Reports can be submitted, reviewed, and resolved
- [ ] Lookup data (brands, models, cities) can be managed without code changes
- [ ] Static pages can be edited bilingually without a developer
- [ ] All admin actions are recorded in the audit log
- [ ] Admin analytics dashboard provides real-time platform insights

### Dependencies

Phases 1 and 2 must be complete. Notification infrastructure (Phase 2) required for report resolution notifications.

---

## Phase 4: Mobile App (Weeks 15–19)

### Goal

A fully featured React Native Expo mobile app with feature parity to the web app, plus native capabilities: push notifications, camera, secure storage, deep linking.

### Backend Tasks (Week 15)

- [ ] `PATCH /v1/users/me/push-token` — save/update Expo push token
- [ ] `DELETE /v1/users/me/push-token` — remove push token on logout
- [ ] Push notification worker: `PushWorker` processing `notification-queue` jobs
- [ ] Expo Push API integration with error handling + token invalidation cleanup
- [ ] Test endpoint: `POST /v1/debug/push-test` (dev only) — send test push

### Mobile Frontend Tasks

#### Setup & Navigation (Week 15)
- [ ] Expo SDK 51 project initialized
- [ ] React Navigation v6: `RootNavigator`, `AuthNavigator`, `MainTabNavigator`
- [ ] Zustand + MMKV persistence setup
- [ ] Axios instance with auth interceptors (token attach + 401 refresh)
- [ ] `expo-secure-store` for token storage
- [ ] `I18nManager.forceRTL(true)` for Arabic locale
- [ ] i18n with `i18next` + Arabic/English translations
- [ ] `SplashScreen` — token check, routing to auth or main

#### Auth Screens (Week 15)
- [ ] `LoginScreen` — email + password, form validation, error states
- [ ] `RegisterScreen` — full registration form
- [ ] `VerifyEmailScreen` — verification status screen
- [ ] `ForgotPasswordScreen` — email input + confirmation message
- [ ] Auth flow: login → home, register → verify email prompt

#### Home & Browse Screens (Week 16)
- [ ] `HomeScreen` — search hero (city-pair), recent trips list
- [ ] `TripListScreen` — search results with filters sheet
- [ ] `TripDetailScreen` — full trip details:
  - Performance stats
  - Charging stops timeline
  - Photo gallery (FlatList of images)
  - Reaction buttons
  - Favorite button
  - Comments section
- [ ] Offline-friendly: TanStack Query with `staleTime` + `cacheTime` settings

#### My Trips & Create Trip Screens (Week 17)
- [ ] `MyTripsScreen` — own trips with status badges
- [ ] `CreateTripScreen` — multi-step wizard:
  - Uses React Native `ScrollView` with step indicator
  - Vehicle picker → route picker → performance data → stops → photos → review
- [ ] `expo-image-picker` → presigned URL → S3 upload with progress bar
- [ ] `EditTripScreen` — edit draft/rejected trip

#### Profile & Vehicle Screens (Week 17)
- [ ] `ProfileScreen` — own profile, badges, stats
- [ ] `PublicProfileScreen` — other users' profiles
- [ ] `VehiclesScreen` — list + add vehicle
- [ ] `SettingsScreen` — notification preferences, language toggle, logout

#### Notifications Screen (Week 18)
- [ ] `NotificationsScreen` — notification list with mark-read
- [ ] `expo-notifications` setup:
  - Register for push permissions on first launch
  - `POST /v1/users/me/push-token` with Expo token
  - Handle incoming notifications in foreground (local notification display)
  - Handle notification tap → navigate to relevant screen

#### Deep Linking (Week 18)
- [ ] Configure `app.json` with scheme `evtrips` + universal links
- [ ] Deep link handlers:
  - `evtrips://trips/{slug}` → `TripDetailScreen`
  - `evtrips://profile/{username}` → `PublicProfileScreen`
  - `evtrips://notifications` → `NotificationsScreen`
- [ ] Test on iOS Simulator + Android Emulator

#### Arabic RTL Polish (Week 19)
- [ ] Audit every screen for RTL correctness:
  - All padding/margin using `start`/`end` style properties
  - FlexDirection rows correctly mirrored
  - Icons with directional meaning (back arrows) mirrored
  - Text alignment correct per locale
- [ ] Arabic number formatting in stats
- [ ] Arabic date formatting
- [ ] Language switcher: toggle AR/EN, restart app to apply RTL change

#### Performance Optimization (Week 19)
- [ ] FlatList with `getItemLayout` and `keyExtractor` optimization
- [ ] Image lazy loading with `expo-image` (better than `Image` for caching)
- [ ] TanStack Query `prefetchQuery` on navigation transitions
- [ ] Minimize re-renders: `memo()`, `useCallback()`, `useMemo()` on heavy components

### Acceptance Criteria — Phase 4

- [ ] App installs and runs on iOS 16+ and Android 13+
- [ ] All web MVP features available in mobile (browse, create, comment, favorite, profile)
- [ ] Push notifications received and tapped correctly navigate within app
- [ ] Arabic RTL layout correct on all screens
- [ ] Image upload from camera and gallery works
- [ ] Deep links open correct screens
- [ ] Token refresh works seamlessly without user-visible interruption
- [ ] Expo development build submitted to EAS Build

### Dependencies

Phases 1–3 must be complete. Push notification backend (early Phase 4 backend task) required for notification features.

---

## Phase 5: Discovery & Route Insights (Weeks 20–23)

### Goal

Power users and researchers can deep-dive into route data. The platform surface expands: route insights pages, popular routes directory, contributor leaderboards, full charging station directory, multi-waypoint trip wizard, and automatic badge awarding.

### Backend Tasks

#### Route Insights (Week 20)
- [ ] `GET /v1/trips/route-insights?from=&to=` — full aggregated stats query (see DATABASE.md)
- [ ] Vehicle breakdown in route insights
- [ ] Redis cache: 1-hour TTL, invalidated on new trip published on that route
- [ ] `GET /v1/routes/popular` — top 20 most-traveled routes (cached 6 hours)
- [ ] `GET /v1/routes` — all routes with trip count (for route directory)

#### Contributor Leaderboards (Week 20)
- [ ] `GET /v1/leaderboard` — top contributors:
  - By trip count
  - By helpful reactions received
  - By routes covered
- [ ] Cached 6 hours in Redis

#### Charging Stations Directory (Week 21)
- [ ] `GET /v1/charging-stations` — directory with filters:
  - City, charger type, operator, status
  - Pagination
- [ ] `GET /v1/charging-stations/:id` — station detail + trips that stopped here
- [ ] `GET /v1/charging-stations/:id/trips` — trips that included this station

#### Multi-Stop Trip Wizard Enhancement (Week 21)
- [ ] Support for intermediate cities (not just stops)
- [ ] `intermediaryCities[]` in trip — ordered list of cities passed through
- [ ] Map visualization of full route in trip detail
- [ ] Route validation: intermediate cities must be geographically plausible

#### Advanced Search (Week 22)
- [ ] Full-text search integration in `GET /v1/trips?q=`
- [ ] Search suggestions endpoint: `GET /v1/search/suggest?q=riyadh`
- [ ] Saved searches / search history (for authenticated users)
- [ ] "Trips similar to this one" on trip detail (same route + similar vehicle)

#### Badge Auto-Award (Week 22)
- [ ] Complete badge criteria implementation:
  - `first_long_haul` — trip > 500km distance
  - `desert_driver` — trip with temp > 45°C
  - `range_master` — trip with < 13 kWh/100km efficiency
  - `route_explorer` — 10 unique routes (departure+destination pairs)
  - `helpful_contributor` — 50 helpful reactions received
  - `top_commenter` — 100 comments made
  - `early_adopter` — among first 1000 registered users (retroactive seed)
- [ ] `POST /v1/admin/badges/recalculate` — admin-triggered recalculation

### Web Frontend Tasks

#### Route Insights Page (Week 20)
- [ ] `/routes/[from]/[to]` — route insights page:
  - Summary stats panel (avg distance, energy, battery used, duration)
  - Top vehicles table with efficiency comparison
  - Charging stop frequency (which stations are most used)
  - Recent trips on this route (grid)
  - Link to all trips on route (filtered search)
- [ ] SSR with 1-hour revalidation (matches Redis cache TTL)

#### Popular Routes Directory (Week 20)
- [ ] `/routes` — popular routes directory:
  - Cards showing route, trip count, avg efficiency, top vehicle
  - Link to each route's insights page

#### Charging Stations Directory (Week 21)
- [ ] `/stations` — station listing with city filter
- [ ] `/stations/[id]` — station detail:
  - Map pin
  - Charger types, ports, max power
  - Cost (free/paid)
  - Amenities
  - Recent trips that stopped here

#### Contributor Leaderboard (Week 21)
- [ ] `/leaderboard` — top contributors:
  - Tabs: Most Trips / Most Helpful / Most Routes
  - User cards with avatar, name, count, top vehicle

#### Enhanced Trip Wizard (Week 22)
- [ ] Multi-waypoint route map in create trip wizard
- [ ] Intermediate cities picker
- [ ] Route visualization before submission

#### Search Enhancements (Week 22)
- [ ] Search bar with autocomplete suggestions
- [ ] Search results page with full-text results alongside route results
- [ ] "Trending searches" on empty search state

#### Explore / Discovery Tab (Week 23)
- [ ] Redesigned home page with discovery feed:
  - "Popular this week"
  - "New on your following route"
  - "Top efficiency trips"
  - "Longest journey"

### Acceptance Criteria — Phase 5

- [ ] Route insights pages render with accurate aggregated statistics
- [ ] Charging station directory is browsable and filterable
- [ ] All badge types are awarded automatically when criteria are met
- [ ] Full-text search returns relevant results in both Arabic and English
- [ ] Popular routes directory shows top routes with stats
- [ ] Leaderboard updates daily

### Dependencies

Phases 1–4. Database indexes and tsvector setup from Phase 1. Notification infrastructure from Phase 2.

---

## Phase 6: Production Hardening (Weeks 24–26)

### Goal

The platform is ready for public launch: performant, secure, SEO-optimized, polished Arabic UX, load-tested, and deployed to production infrastructure.

### Backend Tasks

#### Security Audit (Week 24)
- [ ] Penetration testing: auth endpoints, file upload, injection attempts
- [ ] Review all RBAC checks (ensure no privilege escalation paths)
- [ ] Rotate all secrets (JWT secrets, API keys) to production values
- [ ] Enable Helmet with full CSP configuration
- [ ] Review all SQL queries for injection vectors (TypeORM parameterized queries)
- [ ] Add `X-Request-ID` header for request tracing
- [ ] Implement request logging with sanitized (no password/token) logs
- [ ] Set up Sentry for error monitoring (or Datadog)

#### Performance Optimization (Week 24)
- [ ] Profile slow API endpoints with `EXPLAIN ANALYZE`
- [ ] Add missing indexes discovered during profiling
- [ ] Tune connection pool size based on expected concurrency
- [ ] Add PgBouncer in front of PostgreSQL for connection multiplexing
- [ ] Response compression (gzip) enabled in NestJS
- [ ] `Cache-Control` headers on public GET endpoints

#### Email Templates Polish (Week 25)
- [ ] All email templates bilingual (Arabic + English, side-by-side or locale-based)
- [ ] HTML emails with responsive design, EV branding
- [ ] Templates: welcome, email verification, password reset, trip approved, trip rejected, new comment, weekly digest
- [ ] Test rendering across major email clients (Gmail, Outlook, Apple Mail)
- [ ] Unsubscribe link in all non-transactional emails

#### Load Testing (Week 25)
- [ ] Load test with k6 or Artillery:
  - 500 concurrent users browsing trips
  - 100 concurrent users searching (route queries)
  - 50 concurrent users submitting trips
- [ ] Identify bottlenecks and resolve before launch
- [ ] Test database connection pool exhaustion scenarios

### Web Frontend Tasks

#### SEO Implementation (Week 24)
- [ ] `generateMetadata()` on all public pages:
  - `og:title`, `og:description`, `og:image`, `og:url`
  - `twitter:card` for Twitter sharing
  - Canonical URLs
  - `hreflang` for AR/EN alternates
- [ ] `sitemap.xml` generation (Next.js App Router sitemap)
- [ ] `robots.txt` with proper allow/disallow rules
- [ ] JSON-LD structured data on trip detail pages
- [ ] Meta descriptions for all pages

#### Performance (Week 24)
- [ ] Core Web Vitals audit: LCP, CLS, FID targets
- [ ] Image optimization: `next/image` with proper `sizes` attribute
- [ ] Font loading: `next/font` for Noto Kufi Arabic (no layout shift)
- [ ] Dynamic imports for Mapbox (heavy bundle, not always needed)
- [ ] `prefetch` on navigation links for instant transitions
- [ ] Bundle analyzer run, large dependencies identified and replaced/lazy-loaded

#### Arabic RTL Final Polish (Week 25)
- [ ] QA every page in RTL with a native Arabic speaker
- [ ] Right-aligned navigation menu
- [ ] Correct number formatting (Arabic-Indic numerals optional setting)
- [ ] Date formatting in Arabic locale
- [ ] Error messages translated to Arabic
- [ ] Form validation messages in Arabic
- [ ] All placeholder text in Arabic
- [ ] RTL-aware animations (slide-in from correct direction)
- [ ] Search input cursor direction correct for Arabic text

#### Accessibility (Week 25)
- [ ] Screen reader testing (VoiceOver on iOS, TalkBack on Android)
- [ ] ARIA labels on all interactive elements
- [ ] Color contrast ratios meet WCAG AA
- [ ] Focus management in modals and multi-step forms
- [ ] Alt text on all images

### Deployment Tasks (Week 26)

- [ ] Production PostgreSQL: RDS Multi-AZ with daily snapshots
- [ ] Production Redis: ElastiCache with cluster mode
- [ ] Production S3 + CloudFront CDN for media
- [ ] API containerized in Docker, deployed to ECS or EC2 Auto Scaling Group
- [ ] Web app and admin deployed to Vercel (or EC2 with Nginx)
- [ ] Nginx config: SSL termination, HSTS, gzip, rate limiting
- [ ] SSL certificates: Let's Encrypt or ACM
- [ ] DNS: Route 53 with health check failover
- [ ] Monitoring: Datadog or CloudWatch dashboards (API latency, DB connections, queue depth)
- [ ] Alerting: PagerDuty or email alerts on 5xx spike, high queue depth, DB connection exhaustion
- [ ] Runbook: documented deployment, rollback, database restore procedures
- [ ] Staging environment: identical to production, deployed from `staging` branch

### Acceptance Criteria — Phase 6 (Launch Readiness)

- [ ] Google Lighthouse score: Performance 90+, SEO 95+, Accessibility 90+ on all public pages
- [ ] Core Web Vitals pass (LCP < 2.5s, CLS < 0.1, FID < 100ms) on mobile 3G simulation
- [ ] Load test: 500 concurrent users with < 200ms p95 API response time
- [ ] 0 critical security issues from penetration test
- [ ] All user flows work correctly in Arabic RTL layout (verified by native Arabic speaker)
- [ ] Email templates render correctly in Gmail, Outlook, Apple Mail
- [ ] Production infrastructure is deployed and health checks pass
- [ ] Monitoring and alerting configured and tested
- [ ] Runbook documented and reviewed by team
- [ ] Staging environment exists and mirrors production
- [ ] App submitted to App Store and Google Play (mobile)

---

## Summary Timeline

| Phase | Weeks | Key Deliverable |
|-------|-------|----------------|
| 0 | 1 | Monorepo, Docker, CI/CD ready |
| 1 | 2–6 | Full trip lifecycle on web (create → approve → visible) |
| 2 | 7–10 | Social layer (comments, favorites, reactions, follows, notifications) |
| 3 | 11–14 | Admin dashboard with full moderation capabilities |
| 4 | 15–19 | Mobile app with push notifications, camera, Arabic RTL |
| 5 | 20–23 | Route insights, discovery, stations directory, advanced search |
| 6 | 24–26 | Production hardening, SEO, security audit, deployment |

---

*End of Implementation Roadmap — EV Trips Community v1.0*
