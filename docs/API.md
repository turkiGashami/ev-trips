# EV Trips Community — API Reference

> **Document Version:** 1.0  
> **Last Updated:** April 2026  
> **API Version:** v1  
> **Format:** REST / JSON  
> **OpenAPI Spec:** Available at `GET /api/docs` (Swagger UI)

---

## Table of Contents

1. [Base URL & Versioning](#1-base-url--versioning)
2. [Authentication](#2-authentication)
3. [Response Format](#3-response-format)
4. [Rate Limiting](#4-rate-limiting)
5. [Endpoints](#5-endpoints)
6. [Filtering & Sorting Reference](#6-filtering--sorting-reference)
7. [File Upload Flow](#7-file-upload-flow)
8. [Error Codes Reference](#8-error-codes-reference)

---

## 1. Base URL & Versioning

### Base URL

| Environment | Base URL |
|-------------|---------|
| Production | `https://api.evtrips.sa/v1` |
| Staging | `https://api.staging.evtrips.sa/v1` |
| Development | `http://localhost:3001/v1` |

All endpoints below are relative to the base URL. For example, `POST /auth/login` is `POST https://api.evtrips.sa/v1/auth/login`.

### API Versioning

The API uses URI versioning (`/v1/`). When breaking changes are introduced, a new version prefix is released. The previous version remains active for a deprecation period of 6 months with appropriate `Deprecation` headers.

### Swagger / OpenAPI

The interactive API documentation is available at:
- Development: `http://localhost:3001/docs`
- Production: `https://api.evtrips.sa/docs` (access requires admin auth in production)

---

## 2. Authentication

### Token Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Register or Login                                        │
│     POST /auth/register  OR  POST /auth/login               │
│                                                              │
│  2. Receive token pair                                       │
│     { accessToken: "eyJ...", refreshToken: "abc123..." }    │
│                                                              │
│  3. Use access token on all protected requests              │
│     Authorization: Bearer eyJ...                            │
│     (valid for 15 minutes)                                   │
│                                                              │
│  4. When access token expires, refresh                       │
│     POST /auth/refresh  { refreshToken: "abc123..." }       │
│     → New accessToken + new refreshToken                     │
│     (old refreshToken is invalidated — rotation)            │
│                                                              │
│  5. On logout, revoke refresh token                         │
│     POST /auth/logout  { refreshToken: "abc123..." }        │
└─────────────────────────────────────────────────────────────┘
```

### Authorization Header

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

### Auth Levels

| Level | Meaning |
|-------|---------|
| `Public` | No authentication required |
| `Auth` | Valid access token required |
| `Auth + Verified` | Auth + email must be verified |
| `Admin` | Auth + role must be `admin` or `super_admin` |
| `SuperAdmin` | Auth + role must be `super_admin` |

### Auth Error Responses

```json
// 401 — No token or invalid token
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 401 — Token expired
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired. Please refresh."
  }
}

// 403 — Authenticated but insufficient role
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action"
  }
}
```

---

## 3. Response Format

### Success Response Envelope

All successful responses follow this structure:

```json
{
  "success": true,
  "data": { ... },         // response payload (object or array)
  "meta": { ... }          // optional metadata (pagination, counts)
}
```

### Error Response Envelope

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",           // machine-readable constant
    "message": "Human-readable message",
    "details": [                    // optional — validation errors
      {
        "field": "email",
        "message": "must be a valid email address"
      }
    ]
  }
}
```

### Pagination Response Structure

Paginated list endpoints include:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 342,
    "page": 1,
    "limit": 20,
    "totalPages": 18,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Query parameters for pagination: `?page=1&limit=20` (default: page=1, limit=20, max limit=50)

---

## 4. Rate Limiting

### Limits Per Endpoint Group

| Endpoint Group | Auth Level | Requests | Window |
|----------------|------------|----------|--------|
| `POST /auth/register` | Public | 3 | 1 hour |
| `POST /auth/login` | Public | 10 | 15 min |
| `POST /auth/refresh` | Public | 20 | 15 min |
| `POST /auth/forgot-password` | Public | 5 | 1 hour |
| `GET /trips` | Public | 100 | 1 min |
| `GET /trips` | Auth | 300 | 1 min |
| `POST /trips` | Auth | 10 | 1 hour |
| `POST /upload/*` | Auth | 20 | 1 hour |
| `POST /reports` | Auth | 5 | 1 hour |
| `GET /admin/*` | Admin | 500 | 1 min |
| All other `GET` | Public | 60 | 1 min |
| All other `GET` | Auth | 200 | 1 min |
| All other `POST/PATCH/DELETE` | Auth | 60 | 1 min |

### Rate Limit Headers

Every response includes:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1712930400
```

When the limit is exceeded, a `429 Too Many Requests` response is returned:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please wait before trying again.",
    "retryAfter": 42
  }
}
```

---

## 5. Endpoints

---

### AUTH ENDPOINTS

---

#### `POST /auth/register`

Register a new user account.

**Auth:** Public  
**Rate Limit:** 3 requests / 1 hour per IP

**Request Body:**
```json
{
  "username": "turki_ev",
  "email": "turki@example.com",
  "password": "Secure#Pass123",
  "displayName": "Turki Al-Gashami",
  "displayNameAr": "تركي القشامي"
}
```

**Field Constraints:**
- `username`: 3-50 chars, alphanumeric + hyphens + underscores, must be unique
- `email`: valid email format, must be unique
- `password`: min 8 chars, must contain uppercase, lowercase, number, special char
- `displayName`: 2-100 chars
- `displayNameAr`: optional, 2-100 chars

**Success Response — `201 Created`:**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful. Please check your email to verify your account.",
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "username": "turki_ev",
      "email": "turki@example.com",
      "displayName": "Turki Al-Gashami",
      "displayNameAr": "تركي القشامي",
      "role": "user",
      "isEmailVerified": false,
      "createdAt": "2026-04-12T10:00:00.000Z"
    }
  }
}
```

**Validation Error Response — `400 Bad Request`:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "email must be a valid email address"
      },
      {
        "field": "password",
        "message": "password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      }
    ]
  }
}
```

**Conflict Response — `409 Conflict`:**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email address already exists"
  }
}
```

---

#### `POST /auth/login`

Authenticate with email and password.

**Auth:** Public  
**Rate Limit:** 10 requests / 15 min per IP

**Request Body:**
```json
{
  "email": "turki@example.com",
  "password": "Secure#Pass123"
}
```

**Success Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMWIyYzNkNC1lNWY2LTc4OTAtYWJjZC1lZjEyMzQ1Njc4OTAiLCJlbWFpbCI6InR1cmtpQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MTI5MTI0MDAsImV4cCI6MTcxMjkxMzMwMH0.signature",
    "refreshToken": "7f3d9a1b2c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "username": "turki_ev",
      "email": "turki@example.com",
      "displayName": "Turki Al-Gashami",
      "displayNameAr": "تركي القشامي",
      "avatarUrl": "https://media.evtrips.sa/avatars/a1b2c3d4/avatar-1712900000000.jpg",
      "role": "user",
      "isEmailVerified": true,
      "tripCount": 12,
      "followerCount": 45,
      "followingCount": 23,
      "createdAt": "2026-01-15T08:00:00.000Z"
    }
  }
}
```

**Invalid Credentials — `401 Unauthorized`:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

**Account Banned — `403 Forbidden`:**
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_BANNED",
    "message": "Your account has been suspended. Please contact support."
  }
}
```

---

#### `GET /auth/me`

Get the currently authenticated user's full profile.

**Auth:** Auth  
**Rate Limit:** Standard

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "turki_ev",
    "email": "turki@example.com",
    "displayName": "Turki Al-Gashami",
    "displayNameAr": "تركي القشامي",
    "avatarUrl": "https://media.evtrips.sa/avatars/a1b2c3d4/avatar-1712900000000.jpg",
    "bio": "EV enthusiast and long-distance driver. Tesla Model Y owner.",
    "bioAr": "عاشق السيارات الكهربائية وسائق مسافات طويلة. أملك تيسلا موديل واي.",
    "role": "user",
    "isEmailVerified": true,
    "isBanned": false,
    "tripCount": 12,
    "followerCount": 45,
    "followingCount": 23,
    "badges": [
      { "type": "first_trip", "awardedAt": "2026-01-20T12:00:00.000Z" },
      { "type": "ten_trips",  "awardedAt": "2026-03-05T09:30:00.000Z" }
    ],
    "notificationSettings": {
      "emailEnabled": true,
      "pushEnabled": true
    },
    "lastSeenAt": "2026-04-12T09:55:00.000Z",
    "createdAt": "2026-01-15T08:00:00.000Z",
    "updatedAt": "2026-04-10T14:22:00.000Z"
  }
}
```

---

#### `POST /auth/refresh`

Refresh access token using a valid refresh token.

**Auth:** Public (refresh token in body)  
**Rate Limit:** 20 requests / 15 min

**Request Body:**
```json
{
  "refreshToken": "7f3d9a1b2c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0"
}
```

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f",
    "expiresIn": 900
  }
}
```

**Invalid/Expired Refresh Token — `401`:**
```json
{
  "success": false,
  "error": {
    "code": "REFRESH_TOKEN_INVALID",
    "message": "Refresh token is invalid or has expired. Please log in again."
  }
}
```

---

#### `POST /auth/logout`

Revoke the current refresh token.

**Auth:** Auth

**Request Body:**
```json
{
  "refreshToken": "7f3d9a1b2c4e5f6a7b8c9d0e1f2a3b4c..."
}
```

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": { "message": "Successfully logged out" }
}
```

---

#### `POST /auth/forgot-password`

Request a password reset email.

**Auth:** Public  
**Rate Limit:** 5 requests / 1 hour per IP

**Request Body:**
```json
{ "email": "turki@example.com" }
```

**Response — `200 OK`** (always 200 regardless of whether email exists — prevents user enumeration):
```json
{
  "success": true,
  "data": {
    "message": "If an account exists with this email, you will receive a password reset link shortly."
  }
}
```

---

#### `POST /auth/reset-password`

Reset password using the token from the reset email.

**Auth:** Public

**Request Body:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "newPassword": "NewSecure#Pass456"
}
```

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": { "message": "Password has been reset successfully. Please log in with your new password." }
}
```

---

#### `GET /auth/verify-email?token={token}`

Verify user's email address from the verification link.

**Auth:** Public

**Query Parameters:**
- `token` (string, required) — JWT token from verification email

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully. You can now access all features.",
    "user": { "id": "...", "email": "...", "isEmailVerified": true }
  }
}
```

---

### TRIP ENDPOINTS

---

#### `GET /trips`

Search and list published trips with optional filters.

**Auth:** Public (Auth provides additional context like isFavorited)  
**Rate Limit:** 100/min (guest), 300/min (auth)

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `from` | string | Departure city slug | `riyadh` |
| `to` | string | Destination city slug | `dammam` |
| `fromId` | UUID | Departure city ID (alternative to slug) | |
| `toId` | UUID | Destination city ID | |
| `brandId` | UUID | Filter by vehicle brand | |
| `modelId` | UUID | Filter by vehicle model | |
| `year` | number | Filter by vehicle year | `2023` |
| `q` | string | Full-text search query | `طريق الملك` |
| `sort` | string | Sort field and direction | `published_at\|-1` |
| `page` | number | Page number (default: 1) | `2` |
| `limit` | number | Items per page (default: 20, max: 50) | `20` |

**Example Request:**
```
GET /v1/trips?from=riyadh&to=dammam&brandId=tesla-uuid&sort=published_at|-1&page=1&limit=20
```

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "slug": "riyadh-to-dammam-tesla-model-y-a3b4c5d6",
      "title": "رحلة الرياض إلى الدمام في تيسلا موديل Y",
      "description": "رحلة ممتعة من الرياض إلى الدمام عبر الطريق السريع...",
      "status": "published",
      "author": {
        "id": "a1b2c3d4-...",
        "username": "turki_ev",
        "displayName": "Turki Al-Gashami",
        "displayNameAr": "تركي القشامي",
        "avatarUrl": "https://media.evtrips.sa/avatars/.../avatar.jpg"
      },
      "vehicleBrandName": "Tesla",
      "vehicleModelName": "Model Y",
      "vehicleYear": 2023,
      "vehicleBatteryKwh": 82.0,
      "departureCityName": "Riyadh",
      "departureCityNameAr": "الرياض",
      "destinationCityName": "Dammam",
      "destinationCityNameAr": "الدمام",
      "totalDistanceKm": 410.5,
      "energyConsumedKwh": 62.3,
      "startBatteryPct": 98,
      "endBatteryPct": 12,
      "durationMinutes": 245,
      "avgSpeedKmh": 100.5,
      "coverImageUrl": "https://media.evtrips.sa/trips/b2c3d4e5/cover-1712910000000.jpg",
      "viewCount": 1240,
      "favoriteCount": 87,
      "commentCount": 23,
      "helpfulCount": 156,
      "isFavorited": false,
      "publishedAt": "2026-03-15T14:30:00.000Z",
      "tripDate": "2026-03-14"
    }
  ],
  "meta": {
    "total": 87,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

#### `GET /trips/route-insights`

Get aggregated statistics for all trips between two cities.

**Auth:** Public  
**Rate Limit:** Standard  
**Cache:** 1 hour (Redis)

**Query Parameters:**
- `from` (string, required) — Departure city slug
- `to` (string, required) — Destination city slug

**Example Request:**
```
GET /v1/trips/route-insights?from=riyadh&to=dammam
```

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "route": {
      "departureCity": {
        "id": "city-uuid-riyadh",
        "nameAr": "الرياض",
        "nameEn": "Riyadh",
        "slug": "riyadh"
      },
      "destinationCity": {
        "id": "city-uuid-dammam",
        "nameAr": "الدمام",
        "nameEn": "Dammam",
        "slug": "dammam"
      }
    },
    "stats": {
      "totalTrips": 87,
      "uniqueContributors": 64,
      "firstTripDate": "2025-06-01T00:00:00.000Z",
      "lastTripDate": "2026-04-10T00:00:00.000Z",
      "distance": {
        "avgKm": 410.8,
        "minKm": 390.2,
        "maxKm": 435.1
      },
      "energy": {
        "avgKwh": 63.4,
        "avgKwhPerKm": 0.1544
      },
      "battery": {
        "avgUsedPct": 83.2,
        "minEndPct": 4
      },
      "time": {
        "avgMinutes": 248,
        "minMinutes": 210,
        "maxMinutes": 310
      },
      "speed": {
        "avgKmh": 99.3,
        "maxRecordedKmh": 140
      },
      "conditions": {
        "tripsWithHeavyAc": 71,
        "avgTempCelsius": 38.2
      }
    },
    "topVehicles": [
      {
        "brandName": "Tesla",
        "modelName": "Model Y",
        "tripCount": 34,
        "avgKwhPerKm": 0.1510
      },
      {
        "brandName": "Tesla",
        "modelName": "Model 3",
        "tripCount": 18,
        "avgKwhPerKm": 0.1422
      },
      {
        "brandName": "Hyundai",
        "modelName": "IONIQ 5",
        "tripCount": 12,
        "avgKwhPerKm": 0.1680
      },
      {
        "brandName": "BYD",
        "modelName": "ATTO 3",
        "tripCount": 9,
        "avgKwhPerKm": 0.1750
      },
      {
        "brandName": "Kia",
        "modelName": "EV6",
        "tripCount": 7,
        "avgKwhPerKm": 0.1550
      }
    ],
    "recentTrips": [
      {
        "id": "b2c3d4e5-...",
        "slug": "riyadh-to-dammam-tesla-model-y-a3b4c5d6",
        "title": "رحلة الرياض إلى الدمام في تيسلا موديل Y",
        "coverImageUrl": "https://media.evtrips.sa/trips/.../cover.jpg",
        "author": { "username": "turki_ev", "displayName": "Turki Al-Gashami" },
        "publishedAt": "2026-04-10T09:00:00.000Z"
      }
    ]
  }
}
```

---

#### `GET /trips/:slug`

Get full trip detail by slug.

**Auth:** Public (Auth unlocks `isFavorited`, `isReacted` fields)

**Path Parameter:**
- `slug` (string) — Trip slug (URL-friendly identifier)

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "slug": "riyadh-to-dammam-tesla-model-y-a3b4c5d6",
    "title": "رحلة الرياض إلى الدمام في تيسلا موديل Y",
    "description": "رحلة ممتعة من الرياض إلى الدمام عبر الطريق السريع الجديد...",
    "status": "published",
    "author": {
      "id": "a1b2c3d4-...",
      "username": "turki_ev",
      "displayName": "Turki Al-Gashami",
      "displayNameAr": "تركي القشامي",
      "avatarUrl": "https://media.evtrips.sa/avatars/.../avatar.jpg",
      "tripCount": 12,
      "isFollowing": false
    },
    "vehicle": {
      "brandId": "tesla-brand-uuid",
      "modelId": "model-y-uuid",
      "brandName": "Tesla",
      "modelName": "Model Y",
      "year": 2023,
      "batteryKwh": 82.0,
      "rangeKm": 533
    },
    "route": {
      "departureCity": {
        "id": "city-uuid-riyadh",
        "nameAr": "الرياض",
        "nameEn": "Riyadh",
        "slug": "riyadh"
      },
      "destinationCity": {
        "id": "city-uuid-dammam",
        "nameAr": "الدمام",
        "nameEn": "Dammam",
        "slug": "dammam"
      }
    },
    "tripDate": "2026-03-14",
    "performance": {
      "totalDistanceKm": 410.5,
      "energyConsumedKwh": 62.3,
      "kwhPer100km": 15.18,
      "startBatteryPct": 98,
      "endBatteryPct": 12,
      "batteryUsedPct": 86,
      "durationMinutes": 245,
      "avgSpeedKmh": 100.5,
      "maxSpeedKmh": 130.0,
      "outsideTempCelsius": 40.5,
      "acUsage": "high"
    },
    "stops": [
      {
        "id": "stop-uuid-1",
        "orderIndex": 1,
        "cityName": "Al Khobar",
        "cityNameAr": "الخبر",
        "stationName": "Tesla Supercharger — Al Khobar",
        "chargerType": "tesla_supercharger",
        "chargeFromPct": 12,
        "chargeToPct": 80,
        "chargeDurationMinutes": 45,
        "costSar": null,
        "isFreeCharging": true,
        "notes": "الشاحن مجاني لكن يحتاج حجز",
        "latitude": 26.2172,
        "longitude": 50.1971
      }
    ],
    "media": [
      {
        "id": "media-uuid-1",
        "mediaType": "image",
        "url": "https://media.evtrips.sa/trips/b2c3d4e5/media-x1y2z3.jpg",
        "thumbnailUrl": null,
        "caption": "لحظة وصول الدمام",
        "captionAr": "لحظة وصول الدمام",
        "orderIndex": 0
      }
    ],
    "engagement": {
      "viewCount": 1240,
      "favoriteCount": 87,
      "commentCount": 23,
      "helpfulCount": 156,
      "isFavorited": false,
      "isHelpful": false,
      "isInspiring": false
    },
    "publishedAt": "2026-03-15T14:30:00.000Z",
    "createdAt": "2026-03-14T20:00:00.000Z",
    "updatedAt": "2026-03-15T14:30:00.000Z"
  }
}
```

**Not Found — `404`:**
```json
{
  "success": false,
  "error": {
    "code": "TRIP_NOT_FOUND",
    "message": "Trip not found"
  }
}
```

---

#### `POST /trips`

Create a new trip (starts as draft).

**Auth:** Auth + Verified

**Request Body:**
```json
{
  "title": "رحلة الرياض إلى الدمام في تيسلا موديل Y - صيف 2026",
  "description": "رحلة ممتعة قمت بها من الرياض إلى الدمام في أحد أيام الصيف الحارة. كانت درجة الحرارة 42 درجة مئوية والمكيف يعمل على أقصى طاقته. سأشارككم تفاصيل الرحلة كاملة بما في ذلك نقاط الشحن والاستهلاك الحقيقي للطاقة.",
  "vehicleId": "vehicle-uuid",
  "departureCityId": "city-uuid-riyadh",
  "destinationCityId": "city-uuid-dammam",
  "tripDate": "2026-03-14",
  "totalDistanceKm": 410.5,
  "energyConsumedKwh": 62.3,
  "startBatteryPct": 98,
  "endBatteryPct": 12,
  "durationMinutes": 245,
  "avgSpeedKmh": 100.5,
  "maxSpeedKmh": 130.0,
  "outsideTempCelsius": 40.5,
  "acUsage": "high",
  "coverImageUrl": "https://media.evtrips.sa/trips/b2c3d4e5/cover-1712910000000.jpg"
}
```

**Field Constraints:**
- `title`: required, 10-200 chars
- `description`: required, 50-10000 chars
- `vehicleId`: required, must belong to the user
- `departureCityId`, `destinationCityId`: required, must be different cities
- `tripDate`: required, ISO date, must be in the past (cannot be future date)
- `totalDistanceKm`: optional, positive number
- `energyConsumedKwh`: optional, positive number
- `startBatteryPct`, `endBatteryPct`: optional, integer 0-100
- `durationMinutes`: optional, positive integer
- `acUsage`: optional, one of 'off'|'low'|'medium'|'high'

**Response — `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "new-trip-uuid",
    "slug": "riyadh-to-dammam-tesla-model-y-x9y8z7w6",
    "status": "draft",
    "createdAt": "2026-04-12T10:05:00.000Z"
  }
}
```

---

#### `PATCH /trips/:id`

Update a draft or rejected trip.

**Auth:** Auth (must be the trip author, status must be 'draft' or 'rejected')

**Path Parameter:** `id` — Trip UUID

**Request Body:** Same fields as `POST /trips` (all optional)

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": { "id": "...", "slug": "...", "status": "draft", "updatedAt": "..." }
}
```

---

#### `POST /trips/:id/submit`

Submit a draft trip for admin review.

**Auth:** Auth + Verified (must be the trip author, status must be 'draft' or 'rejected')

**Path Parameter:** `id` — Trip UUID

**Request Body:** (empty)

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "pending_review",
    "submittedAt": "2026-04-12T10:10:00.000Z",
    "message": "Your trip has been submitted for review. You will be notified once it is approved."
  }
}
```

---

#### `POST /trips/:id/stops`

Add a charging stop to a trip.

**Auth:** Auth (must be trip author, trip must be 'draft')

**Path Parameter:** `id` — Trip UUID

**Request Body:**
```json
{
  "orderIndex": 1,
  "cityId": "city-uuid-khobar",
  "stationId": "station-uuid",
  "chargerType": "tesla_supercharger",
  "chargeFromPct": 12,
  "chargeToPct": 80,
  "chargeDurationMinutes": 45,
  "costSar": null,
  "isFreeCharging": true,
  "notes": "الشاحن مجاني لكن يحتاج حجز مسبق عبر التطبيق",
  "latitude": 26.2172,
  "longitude": 50.1971
}
```

**Response — `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "stop-uuid",
    "tripId": "trip-uuid",
    "orderIndex": 1,
    "stationName": "Tesla Supercharger — Al Khobar",
    "chargerType": "tesla_supercharger",
    "chargeFromPct": 12,
    "chargeToPct": 80,
    "chargeDurationMinutes": 45,
    "isFreeCharging": true
  }
}
```

---

#### `DELETE /trips/:id/stops/:stopId`

Remove a charging stop from a trip.

**Auth:** Auth (trip author, trip must be 'draft')

**Response — `200 OK`:**
```json
{ "success": true, "data": { "message": "Stop removed successfully" } }
```

---

#### `POST /trips/:id/react`

Add or toggle a reaction on a trip.

**Auth:** Auth + Verified

**Path Parameter:** `id` — Trip UUID

**Request Body:**
```json
{
  "type": "helpful"
}
```

`type` must be one of `"helpful"` or `"inspiring"`

**Response — `200 OK` (reaction added):**
```json
{
  "success": true,
  "data": {
    "reacted": true,
    "type": "helpful",
    "helpfulCount": 157,
    "inspiringCount": 22
  }
}
```

**Response — `200 OK` (reaction removed — same request toggles):**
```json
{
  "success": true,
  "data": {
    "reacted": false,
    "type": "helpful",
    "helpfulCount": 156,
    "inspiringCount": 22
  }
}
```

---

#### `POST /trips/:id/favorite`

Add or remove a trip from favorites.

**Auth:** Auth

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "favorited": true,
    "favoriteCount": 88
  }
}
```

---

#### `DELETE /trips/:id`

Soft-delete a trip (author can delete their own draft/published trips).

**Auth:** Auth (must be trip author or admin)

**Response — `200 OK`:**
```json
{ "success": true, "data": { "message": "Trip deleted successfully" } }
```

---

### COMMENT ENDPOINTS

---

#### `GET /trips/:id/comments`

Get comments for a trip.

**Auth:** Public  
**Query Parameters:** `page`, `limit`

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment-uuid-1",
      "tripId": "trip-uuid",
      "author": {
        "id": "user-uuid",
        "username": "ahmed_drive",
        "displayName": "Ahmed Al-Malki",
        "avatarUrl": "https://media.evtrips.sa/avatars/.../avatar.jpg"
      },
      "body": "رحلة ممتازة! كيف كان استهلاك المكيف بالضبط؟",
      "helpfulCount": 3,
      "parentId": null,
      "replies": [
        {
          "id": "comment-uuid-2",
          "author": { "username": "turki_ev", "displayName": "Turki Al-Gashami" },
          "body": "المكيف كان على درجة 22 وسرعة متوسطة، استهلك تقريباً 8-10% إضافية",
          "createdAt": "2026-03-16T10:00:00.000Z"
        }
      ],
      "createdAt": "2026-03-16T08:30:00.000Z"
    }
  ],
  "meta": { "total": 23, "page": 1, "limit": 20, "totalPages": 2 }
}
```

---

#### `POST /trips/:id/comments`

Post a comment on a trip.

**Auth:** Auth + Verified

**Request Body:**
```json
{
  "body": "رحلة ممتازة! كيف كان استهلاك المكيف بالضبط؟",
  "parentId": null
}
```

`parentId` — UUID of parent comment for replies, null for top-level comments

**Response — `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "new-comment-uuid",
    "body": "رحلة ممتازة! كيف كان استهلاك المكيف بالضبط؟",
    "parentId": null,
    "author": { "id": "...", "username": "ahmed_drive" },
    "createdAt": "2026-04-12T10:20:00.000Z"
  }
}
```

---

### USER ENDPOINTS

---

#### `GET /users/:username`

Get a user's public profile.

**Auth:** Public

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "username": "turki_ev",
    "displayName": "Turki Al-Gashami",
    "displayNameAr": "تركي القشامي",
    "avatarUrl": "https://media.evtrips.sa/avatars/.../avatar.jpg",
    "bio": "EV enthusiast",
    "bioAr": "عاشق السيارات الكهربائية",
    "tripCount": 12,
    "followerCount": 45,
    "followingCount": 23,
    "badges": [
      { "type": "first_trip", "awardedAt": "2026-01-20T12:00:00.000Z" },
      { "type": "ten_trips",  "awardedAt": "2026-03-05T09:30:00.000Z" }
    ],
    "isFollowing": false,
    "createdAt": "2026-01-15T08:00:00.000Z"
  }
}
```

---

#### `PATCH /users/me`

Update the authenticated user's profile.

**Auth:** Auth

**Request Body:**
```json
{
  "displayName": "Turki Al-Gashami",
  "displayNameAr": "تركي القشامي",
  "bio": "EV enthusiast and long-distance driver.",
  "bioAr": "عاشق السيارات الكهربائية."
}
```

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": { "id": "...", "displayName": "...", "updatedAt": "..." }
}
```

---

#### `PATCH /users/me/password`

Change the authenticated user's password.

**Auth:** Auth

**Request Body:**
```json
{
  "currentPassword": "OldPass#123",
  "newPassword": "NewSecure#Pass456"
}
```

---

#### `POST /users/:id/follow`

Follow or unfollow a user (toggle).

**Auth:** Auth

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": { "following": true, "followerCount": 46 }
}
```

---

### VEHICLE ENDPOINTS

---

#### `GET /vehicles`

Get the authenticated user's vehicles.

**Auth:** Auth

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "vehicle-uuid",
      "brand": { "id": "...", "nameEn": "Tesla", "nameAr": "تيسلا", "logoUrl": "..." },
      "model": { "id": "...", "nameEn": "Model Y", "nameAr": "موديل Y", "year_from": 2020 },
      "year": 2023,
      "color": "Pearl White",
      "colorAr": "أبيض لؤلؤي",
      "batteryCapacityKwh": 82.0,
      "rangeKm": 533,
      "nickname": "الفالكون",
      "isPrimary": true,
      "createdAt": "2026-01-16T09:00:00.000Z"
    }
  ]
}
```

---

#### `POST /vehicles`

Add a new vehicle.

**Auth:** Auth

**Request Body:**
```json
{
  "brandId": "tesla-brand-uuid",
  "modelId": "model-y-uuid",
  "year": 2023,
  "color": "Pearl White",
  "colorAr": "أبيض لؤلؤي",
  "batteryCapacityKwh": 82.0,
  "rangeKm": 533,
  "nickname": "الفالكون",
  "isPrimary": true
}
```

**Response — `201 Created`:**
```json
{
  "success": true,
  "data": { "id": "new-vehicle-uuid", "isPrimary": true, "createdAt": "..." }
}
```

---

#### `DELETE /vehicles/:id`

Soft-delete a vehicle. Cannot delete if it has active trip drafts.

**Auth:** Auth (must own the vehicle)

**Response — `200 OK`:**
```json
{ "success": true, "data": { "message": "Vehicle removed successfully" } }
```

---

### NOTIFICATION ENDPOINTS

---

#### `GET /notifications`

Get the authenticated user's notifications.

**Auth:** Auth  
**Query Parameters:** `page`, `limit`, `unreadOnly=true`

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-uuid-1",
      "type": "trip_approved",
      "isRead": false,
      "actor": null,
      "entityType": "trip",
      "entityId": "trip-uuid",
      "payload": {
        "tripTitle": "رحلة الرياض إلى الدمام",
        "tripSlug": "riyadh-to-dammam-tesla-model-y-a3b4c5d6"
      },
      "createdAt": "2026-04-12T09:00:00.000Z"
    },
    {
      "id": "notif-uuid-2",
      "type": "new_comment",
      "isRead": true,
      "actor": {
        "id": "user-uuid",
        "username": "ahmed_drive",
        "displayName": "Ahmed Al-Malki",
        "avatarUrl": "https://media.evtrips.sa/avatars/.../avatar.jpg"
      },
      "entityType": "comment",
      "entityId": "comment-uuid",
      "payload": {
        "tripTitle": "رحلة الرياض إلى الدمام",
        "tripSlug": "riyadh-to-dammam-tesla-model-y-a3b4c5d6",
        "commentSnippet": "رحلة ممتازة! كيف كان استهلاك المكيف..."
      },
      "createdAt": "2026-03-16T08:30:00.000Z"
    }
  ],
  "meta": { "total": 14, "unreadCount": 3, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

#### `POST /notifications/read-all`

Mark all notifications as read.

**Auth:** Auth

**Response — `200 OK`:**
```json
{ "success": true, "data": { "markedRead": 3 } }
```

---

#### `PATCH /notifications/:id/read`

Mark a single notification as read.

**Auth:** Auth

**Response — `200 OK`:**
```json
{ "success": true, "data": { "id": "...", "isRead": true } }
```

---

### LOOKUP ENDPOINTS

---

#### `GET /lookups/brands`

Get all vehicle brands.

**Auth:** Public  
**Cache:** 1 hour

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "nameAr": "تيسلا", "nameEn": "Tesla", "slug": "tesla", "logoUrl": "..." },
    { "id": "uuid", "nameAr": "بي واي دي", "nameEn": "BYD", "slug": "byd", "logoUrl": "..." }
  ]
}
```

---

#### `GET /lookups/brands/:id/models`

Get models for a specific brand.

**Auth:** Public  
**Cache:** 1 hour

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "model-uuid",
      "nameAr": "موديل Y",
      "nameEn": "Model Y",
      "slug": "model-y",
      "yearFrom": 2020,
      "yearTo": null,
      "batteryCapacityKwh": 82.0,
      "rangeKmWltp": 533,
      "drivetrain": "awd"
    }
  ]
}
```

---

#### `GET /lookups/cities`

Get all active cities.

**Auth:** Public  
**Cache:** 1 hour

---

#### `GET /lookups/charging-stations`

Get charging stations, with optional city filter.

**Auth:** Public  
**Query Parameters:** `cityId`, `chargerType`, `page`, `limit`

---

### ADMIN ENDPOINTS

---

#### `GET /admin/stats`

Get platform dashboard statistics.

**Auth:** Admin

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 4823,
      "verified": 4510,
      "newToday": 23,
      "newThisWeek": 147,
      "newThisMonth": 521
    },
    "trips": {
      "total": 1247,
      "published": 1089,
      "pendingReview": 34,
      "draft": 98,
      "rejected": 26,
      "newToday": 8,
      "newThisWeek": 52,
      "newThisMonth": 187
    },
    "engagement": {
      "totalComments": 8423,
      "totalFavorites": 24891,
      "totalReactions": 41203,
      "totalViews": 892341
    },
    "reports": {
      "pending": 7,
      "resolvedThisWeek": 12
    },
    "topRoutes": [
      { "from": "Riyadh", "to": "Dammam", "tripCount": 87 },
      { "from": "Riyadh", "to": "Jeddah", "tripCount": 64 },
      { "from": "Jeddah", "to": "Makkah", "tripCount": 41 }
    ],
    "topVehicles": [
      { "brandName": "Tesla", "modelName": "Model Y", "tripCount": 312 },
      { "brandName": "Tesla", "modelName": "Model 3", "tripCount": 187 }
    ],
    "generatedAt": "2026-04-12T10:00:00.000Z"
  }
}
```

---

#### `GET /admin/trips`

Get trips with admin-level filters (including drafts, pending, rejected).

**Auth:** Admin  
**Query Parameters:** `status`, `page`, `limit`, `sort`, `q`, `authorId`

---

#### `PATCH /admin/trips/:id/approve`

Approve a pending trip.

**Auth:** Admin

**Path Parameter:** `id` — Trip UUID

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid",
    "status": "published",
    "publishedAt": "2026-04-12T10:30:00.000Z",
    "message": "Trip approved and published. Author has been notified."
  }
}
```

---

#### `PATCH /admin/trips/:id/reject`

Reject a pending trip with a reason.

**Auth:** Admin

**Path Parameter:** `id` — Trip UUID

**Request Body:**
```json
{
  "reason": "المحتوى يفتقر إلى تفاصيل كافية حول استهلاك الطاقة ونقاط الشحن. يرجى إضافة معلومات أكثر تفصيلاً حول الرحلة."
}
```

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid",
    "status": "rejected",
    "rejectionReason": "المحتوى يفتقر إلى تفاصيل كافية...",
    "message": "Trip rejected. Author has been notified with the rejection reason."
  }
}
```

---

#### `GET /admin/users`

Get all users with admin-level detail.

**Auth:** Admin  
**Query Parameters:** `q` (search by name/email/username), `role`, `isBanned`, `page`, `limit`

---

#### `PATCH /admin/users/:id/ban`

Ban or unban a user.

**Auth:** Admin (super_admin required for banning admins)

**Request Body:**
```json
{
  "banned": true,
  "reason": "Repeated posting of misleading trip data"
}
```

---

#### `GET /admin/reports`

Get content reports.

**Auth:** Admin  
**Query Parameters:** `status`, `entityType`, `page`, `limit`

---

#### `PATCH /admin/reports/:id/resolve`

Resolve a content report.

**Auth:** Admin

**Request Body:**
```json
{
  "action": "content_removed",
  "note": "Trip contained fabricated energy consumption data. Trip removed, user warned."
}
```

`action` one of: `dismissed` | `content_removed` | `user_warned` | `user_banned`

---

### UPLOAD ENDPOINTS

---

#### `POST /upload/presign`

Get a presigned S3 URL for direct client upload.

**Auth:** Auth

**Request Body:**
```json
{
  "contentType": "image/jpeg",
  "folder": "trips/b2c3d4e5",
  "fileName": "cover-photo.jpg"
}
```

`contentType` must be one of: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `video/mp4`

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://evtrips-media.s3.ap-south-1.amazonaws.com/trips/b2c3d4e5/media-x1y2z3a4.jpg?X-Amz-Algorithm=...",
    "key": "trips/b2c3d4e5/media-x1y2z3a4.jpg",
    "publicUrl": "https://media.evtrips.sa/trips/b2c3d4e5/media-x1y2z3a4.jpg",
    "expiresIn": 300
  }
}
```

---

#### `POST /upload/avatar`

Upload a new avatar image (multipart/form-data, small files only).

**Auth:** Auth  
**Content-Type:** `multipart/form-data`  
**Field name:** `avatar`  
**Max size:** 5 MB

**Response — `200 OK`:**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://media.evtrips.sa/avatars/a1b2c3d4/avatar-1712910000000.jpg"
  }
}
```

---

### REPORT ENDPOINTS

---

#### `POST /reports`

Report a trip, comment, or user.

**Auth:** Auth  
**Rate Limit:** 5 / 1 hour

**Request Body:**
```json
{
  "entityType": "trip",
  "entityId": "trip-uuid",
  "reason": "misleading",
  "description": "The energy consumption data seems fabricated. This route cannot achieve 100km/kWh."
}
```

**Response — `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "report-uuid",
    "message": "Report submitted. Our team will review it within 48 hours."
  }
}
```

---

## 6. Filtering & Sorting Reference

### Sort Parameter Format

The `sort` parameter uses `{field}|{direction}` format:
- Direction: `1` = ascending, `-1` = descending

| Sort Value | Description |
|-----------|-------------|
| `published_at\|-1` | Newest first (default) |
| `published_at\|1` | Oldest first |
| `helpful_count\|-1` | Most helpful first |
| `view_count\|-1` | Most viewed first |
| `favorite_count\|-1` | Most favorited first |
| `total_distance_km\|-1` | Longest trips first |
| `total_distance_km\|1` | Shortest trips first |

### Available Filters Summary

| Filter | Type | Endpoint |
|--------|------|---------|
| `from` | city slug | `GET /trips` |
| `to` | city slug | `GET /trips` |
| `fromId` | UUID | `GET /trips` |
| `toId` | UUID | `GET /trips` |
| `brandId` | UUID | `GET /trips` |
| `modelId` | UUID | `GET /trips` |
| `year` | number | `GET /trips` |
| `q` | string | `GET /trips` |
| `status` | TripStatus | `GET /admin/trips` |
| `authorId` | UUID | `GET /admin/trips` |
| `role` | UserRole | `GET /admin/users` |
| `isBanned` | boolean | `GET /admin/users` |
| `cityId` | UUID | `GET /lookups/charging-stations` |
| `chargerType` | ChargerType | `GET /lookups/charging-stations` |
| `unreadOnly` | boolean | `GET /notifications` |

---

## 7. File Upload Flow

### Standard Upload Flow (Web/Mobile)

```
1. Client → POST /v1/upload/presign
   Body: { contentType: 'image/jpeg', folder: 'trips/{tripId}' }
   Response: { uploadUrl, key, publicUrl, expiresIn: 300 }

2. Client → PUT {uploadUrl}   (direct to S3, NOT through API)
   Headers: Content-Type: image/jpeg
   Body: [binary file data]
   Response: 200 OK (from S3)

3. Client → PATCH /v1/trips/{id}
   Body: { coverImageUrl: publicUrl }
   Response: 200 OK with updated trip
```

### File Size Limits

| File Type | Max Size |
|-----------|---------|
| Avatar | 5 MB |
| Trip cover image | 10 MB |
| Trip media image | 10 MB |
| Trip media video | 50 MB |

### Accepted MIME Types

- Images: `image/jpeg`, `image/png`, `image/webp`, `image/heic`
- Videos: `video/mp4`

---

## 8. Error Codes Reference

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 400 | `VALIDATION_ERROR` | Request body failed validation |
| 400 | `INVALID_DATE` | Date field is invalid or in the future |
| 400 | `SAME_CITY` | Departure and destination cities must differ |
| 400 | `FILE_TOO_LARGE` | Uploaded file exceeds size limit |
| 400 | `INVALID_FILE_TYPE` | File MIME type is not allowed |
| 401 | `UNAUTHORIZED` | No token provided |
| 401 | `TOKEN_EXPIRED` | Access token has expired |
| 401 | `REFRESH_TOKEN_INVALID` | Refresh token is invalid or expired |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 403 | `FORBIDDEN` | Insufficient role/permissions |
| 403 | `ACCOUNT_BANNED` | User account is banned |
| 403 | `EMAIL_NOT_VERIFIED` | Email verification required |
| 403 | `NOT_TRIP_OWNER` | Action requires trip ownership |
| 403 | `TRIP_NOT_EDITABLE` | Trip status does not allow editing |
| 404 | `TRIP_NOT_FOUND` | Trip not found |
| 404 | `USER_NOT_FOUND` | User not found |
| 404 | `VEHICLE_NOT_FOUND` | Vehicle not found |
| 404 | `COMMENT_NOT_FOUND` | Comment not found |
| 409 | `EMAIL_ALREADY_EXISTS` | Email address is already registered |
| 409 | `USERNAME_ALREADY_EXISTS` | Username is already taken |
| 409 | `ALREADY_FAVORITED` | Trip is already in favorites |
| 409 | `ALREADY_FOLLOWING` | Already following this user |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 503 | `SERVICE_UNAVAILABLE` | Server temporarily unavailable |

---

*End of API Reference — EV Trips Community v1.0*
