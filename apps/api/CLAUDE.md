# API Agent — NestJS Backend

## Stack
- NestJS + TypeORM + PostgreSQL + Redis
- pnpm workspace — root: `../../`

## Modules
`auth` · `users` · `trips` · `vehicles` · `charging-stations` · `comments` · `notifications` · `media` · `reports` · `admin` · `mail` · `lookup`

## Patterns

### Response format
```ts
// Single: { success, data, message }
// Paginated: { data: [], meta: { page, limit, total, totalPages } }
```

### Auth
- JWT access token: 15min
- Refresh token: 30d, hashed, stored in DB
- RBAC roles: `guest` | `user` | `moderator` | `admin` | `super_admin`

### Trip lifecycle
`draft` → `pending_review` → `published` / `rejected` / `hidden` / `archived`

### File structure per module
```
modules/<name>/
  <name>.module.ts
  <name>.controller.ts
  <name>.service.ts
  dto/
  entities/   (or use shared entity from src/entities/)
```

## Rules
- Use `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth` on every controller
- DTOs must use `class-validator` decorators
- Never expose passwords or hashed tokens in responses
- Use `ConfigService` for env vars — no `process.env` direct access
- Transactions via `QueryRunner` for multi-step DB operations
