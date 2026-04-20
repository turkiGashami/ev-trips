# EV Trips Community — Development Guide

> **Document Version:** 1.0  
> **Last Updated:** April 2026

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Environment Variables](#3-environment-variables)
4. [Running Individual Apps](#4-running-individual-apps)
5. [Database Operations](#5-database-operations)
6. [Testing Strategy](#6-testing-strategy)
7. [Code Style & Conventions](#7-code-style--conventions)
8. [Common Issues & Solutions](#8-common-issues--solutions)

---

## 1. Prerequisites

Ensure the following tools are installed before starting:

| Tool | Minimum Version | Installation |
|------|----------------|-------------|
| Node.js | 20.x (LTS) | https://nodejs.org or `nvm install 20` |
| pnpm | 9.x | `npm install -g pnpm@9` |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | 2.40+ | https://git-scm.com |

### Verify Installation

```bash
node --version     # Should output v20.x.x
pnpm --version     # Should output 9.x.x
docker --version   # Should output Docker version 25.x.x or later
git --version      # Should output git version 2.40.x or later
```

### Optional (Recommended)

| Tool | Purpose |
|------|---------|
| VS Code | Primary IDE with workspace recommendations |
| Postman / Bruno | API testing |
| TablePlus / DBeaver | PostgreSQL GUI |
| RedisInsight | Redis inspection |

---

## 2. Quick Start

### Step 1: Clone the Repository

```bash
git clone https://github.com/ev-trips-community/ev-trips-community.git
cd ev-trips-community
```

### Step 2: Install Dependencies

```bash
pnpm install
```

pnpm will install all workspace dependencies (all apps and packages) from the monorepo root. This may take 2-4 minutes on first run.

### Step 3: Set Up Environment Variables

Copy the example env files for each app:

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env.local

# Admin
cp apps/admin/.env.example apps/admin/.env.local

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

Then edit each `.env` file to fill in your local values. See [Section 3 — Environment Variables](#3-environment-variables) for a complete reference of every variable.

For a standard local setup, the Docker Compose defaults already match the example env values — you only need to change anything if you deviate from the defaults.

### Step 4: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and MinIO in the background
docker-compose -f docker-compose.dev.yml up -d postgres redis minio
```

Wait ~15 seconds for PostgreSQL to finish initialization, then verify:

```bash
docker-compose -f docker-compose.dev.yml ps
# All three services should show "Up"
```

### Step 5: Run Database Migrations

```bash
pnpm --filter @ev-trips/api migration:run
```

This applies all pending TypeORM migrations, creating the full database schema.

### Step 6: Seed the Database

```bash
pnpm --filter @ev-trips/api seed
```

This populates the database with:
- 10 Saudi cities
- 10 EV brands with key models
- 5 charging stations
- 1 default admin user (`admin@evtrips.sa` / `Admin#123456`)
- 3 sample published trips

### Step 7: Start All Apps in Development Mode

```bash
# Start all apps in parallel (Turborepo manages hot reload)
pnpm dev
```

Or start individual apps (see [Section 4](#4-running-individual-apps)).

### Step 8: Verify Everything is Running

| App | URL | Expected |
|-----|-----|---------|
| API | http://localhost:3001/v1/health | `{"status":"ok"}` |
| API Docs | http://localhost:3001/docs | Swagger UI |
| Web | http://localhost:3000 | Home page |
| Admin | http://localhost:3002 | Admin login |
| MinIO Console | http://localhost:9001 | S3 admin UI |

---

## 3. Environment Variables

### API — `apps/api/.env`

```bash
# ─── App ─────────────────────────────────────────────
NODE_ENV=development
PORT=3001
API_VERSION=v1

# ─── Database ────────────────────────────────────────
# PostgreSQL connection string
DATABASE_URL=postgresql://ev_trips_user:ev_trips_password@localhost:5432/ev_trips_db
# Alternatively, individual params:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=ev_trips_db
# DB_USER=ev_trips_user
# DB_PASSWORD=ev_trips_password
# DB_POOL_SIZE=10

# ─── Redis ────────────────────────────────────────────
REDIS_URL=redis://localhost:6379
# Or individual params:
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=                  # empty in dev

# ─── JWT ──────────────────────────────────────────────
# IMPORTANT: Change these in production! Use long random strings.
JWT_ACCESS_SECRET=dev-access-secret-change-in-production-must-be-at-least-64-chars
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-must-be-at-least-64-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# ─── S3 / MinIO ───────────────────────────────────────
S3_ENDPOINT=http://localhost:9000     # MinIO in dev, blank for AWS S3 in prod
S3_REGION=us-east-1                   # MinIO ignores this but needs a value
S3_BUCKET=ev-trips-media
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_PUBLIC_URL=http://localhost:9000/ev-trips-media   # CDN URL in production

# ─── Email ────────────────────────────────────────────
# For development: use Mailtrap, Mailpit, or MailHog
EMAIL_FROM="EV Trips Community <no-reply@evtrips.sa>"
EMAIL_HOST=smtp.mailtrap.io           # or localhost for Mailpit
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-user
EMAIL_PASS=your-mailtrap-password
# For production with SendGrid:
# EMAIL_HOST=smtp.sendgrid.net
# EMAIL_PORT=587
# EMAIL_USER=apikey
# EMAIL_PASS=your-sendgrid-api-key

# ─── CORS ─────────────────────────────────────────────
WEB_URL=http://localhost:3000
ADMIN_URL=http://localhost:3002

# ─── Rate Limiting ────────────────────────────────────
THROTTLE_TTL=60000        # 1 minute in milliseconds
THROTTLE_LIMIT=200        # requests per TTL window (per user/IP)

# ─── Frontend URLs (for email links) ─────────────────
FRONTEND_URL=http://localhost:3000
VERIFY_EMAIL_URL=http://localhost:3000/verify-email
RESET_PASSWORD_URL=http://localhost:3000/reset-password

# ─── Expo Push (optional in dev) ─────────────────────
EXPO_PUSH_API_URL=https://exp.host/--/api/v2/push/send
EXPO_ACCESS_TOKEN=              # optional, for higher rate limits

# ─── Bull Queue ────────────────────────────────────────
QUEUE_REDIS_URL=redis://localhost:6379
BULL_BOARD_ENABLED=true         # enable Bull Board UI at /api/queues
```

### Web Frontend — `apps/web/.env.local`

```bash
# ─── API ──────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3001/v1

# ─── Mapbox ───────────────────────────────────────────
# Get your token at https://account.mapbox.com
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJj...

# ─── i18n ─────────────────────────────────────────────
NEXT_PUBLIC_DEFAULT_LOCALE=ar

# ─── Media CDN ────────────────────────────────────────
NEXT_PUBLIC_MEDIA_URL=http://localhost:9000/ev-trips-media   # CDN URL in prod

# ─── Analytics (optional) ─────────────────────────────
NEXT_PUBLIC_GA_MEASUREMENT_ID=           # Google Analytics (optional)
NEXT_PUBLIC_HOTJAR_ID=                   # Hotjar (optional)

# ─── Feature Flags (optional) ─────────────────────────
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false
NEXT_PUBLIC_ENABLE_BADGES=true
```

### Admin Dashboard — `apps/admin/.env.local`

```bash
# ─── API ──────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3001/v1

# ─── Media CDN ────────────────────────────────────────
NEXT_PUBLIC_MEDIA_URL=http://localhost:9000/ev-trips-media

# ─── Admin-specific ───────────────────────────────────
NEXT_PUBLIC_ADMIN_POLL_INTERVAL=30000   # stats refresh interval (ms)
```

### Mobile — `apps/mobile/.env`

```bash
# ─── API ──────────────────────────────────────────────
# Use your machine's local IP when running on a real device
# e.g., 192.168.1.5 (run `ipconfig getifaddr en0` on macOS)
API_URL=http://192.168.1.5:3001/v1
# For emulator:
# iOS Simulator: http://localhost:3001/v1
# Android Emulator: http://10.0.2.2:3001/v1

# ─── Media CDN ────────────────────────────────────────
MEDIA_URL=http://192.168.1.5:9000/ev-trips-media

# ─── Mapbox (Mobile) ──────────────────────────────────
MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJj...

# ─── Expo ─────────────────────────────────────────────
EXPO_PROJECT_ID=your-expo-project-id   # from expo.dev
```

---

## 4. Running Individual Apps

### API Only

```bash
pnpm --filter @ev-trips/api dev
# Hot reload via ts-node-dev or NestJS watch mode
# Available at: http://localhost:3001
```

### Web Frontend Only

```bash
pnpm --filter @ev-trips/web dev
# Next.js dev server with hot reload
# Available at: http://localhost:3000
```

### Admin Dashboard Only

```bash
pnpm --filter @ev-trips/admin dev
# Available at: http://localhost:3002
```

### Mobile App

```bash
# Start Expo dev server
pnpm --filter @ev-trips/mobile start

# Then press:
# i — open in iOS Simulator (macOS only)
# a — open in Android Emulator
# w — open in web browser
# Scan QR code — open in Expo Go app on your phone
```

For physical device testing, ensure your phone and development machine are on the same WiFi network, and use your machine's local IP in `API_URL`.

### Run All Apps

```bash
# Turborepo runs all dev servers in parallel
pnpm dev
```

### Build for Production

```bash
# Build all apps
pnpm build

# Build specific app
pnpm --filter @ev-trips/api build
pnpm --filter @ev-trips/web build
pnpm --filter @ev-trips/admin build
```

---

## 5. Database Operations

### Migration Commands

```bash
# Generate a new migration from entity changes
# Replace 'MigrationName' with a descriptive PascalCase name
pnpm --filter @ev-trips/api migration:generate src/database/migrations/MigrationName

# Run all pending migrations
pnpm --filter @ev-trips/api migration:run

# Revert the most recent migration
pnpm --filter @ev-trips/api migration:revert

# Show list of all migrations and their status
pnpm --filter @ev-trips/api migration:show
```

### Creating a New Migration Manually

For complex migrations that TypeORM cannot auto-generate (e.g., data migrations, trigger creation):

```bash
# Generate empty migration file
pnpm --filter @ev-trips/api migration:create src/database/migrations/AddTriggersForSearch
```

Then edit the generated file:

```typescript
// src/database/migrations/1712910000000-AddTriggersForSearch.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTriggersForSearch1712910000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY idx_trips_search_vector
        ON trips USING GIN (search_vector)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_trips_search_vector`);
  }
}
```

### Seeding the Database

```bash
# Run all seeds (cities, brands, models, stations, admin user)
pnpm --filter @ev-trips/api seed

# Run specific seed
pnpm --filter @ev-trips/api seed:cities
pnpm --filter @ev-trips/api seed:brands
pnpm --filter @ev-trips/api seed:admin
```

### Database Reset (Development Only)

```bash
# Drop all tables and re-run migrations + seeds
pnpm --filter @ev-trips/api db:reset
```

WARNING: This destroys all data. Only use in development.

### Connecting to the Development Database

```bash
# Via Docker
docker-compose -f docker-compose.dev.yml exec postgres \
  psql -U ev_trips_user -d ev_trips_db

# Via psql (if installed locally)
psql postgresql://ev_trips_user:ev_trips_password@localhost:5432/ev_trips_db
```

Useful psql commands:
```sql
\dt                          -- list all tables
\d trips                     -- describe trips table (columns, indexes, constraints)
SELECT COUNT(*) FROM trips;  -- count rows
\q                           -- quit
```

### Viewing Logs

```bash
# PostgreSQL logs
docker-compose -f docker-compose.dev.yml logs -f postgres

# Redis logs
docker-compose -f docker-compose.dev.yml logs -f redis

# API logs (when running with pnpm dev)
# Logs appear directly in the terminal
```

---

## 6. Testing Strategy

### Overview

| Layer | Test Type | Tool | Location |
|-------|----------|------|---------|
| Services (API) | Unit tests | Jest | `apps/api/src/**/*.spec.ts` |
| Controllers (API) | Integration tests | Jest + Supertest | `apps/api/test/*.e2e-spec.ts` |
| Web components | Component tests | Jest + Testing Library | `apps/web/src/**/*.test.tsx` |
| Shared utilities | Unit tests | Jest | `packages/shared/src/**/*.spec.ts` |

### Running Tests

```bash
# Run all tests (all workspaces)
pnpm test

# Run tests for a specific workspace
pnpm --filter @ev-trips/api test
pnpm --filter @ev-trips/web test
pnpm --filter @ev-trips/shared test

# Run with coverage
pnpm --filter @ev-trips/api test:cov

# Run in watch mode (TDD)
pnpm --filter @ev-trips/api test:watch

# Run E2E tests (requires running database)
pnpm --filter @ev-trips/api test:e2e
```

### Unit Test Example (Service)

```typescript
// apps/api/src/modules/trips/trips.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TripsService } from './trips.service';
import { Trip } from './entities/trip.entity';

describe('TripsService', () => {
  let service: TripsService;
  const mockTripsRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: getRepositoryToken(Trip),
          useValue: mockTripsRepository,
        },
        // ... other mocked providers
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    jest.clearAllMocks();
  });

  describe('findBySlug', () => {
    it('should return a trip when found', async () => {
      const mockTrip = { id: 'uuid', slug: 'test-slug', status: 'published' };
      mockTripsRepository.findOne.mockResolvedValue(mockTrip);

      const result = await service.findBySlug('test-slug');
      expect(result).toEqual(mockTrip);
      expect(mockTripsRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-slug', status: 'published' },
      });
    });

    it('should throw NotFoundException when trip not found', async () => {
      mockTripsRepository.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('nonexistent')).rejects.toThrow('TRIP_NOT_FOUND');
    });
  });
});
```

### E2E Test Example (Controller)

```typescript
// apps/api/test/auth.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './helpers/create-test-app';
import { seedTestDatabase } from './helpers/seed';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await seedTestDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/login', () => {
    it('should return tokens for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Test#Pass123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrong-password' })
        .expect(401);
    });
  });
});
```

### Web Component Test Example

```typescript
// apps/web/src/components/trips/TripCard.test.tsx
import { render, screen } from '@testing-library/react';
import { TripCard } from './TripCard';

const mockTrip = {
  id: 'uuid',
  slug: 'riyadh-to-dammam-tesla-model-y-x1y2z3',
  title: 'Test Trip',
  departureCityNameAr: 'الرياض',
  destinationCityNameAr: 'الدمام',
  vehicleBrandName: 'Tesla',
  vehicleModelName: 'Model Y',
  totalDistanceKm: 410,
  helpfulCount: 42,
  coverImageUrl: null,
  author: { username: 'test_user', displayName: 'Test User', avatarUrl: null },
};

describe('TripCard', () => {
  it('renders trip title', () => {
    render(<TripCard trip={mockTrip} locale="ar" />);
    expect(screen.getByText('Test Trip')).toBeInTheDocument();
  });

  it('renders vehicle information', () => {
    render(<TripCard trip={mockTrip} locale="ar" />);
    expect(screen.getByText(/Tesla/)).toBeInTheDocument();
  });
});
```

### Test Database

E2E tests use a separate test database (`ev_trips_test_db`). The `createTestApp()` helper sets `DATABASE_URL` to the test DB and runs migrations before the test suite.

```bash
# Create test database (one-time setup)
docker-compose -f docker-compose.dev.yml exec postgres \
  psql -U ev_trips_user -d postgres \
  -c "CREATE DATABASE ev_trips_test_db;"
```

---

## 7. Code Style & Conventions

### TypeScript Configuration

- **Strict mode enabled** across all workspaces (`strict: true` in tsconfig.base.json)
- No implicit `any` — always type function parameters and return values
- Prefer `interface` for object shapes, `type` for unions/intersections/utility types
- Use `readonly` on immutable properties

### ESLint & Prettier

Configuration lives at the repo root. Run:

```bash
# Lint all workspaces
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix

# Format with Prettier
pnpm format
```

Pre-commit hooks (via Husky + lint-staged) run linting and formatting automatically on staged files.

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| NestJS modules | `kebab-case.module.ts` | `trips.module.ts` |
| NestJS controllers | `kebab-case.controller.ts` | `trips.controller.ts` |
| NestJS services | `kebab-case.service.ts` | `trips.service.ts` |
| TypeORM entities | `kebab-case.entity.ts` | `trip.entity.ts` |
| DTOs | `kebab-case.dto.ts` | `create-trip.dto.ts` |
| React components | `PascalCase.tsx` | `TripCard.tsx` |
| React hooks | `useKebabCase.ts` | `useTripSearch.ts` |
| Utility files | `kebab-case.ts` | `slug-utils.ts` |
| Test files | `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e), `*.test.tsx` (component) | |

### Module Structure (NestJS)

Each feature module should follow this structure:

```
modules/trips/
├── trips.module.ts          # Module declaration, imports, exports
├── trips.controller.ts      # HTTP handlers, route decorators
├── trips.service.ts         # Business logic
├── trips.service.spec.ts    # Unit tests
├── dto/
│   ├── create-trip.dto.ts
│   ├── update-trip.dto.ts
│   └── trip-response.dto.ts
├── entities/
│   ├── trip.entity.ts
│   ├── trip-stop.entity.ts
│   └── trip-media.entity.ts
└── index.ts                 # Barrel exports
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer: BREAKING CHANGE, Closes #issue]
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `style` — Formatting, no logic change
- `refactor` — Code restructuring without feature change
- `test` — Adding or updating tests
- `chore` — Build tools, dependencies, config
- `perf` — Performance improvements

**Examples:**
```
feat(trips): add route insights aggregation endpoint
fix(auth): correct refresh token expiry check
docs(api): add missing request body examples
chore(deps): update TypeORM to 0.3.20
refactor(trips): extract vehicle snapshot logic into helper
test(auth): add e2e tests for refresh token rotation
```

### API Design Conventions

- Use `camelCase` in JSON request/response bodies
- Use `snake_case` in database columns (auto-converted by TypeORM naming strategy)
- Always return the standard envelope `{ success, data, meta }`
- Use HTTP status codes correctly (201 for creates, 200 for updates/reads, 204 for deletes with no body)
- Route parameters for resource identity: `/trips/:id`
- Query parameters for filtering/sorting: `?status=published&sort=published_at|-1`
- PATCH for partial updates (not PUT)

### Component Conventions (React)

- Each component in its own file and directory (co-located styles, tests)
- Props interface defined above the component function
- `export default` for page components, named exports for reusable components
- Hooks extracted to `useXxx.ts` files when logic is shared
- i18n: use `useTranslations()` from `next-intl` — never hardcode UI strings

---

## 8. Common Issues & Solutions

### Issue 1: `pnpm install` fails with peer dependency errors

**Symptom:** `npm ERR! ERESOLVE unable to resolve dependency tree`

**Solution:**
```bash
# Clear pnpm cache and reinstall
pnpm store prune
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

If the error persists, check that your Node.js version is 20+ and pnpm version is 9+.

---

### Issue 2: Database connection refused

**Symptom:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check if PostgreSQL container is running
docker-compose -f docker-compose.dev.yml ps

# If it shows "Exit" or is not listed:
docker-compose -f docker-compose.dev.yml up -d postgres

# Check PostgreSQL logs for startup errors
docker-compose -f docker-compose.dev.yml logs postgres

# Wait for PostgreSQL to be ready (can take 10-20 seconds on first boot)
docker-compose -f docker-compose.dev.yml exec postgres \
  pg_isready -U ev_trips_user -d ev_trips_db
```

Also verify your `DATABASE_URL` in `apps/api/.env` matches the Docker Compose configuration.

---

### Issue 3: Migrations fail with "relation does not exist"

**Symptom:** `ERROR: relation "migrations" does not exist` or TypeORM migration errors

**Solution:**
```bash
# Ensure you're running migrations, not synchronize
# Check that apps/api/src/database/datasource.ts has synchronize: false

# If the DB is empty (first time), run migrations from scratch:
pnpm --filter @ev-trips/api migration:run

# If schema is out of sync with a fresh DB:
pnpm --filter @ev-trips/api db:reset   # dev only
```

---

### Issue 4: MinIO / S3 upload fails with CORS error

**Symptom:** `Access to XMLHttpRequest at 'http://localhost:9000/...' has been blocked by CORS policy`

**Solution:** Configure MinIO CORS policy:

```bash
# Install MinIO client
brew install minio/stable/mc   # macOS

# Configure mc to point to local MinIO
mc alias set local http://localhost:9000 minioadmin minioadmin

# Set CORS policy on bucket
mc anonymous set-json /dev/stdin local/ev-trips-media <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": ["*"]},
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": ["arn:aws:s3:::ev-trips-media/*"]
  }]
}
EOF
```

Also ensure MinIO CORS is configured in `docker-compose.dev.yml`:
```yaml
minio:
  environment:
    MINIO_CORS_ALLOW_ORIGIN: 'http://localhost:3000,http://localhost:3001'
```

---

### Issue 5: `pnpm dev` shows "Turborepo: package not found in workspace"

**Symptom:** Turborepo cannot find a workspace package

**Solution:**
```bash
# Check that all package.json files have the correct "name" field
cat apps/api/package.json | grep '"name"'
# Should be "@ev-trips/api"

cat packages/shared/package.json | grep '"name"'
# Should be "@ev-trips/shared"

# Reinstall to regenerate pnpm-lock.yaml
pnpm install
```

Also verify `pnpm-workspace.yaml` includes the correct patterns:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

### Issue 6: Mobile app cannot connect to API on physical device

**Symptom:** Expo app shows network error when running on a physical device

**Solution:**
The iOS Simulator and Android Emulator can use `localhost`, but a real physical device cannot — it must use your development machine's local IP address.

```bash
# Find your machine's local IP (macOS)
ipconfig getifaddr en0
# e.g., 192.168.1.42

# Find your machine's local IP (Linux)
hostname -I | awk '{print $1}'
```

Update `apps/mobile/.env`:
```bash
API_URL=http://192.168.1.42:3001/v1    # replace with your IP
MEDIA_URL=http://192.168.1.42:9000/ev-trips-media
```

Also ensure your API server is binding to `0.0.0.0` (not just `127.0.0.1`):
```typescript
// apps/api/src/main.ts
await app.listen(3001, '0.0.0.0');   // bind to all interfaces
```

---

### Issue 7: TypeScript build errors in `packages/shared`

**Symptom:** `error TS2307: Cannot find module '@ev-trips/shared'`

**Solution:**
```bash
# Build the shared package first (it must be compiled before apps consume it)
pnpm --filter @ev-trips/shared build

# Or run the full build in dependency order (Turborepo handles this)
pnpm build

# In development, ensure packages/shared has a "dev" script
# that watches and recompiles on change:
pnpm --filter @ev-trips/shared dev &
pnpm --filter @ev-trips/api dev
```

Alternatively, update `tsconfig.json` in the apps to use TypeScript project references pointing to `packages/shared/src/index.ts` directly (no compilation step needed in dev).

---

*End of Development Guide — EV Trips Community v1.0*
