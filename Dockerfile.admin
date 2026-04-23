# ─────────────────────────────────────────────────────────────────────────────
# EV Trips Community — Admin Dashboard Dockerfile
# Multi-stage build optimised for Next.js standalone output
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
COPY apps/admin/package.json ./apps/admin/

RUN pnpm install --frozen-lockfile

# ─────────────────────────────────────────
# Stage: builder
# ─────────────────────────────────────────
FROM deps AS builder

COPY . .

# Build args for Next.js public env vars
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js admin app
RUN pnpm --filter ev-car-trip-admin build

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
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public

USER nextjs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3002 || exit 1

CMD ["node", "apps/admin/server.js"]
