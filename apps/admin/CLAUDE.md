# Admin Agent — Dashboard

## Stack
- Next.js 14 App Router (standalone)
- Tailwind CSS
- State: Zustand (`src/store/`)
- pnpm workspace — root: `../../`

## Purpose
Internal dashboard for moderators and admins to manage the platform.

## RBAC — who can access what
| Role         | Access                                      |
|--------------|---------------------------------------------|
| moderator    | Review & moderate trips, comments, reports  |
| admin        | All above + manage users, charging stations |
| super_admin  | Full access including role management       |

## File structure
```
app/                  ← Admin pages (dashboard, users, trips, reports…)
components/           ← Admin-specific UI components
hooks/                ← Custom hooks
lib/                  ← API client (calls the NestJS API)
store/                ← Zustand stores
types/                ← TypeScript types
```

## Rules
- Every page must check role before rendering sensitive actions
- Trip moderation actions: `approve` | `reject` | `hide` | `archive`
- API base URL from env: `NEXT_PUBLIC_API_URL`
- Use Server Components where possible; `"use client"` only when needed
