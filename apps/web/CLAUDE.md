# Web Agent — Next.js Frontend

## Stack
- Next.js 14 App Router
- Tailwind CSS — Arabic RTL first
- i18n: `src/i18n/`
- State: Zustand (`src/store/`)
- pnpm workspace — root: `../../`

## RTL Rules
Always use logical properties — never `left`/`right`:
```
margin:  ms- me-      (instead of ml- mr-)
padding: ps- pe-      (instead of pl- pr-)
position: start- end- (instead of left- right-)
text:    text-start   (instead of text-left)
```

## Colors
- Primary: `#22c55e` (green-500)
- Danger:  `#ef4444` (red-500)

## File structure
```
app/                  ← Next.js App Router pages
components/           ← Reusable UI components
hooks/                ← Custom React hooks
i18n/                 ← Arabic/English translations
lib/                  ← API client, utils
store/                ← Zustand stores
types/                ← TypeScript types
```

## API calls
- All API calls go through `src/lib/` — never fetch directly in components
- Handle `{ success, data, message }` response shape

## Rules
- Arabic is the primary language — all UI text via i18n keys, never hardcoded
- Use `dir="rtl"` aware components
- Server Components by default — use `"use client"` only when needed (event handlers, hooks, browser APIs)
- No `left`/`right` CSS — use logical properties
