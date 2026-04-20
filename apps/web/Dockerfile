# ─────────────────────────────────────────────────────────────────────────────
# EV Trips Community — Next.js Web App Dockerfile
# Multi-stage build optimised for standalone output mode
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ─────────────────────────────────────────
# Stage: deps
# ─────────────────────────────────────────
FROM base AS deps

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────
# Stage: builder
# ─────────────────────────────────────────
FROM deps AS builder

COPY . .

# Build args for Next.js public env vars
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_KEY

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_GOOGLE_MAPS_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_KEY}
ENV NEXT_TELEMETRY_DISABLED=1

# Build shared package first
RUN pnpm --filter @ev-trips/shared build

# Build the Next.js app
RUN pnpm --filter @ev-trips/web build

# ─────────────────────────────────────────
# Stage: production — uses Next.js standalone
# ─────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
