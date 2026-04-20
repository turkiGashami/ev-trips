# ─────────────────────────────────────────────────────────────────────────────
# EV Trips Community — NestJS API Dockerfile
# Multi-stage build: base → deps → development → builder → production
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ─────────────────────────────────────────
# Stage: deps — install all dependencies
# ─────────────────────────────────────────
FROM base AS deps

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────
# Stage: development — for docker-compose.dev.yml
# ─────────────────────────────────────────
FROM deps AS development

COPY . .

# Generate Prisma client
RUN pnpm --filter @ev-trips/api exec prisma generate

EXPOSE 3001 9229

CMD ["pnpm", "--filter", "@ev-trips/api", "dev"]

# ─────────────────────────────────────────
# Stage: builder — compile TypeScript
# ─────────────────────────────────────────
FROM deps AS builder

COPY . .

# Generate Prisma client
RUN pnpm --filter @ev-trips/api exec prisma generate

# Build shared package first, then API
RUN pnpm --filter @ev-trips/shared build
RUN pnpm --filter @ev-trips/api build

# ─────────────────────────────────────────
# Stage: production — lean runtime image
# ─────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy workspace manifests and lockfile
COPY --chown=nestjs:nodejs package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --chown=nestjs:nodejs apps/api/package.json ./apps/api/
COPY --chown=nestjs:nodejs packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist

# Copy Prisma schema and generated client
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Run database migrations then start app
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/main.js"]
