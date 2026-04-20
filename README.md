# EV Trips Community — مجتمع رحلات السيارات الكهربائية

A bilingual (Arabic/English) social platform for EV drivers in the MENA region to document, share, and discover real-world road trip experiences — including charging stops, range data, and energy consumption.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │  Web App     │   │ Mobile App   │   │  Admin App   │        │
│  │ (Next.js 14) │   │ (RN / Expo)  │   │ (Next.js 14) │        │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘        │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │  HTTPS / REST API
                      ┌──────▼───────┐
                      │    Nginx     │
                      │  (SSL / LB)  │
                      └──────┬───────┘
                             │
                      ┌──────▼───────┐
                      │  NestJS API  │
                      │  (Port 3001) │
                      └──────┬───────┘
           ┌─────────────────┼──────────────────┐
           │                 │                  │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │ PostgreSQL  │   │    Redis    │   │   AWS S3 /  │
    │     16      │   │      7      │   │    MinIO    │
    └─────────────┘   └──────┬──────┘   └─────────────┘
                             │
                      ┌──────▼──────┐
                      │ Bull Queue  │──── SendGrid ──► Email
                      │  Workers   │
                      └─────────────┘
```

---

## Apps

| App | Path | Port | Description |
|-----|------|------|-------------|
| `@ev-trips/api` | `apps/api` | 3001 | NestJS REST API |
| `@ev-trips/web` | `apps/web` | 3000 | Next.js web frontend |
| `@ev-trips/admin` | `apps/admin` | 3002 | Next.js admin dashboard |
| `@ev-trips/mobile` | `apps/mobile` | Expo | React Native Expo app |

### Shared Packages

| Package | Path | Description |
|---------|------|-------------|
| `@ev-trips/shared` | `packages/shared` | Shared TypeScript types, enums, Zod schemas, utilities |
| `@ev-trips/ui` | `packages/ui` | Shared React component library |

---

## Quick Start

### Prerequisites

- Node.js 20+ — https://nodejs.org
- pnpm 9+ — `npm install -g pnpm@9`
- Docker Desktop — https://www.docker.com/products/docker-desktop

### 1. Clone & Install

```bash
git clone https://github.com/ev-trips-community/ev-trips-community.git
cd ev-trips-community
pnpm install
```

### 2. Configure Environment

```bash
cp apps/api/.env.example    apps/api/.env
cp apps/web/.env.example    apps/web/.env.local
cp apps/admin/.env.example  apps/admin/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

The default values in `.env.example` files work out of the box with the Docker Compose setup below.

### 3. Start Infrastructure

```bash
docker-compose -f docker-compose.dev.yml up -d postgres redis minio
```

### 4. Run Migrations & Seed

```bash
pnpm --filter @ev-trips/api migration:run
pnpm --filter @ev-trips/api seed
```

The seed creates:
- 10 Saudi cities (Riyadh, Jeddah, Dammam, etc.)
- 10 EV brands with key models
- 5 charging stations
- 1 admin user (`admin@evtrips.sa` / `Admin#123456`)

### 5. Start Development Servers

```bash
pnpm dev
```

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| Admin App | http://localhost:3002 |
| API | http://localhost:3001 |
| API Docs (Swagger) | http://localhost:3001/docs |
| MinIO Console | http://localhost:9001 |

---

## Tech Stack

### Backend (`apps/api`)

| Category | Technology |
|----------|-----------|
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| ORM | TypeORM 0.3 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 (via Cache Manager) |
| Queue | Bull (backed by Redis) |
| Auth | JWT + Passport (access 15min, refresh 30 days) |
| Validation | class-validator + class-transformer |
| File Storage | AWS S3 / MinIO (presigned URLs) |
| Email | Nodemailer + SendGrid |
| API Docs | @nestjs/swagger (OpenAPI) |
| Rate Limiting | @nestjs/throttler |
| Security | Helmet, CORS |

### Web Frontend (`apps/web`)

| Category | Technology |
|----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 (logical properties for RTL) |
| State | Zustand 4 (global) + TanStack Query v5 (server state) |
| Forms | React Hook Form 7 + Zod 3 |
| i18n | next-intl (Arabic + English) |
| Maps | Mapbox GL JS 3 |
| HTTP | Axios 1 |

### Mobile (`apps/mobile`)

| Category | Technology |
|----------|-----------|
| Framework | React Native 0.74 |
| Platform | Expo SDK 51 |
| Navigation | React Navigation v6 |
| State | Zustand 4 + MMKV |
| Secure Storage | expo-secure-store (Keychain / Keystore) |
| Push Notifications | expo-notifications → Expo Push API → FCM / APNs |
| Image Picker | expo-image-picker |
| HTTP | Axios 1 |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| Build System | pnpm workspaces + Turborepo |
| Containers | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |
| Object Storage | AWS S3 / MinIO |
| Email Delivery | SendGrid |

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full system architecture, module graphs, request flows, security model |
| [docs/DATABASE.md](docs/DATABASE.md) | Database design, all tables, enums, indexes, query examples |
| [docs/API.md](docs/API.md) | Complete REST API reference with request/response examples |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Developer setup guide, env vars, commands, testing, conventions |
| [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | Phased roadmap (26 weeks), task lists, acceptance criteria |

---

## Key Features

- **Bilingual Arabic/English** — RTL-native design, Noto Kufi Arabic font, Arabic locale formatting
- **Trip Documentation** — Distance, energy consumed, battery %, speed, temperature, AC usage, charging stops
- **Route Insights** — Community-aggregated statistics for any city pair (avg range, efficiency, popular vehicles)
- **Content Moderation** — All trips reviewed by admin before publication
- **Social Layer** — Comments, nested replies, favorites, helpful/inspiring reactions, follow/unfollow
- **Vehicle Snapshot** — Historical trip data remains accurate even after vehicle profile changes
- **Push Notifications** — Real-time in-app + email + mobile push for all relevant events
- **Badges System** — Automatically awarded badges for milestones (first trip, 10 trips, long haul, efficiency master)
- **Admin Dashboard** — Full moderation tools, analytics, user management, lookup CRUD

---

## Project Structure

```
ev-trips-community/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js web frontend
│   ├── admin/        # Next.js admin dashboard
│   └── mobile/       # React Native Expo app
├── packages/
│   ├── shared/       # Shared types, enums, schemas, utils
│   └── ui/           # Shared React components
├── docs/             # Architecture and API documentation
├── docker-compose.yml
├── docker-compose.dev.yml
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## Available Commands

Run from the **repo root** unless otherwise noted:

```bash
# Install all workspace dependencies
pnpm install

# Start all apps in development mode (hot reload)
pnpm dev

# Build all apps for production
pnpm build

# Run all tests
pnpm test

# Run linting across all workspaces
pnpm lint

# Type-check all workspaces
pnpm type-check

# API: run database migrations
pnpm --filter @ev-trips/api migration:run

# API: generate a new migration
pnpm --filter @ev-trips/api migration:generate src/database/migrations/MyMigration

# API: seed the database
pnpm --filter @ev-trips/api seed

# API: reset database (dev only — destroys all data)
pnpm --filter @ev-trips/api db:reset

# Mobile: start Expo dev server
pnpm --filter @ev-trips/mobile start
```

---

## Environment Variables

Each app has a `.env.example` file with all required variables documented. Key variables:

| Variable | App | Description |
|----------|-----|-------------|
| `DATABASE_URL` | api | PostgreSQL connection string |
| `REDIS_URL` | api | Redis connection string |
| `JWT_ACCESS_SECRET` | api | JWT signing secret for access tokens |
| `JWT_REFRESH_SECRET` | api | JWT signing secret for refresh tokens |
| `S3_BUCKET` | api | S3/MinIO bucket name |
| `NEXT_PUBLIC_API_URL` | web, admin | API base URL |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | web | Mapbox public access token |
| `API_URL` | mobile | API base URL (use machine IP for physical device) |

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the complete environment variable reference.

---

## Contributing

### Branch Strategy

- `main` — production-ready code, always deployable
- `develop` — integration branch for feature branches
- `feature/{issue-number}-{short-description}` — feature work
- `fix/{issue-number}-{short-description}` — bug fixes

### Commit Messages

Follow Conventional Commits format:

```
feat(trips): add route insights aggregation endpoint
fix(auth): correct refresh token rotation on concurrent requests
docs(api): add missing response examples for /trips endpoint
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

### Pull Request Process

1. Create a feature branch from `develop`
2. Make changes, write tests, update docs if needed
3. Run `pnpm lint && pnpm type-check && pnpm test` locally
4. Open a PR against `develop` with a description of changes
5. At least one code review required before merge
6. Squash and merge

### Code Standards

- TypeScript strict mode — no `any`, always type return values
- All new API endpoints need a test in `apps/api/test/*.e2e-spec.ts`
- New UI components need a `.test.tsx` file
- All user-visible strings must go through i18n (no hardcoded Arabic/English in JSX)
- Follow the file naming conventions in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

---

## License

MIT License — see `LICENSE` file for details.

---

*EV Trips Community — Built for EV drivers, by EV drivers.*  
*مجتمع رحلات السيارات الكهربائية — مبني لسائقي السيارات الكهربائية، من قبلهم.*
