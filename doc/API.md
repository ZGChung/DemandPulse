# DemandPulse API

## Overview

DemandPulse exposes HTTP endpoints for:

- ingesting product or developer requirements
- collecting consent and context for those requirements
- retrieving public trend clusters derived from processed requirements

Base URL:

```text
https://<your-demandpulse-domain>
```

Examples in this document assume:

```text
https://demand-pulse.vercel.app
```

Authentication modes:

- `x-api-key` header for trusted plugin/integration submissions to `POST /api/plugin/requirements`
- NextAuth session cookies for authenticated submissions to `POST /api/requirements`
- no authentication for public reads from `GET /api/clusters`

Rate limits:

- `POST /api/plugin/requirements` without API key: `10` requests per hour per IP
- `POST /api/plugin/requirements` with valid API key: no route-level limiter in this handler
- `POST /api/requirements`: uses the default authenticated rate limiter
  - code defaults: `100` requests per `900000` ms (`15` minutes)
  - this is configurable via `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`
- `GET /api/clusters`: no route-level rate limiter in this handler

## Authentication

### API key: `x-api-key`

Use this for trusted integrations calling:

```http
POST /api/plugin/requirements
```

The key must match the server-side `PLUGIN_API_KEY` environment variable.

Example:

```http
x-api-key: <PLUGIN_API_KEY>
```

Behavior:

- valid key: request runs in `apikey` mode
- missing or invalid key: request falls back to public `community` mode
- `GET /api/plugin/requirements` requires a valid API key and returns `401` otherwise

### NextAuth session

Use this for first-party authenticated users calling:

```http
POST /api/requirements
```

Authentication is checked with `getServerSession(authOptions)`. In practice this means the request must include a valid NextAuth session cookie. This endpoint does not accept `x-api-key`.

If no session is present, the API returns:

```json
{
  "error": "Authentication required"
}
```

## Endpoints

### POST /api/plugin/requirements

Submit a requirement from a plugin or external integration. This endpoint is public, but anonymous callers are rate-limited to `10` requests per hour per IP.

Auth:

- optional `x-api-key`
- with valid key: `source` becomes `"api-key"`
- without key: `source` becomes `"community-plugin"`

#### Request body

```json
{
  "requirementId": "a2f4c8d1-1f7b-4ce2-b7b8-3d4f6b9d7a11",
  "originalRequirement": "I need to add user authentication to my Next.js app with Google OAuth.",
  "summarizedRequirement": "Add NextAuth.js authentication with Google OAuth provider",
  "context": {
    "conversationId": "8ab3b22a-5f65-4b6b-9bb1-6f1b7f7dc221",
    "userId": "optional-user-id",
    "workspacePath": "/Users/dev/projects/my-app",
    "timestamp": "2026-04-05T10:30:00.000Z"
  },
  "consent": {
    "requirementId": "a2f4c8d1-1f7b-4ce2-b7b8-3d4f6b9d7a11",
    "consentedAt": "2026-04-05T10:30:00.000Z",
    "consentOptions": {
      "dataCollection": true,
      "contact": false,
      "anonymization": true
    },
    "userProvidedEmail": ""
  },
  "demandpulseAccount": "optional-email-or-username"
}
```

#### Field rules

- `requirementId`: required non-empty string in the validated payload
- if `requirementId` is missing, the route generates a UUID before validation
- `originalRequirement`: required non-empty string
- `summarizedRequirement`: required non-empty string
- `context.conversationId`: required non-empty string
- `context.userId`: optional string
- `context.workspacePath`: optional string
- `context.timestamp`: ISO datetime string or date
- `consent.requirementId`: required non-empty string
- `consent.consentedAt`: ISO datetime string or date
- `consent.consentOptions.dataCollection`: required boolean
- `consent.consentOptions.contact`: required boolean
- `consent.consentOptions.anonymization`: required boolean
- `consent.userProvidedEmail`: optional valid email or empty string
- `demandpulseAccount`: optional trimmed string

Additional validation enforced by `validateRequirementSubmission`:

- `originalRequirement` and `summarizedRequirement` must pass text validation
- `context.conversationId` must pass conversation ID validation
- `context.workspacePath`, if present, must pass workspace path validation
- if `consent.consentOptions.contact` is `true`, `consent.userProvidedEmail` is required
- if `consent.consentOptions.anonymization` is `true`, `consent.userProvidedEmail` must not be provided

#### Success response: `201 Created`

```json
{
  "success": true,
  "requirementId": "clx123abc456",
  "message": "Requirement collected and stored",
  "source": "community-plugin",
  "trendsUrl": "https://demand-pulse.vercel.app/trends"
}
```

Response fields:

- `success`: boolean
- `requirementId`: stored requirement ID
- `message`: success message
- `source`: `"community-plugin"` or `"api-key"`
- `trendsUrl`: public trends page URL

#### Error responses

`400 Bad Request`

Possible bodies:

```json
{
  "error": "Invalid JSON in request body"
}
```

```json
{
  "error": "Invalid request body"
}
```

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "context.timestamp",
      "message": "Invalid datetime"
    }
  ]
}
```

```json
{
  "error": "Validation failed",
  "details": ["Email is required when contact consent is given"]
}
```

```json
{
  "error": "Consent validation failed",
  "details": ["Consent options are invalid"]
}
```

`429 Too Many Requests`

Anonymous community mode only:

```json
{
  "error": "Rate limit exceeded. Try again later.",
  "retryAfter": 3600
}
```

Headers:

- `Retry-After`

`500 Internal Server Error`

```json
{
  "error": "Failed to store requirement",
  "message": "Failed to store requirement"
}
```

or

```json
{
  "error": "Internal server error",
  "message": "Unknown error"
}
```

### POST /api/requirements

Submit a requirement as an authenticated DemandPulse user.

Auth:

- required NextAuth session
- no API key support

#### Request body

The request schema is the same `requirementSubmissionSchema` used by the plugin endpoint:

```json
{
  "requirementId": "a2f4c8d1-1f7b-4ce2-b7b8-3d4f6b9d7a11",
  "originalRequirement": "The dashboard is slow with large datasets. Can we implement virtual scrolling?",
  "summarizedRequirement": "Optimize dashboard performance with virtual scrolling",
  "context": {
    "conversationId": "8ab3b22a-5f65-4b6b-9bb1-6f1b7f7dc221",
    "userId": "optional-user-id",
    "workspacePath": "/Users/dev/projects/my-app",
    "timestamp": "2026-04-05T10:30:00.000Z"
  },
  "consent": {
    "requirementId": "a2f4c8d1-1f7b-4ce2-b7b8-3d4f6b9d7a11",
    "consentedAt": "2026-04-05T10:30:00.000Z",
    "consentOptions": {
      "dataCollection": true,
      "contact": true,
      "anonymization": false
    },
    "userProvidedEmail": "dev@example.com"
  },
  "demandpulseAccount": "optional-email-or-username"
}
```

Notes:

- the endpoint validates and sanitizes `originalRequirement` and `summarizedRequirement`
- storage is associated with `session.user.id`
- if contact consent is enabled and the signed-in user has an email, DemandPulse may send a notification email

#### Success response: `201 Created`

```json
{
  "success": true,
  "requirementId": "clx123abc456",
  "message": "Requirement successfully collected and stored",
  "retentionDays": 365,
  "privacyNotice": "Your requirement has been stored with the privacy controls you selected."
}
```

Headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

#### Error responses

`400 Bad Request`

Possible bodies:

```json
{
  "error": "Validation failed",
  "message": "Validation failed: Email is required when contact consent is given"
}
```

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "consent.userProvidedEmail",
      "message": "Invalid email"
    }
  ]
}
```

```json
{
  "error": "Consent validation failed",
  "details": ["Consent options are invalid"]
}
```

`401 Unauthorized`

```json
{
  "error": "Authentication required"
}
```

`429 Too Many Requests`

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 900
}
```

Headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After`

Important:

- this endpoint is rate-limited by the default limiter, keyed by `session.user.id` and client IP
- code defaults are `100` requests per `15` minutes
- deployments can change this via `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS`

`500 Internal Server Error`

```json
{
  "error": "Failed to store requirement",
  "message": "Failed to store requirement"
}
```

or

```json
{
  "error": "Internal server error",
  "message": "Unknown error"
}
```

### GET /api/clusters

Fetch public trend clusters and summary statistics.

Auth:

- no authentication required

#### Query parameters

- `limit`: optional integer string, min `1`, max `100`, default `10`
- `offset`: optional integer string, min `0`, default `0`

Example:

```text
GET /api/clusters?limit=10&offset=0
```

#### Success response: `200 OK`

```json
{
  "success": true,
  "data": {
    "clusters": [
      {
        "id": "clu_123",
        "name": "Authentication Systems",
        "description": "Login, OAuth, 2FA, and security requirements",
        "requirementCount": 42,
        "firstDetectedAt": "2026-03-06T10:30:00.000Z",
        "lastDetectedAt": "2026-04-05T10:30:00.000Z",
        "sampleRequirements": [
          {
            "summary": "Add NextAuth.js with Google OAuth",
            "detectedAt": "2026-04-05T10:30:00.000Z"
          }
        ]
      }
    ],
    "statistics": {
      "totalRequirements": 2847,
      "totalClusters": 12,
      "totalUsers": 428,
      "recentRequirements": 142
    }
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 12,
    "hasMore": true
  }
}
```

Response structure:

- `data.clusters[].id`: cluster ID
- `data.clusters[].name`: cluster name
- `data.clusters[].description`: cluster description
- `data.clusters[].requirementCount`: number of requirements in the cluster
- `data.clusters[].firstDetectedAt`: first detected timestamp
- `data.clusters[].lastDetectedAt`: last detected timestamp
- `data.clusters[].sampleRequirements[]`: up to 5 sample items
- `data.clusters[].sampleRequirements[].summary`: summarized requirement text
- `data.clusters[].sampleRequirements[].detectedAt`: sample detected timestamp
- `data.statistics.totalRequirements`: total requirements in the system
- `data.statistics.totalClusters`: total cluster count
- `data.statistics.totalUsers`: total user count
- `data.statistics.recentRequirements`: requirements detected in the last 7 days
- `pagination.total`: total cluster count

Headers:

- `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`

#### Error responses

`400 Bad Request`

```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "path": "limit",
      "message": "Number must be less than or equal to 100"
    }
  ]
}
```

`500 Internal Server Error`

```json
{
  "error": "Failed to fetch clusters",
  "message": "Failed to fetch clusters"
}
```

## Rate Limits

### POST /api/plugin/requirements

- anonymous community mode: `10` requests per hour per IP
- API key mode: no route-level limit enforced in this handler
- when anonymous throttling triggers, the response includes `Retry-After`

### POST /api/requirements

- authenticated rate limiter is keyed by `session.user.id` plus client IP
- code defaults:
  - `RATE_LIMIT_MAX_REQUESTS=100`
  - `RATE_LIMIT_WINDOW_MS=900000`
- responses include:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
  - `Retry-After` on `429`

### GET /api/clusters

- no route-level rate limiter in this handler
- public responses are cacheable for `60` seconds at the edge/CDN layer

## Error Codes

### 400 Bad Request

Returned when:

- JSON is invalid
- request body is not an object
- Zod validation fails
- custom validation fails
- consent validation fails
- query parameter validation fails

Typical shapes:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "context.timestamp",
      "message": "Invalid datetime"
    }
  ]
}
```

```json
{
  "error": "Validation failed",
  "message": "Validation failed: Invalid workspace path"
}
```

### 401 Unauthorized

Returned when:

- `POST /api/requirements` has no valid NextAuth session
- `GET /api/plugin/requirements` is called without a valid API key

Examples:

```json
{
  "error": "Authentication required"
}
```

```json
{
  "error": "API key required for GET"
}
```

### 429 Too Many Requests

Returned when:

- anonymous community calls exceed `10/hour/IP` on `POST /api/plugin/requirements`
- authenticated calls exceed the configured default limiter on `POST /api/requirements`

Examples:

```json
{
  "error": "Rate limit exceeded. Try again later.",
  "retryAfter": 3600
}
```

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 900
}
```

### 500 Internal Server Error

Returned when:

- storage fails
- downstream processing throws unexpectedly
- cluster retrieval fails

Typical shapes:

```json
{
  "error": "Failed to store requirement",
  "message": "Failed to store requirement"
}
```

```json
{
  "error": "Failed to fetch clusters",
  "message": "Failed to fetch clusters"
}
```

```json
{
  "error": "Internal server error",
  "message": "Unknown error"
}
```

## Code Examples

### cURL

Plugin submission with API key:

```bash
curl -X POST "https://demand-pulse.vercel.app/api/plugin/requirements" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_PLUGIN_API_KEY" \
  -d '{
    "requirementId": "a2f4c8d1-1f7b-4ce2-b7b8-3d4f6b9d7a11",
    "originalRequirement": "I need to add user authentication to my Next.js app with Google OAuth.",
    "summarizedRequirement": "Add NextAuth.js authentication with Google OAuth provider",
    "context": {
      "conversationId": "8ab3b22a-5f65-4b6b-9bb1-6f1b7f7dc221",
      "workspacePath": "/Users/dev/projects/my-app",
      "timestamp": "2026-04-05T10:30:00.000Z"
    },
    "consent": {
      "requirementId": "a2f4c8d1-1f7b-4ce2-b7b8-3d4f6b9d7a11",
      "consentedAt": "2026-04-05T10:30:00.000Z",
      "consentOptions": {
        "dataCollection": true,
        "contact": false,
        "anonymization": true
      },
      "userProvidedEmail": ""
    }
  }'
```

Authenticated submission with NextAuth session cookie:

```bash
curl -X POST "https://demand-pulse.vercel.app/api/requirements" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "requirementId": "a2f4c8d1-1f7b-4ce2-b7b8-3d4f6b9d7a11",
    "originalRequirement": "The dashboard is slow with large datasets. Can we implement virtual scrolling?",
    "summarizedRequirement": "Optimize dashboard performance with virtual scrolling",
    "context": {
      "conversationId": "8ab3b22a-5f65-4b6b-9bb1-6f1b7f7dc221",
      "workspacePath": "/Users/dev/projects/my-app",
      "timestamp": "2026-04-05T10:30:00.000Z"
    },
    "consent": {
      "requirementId": "a2f4c8d1-1f7b-4ce2-b7b8-3d4f6b9d7a11",
      "consentedAt": "2026-04-05T10:30:00.000Z",
      "consentOptions": {
        "dataCollection": true,
        "contact": true,
        "anonymization": false
      },
      "userProvidedEmail": "dev@example.com"
    }
  }'
```

Fetch public trend clusters:

```bash
curl "https://demand-pulse.vercel.app/api/clusters?limit=10&offset=0"
```

### JavaScript

Plugin submission:

```js
const requirementId = crypto.randomUUID();

const response = await fetch("https://demand-pulse.vercel.app/api/plugin/requirements", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.DEMANDPULSE_API_KEY,
  },
  body: JSON.stringify({
    requirementId,
    originalRequirement: "Need retry logic for database timeout errors.",
    summarizedRequirement: "Add retry logic for database timeout errors",
    context: {
      conversationId: crypto.randomUUID(),
      workspacePath: "/Users/dev/projects/my-app",
      timestamp: new Date().toISOString(),
    },
    consent: {
      requirementId,
      consentedAt: new Date().toISOString(),
      consentOptions: {
        dataCollection: true,
        contact: false,
        anonymization: true,
      },
      userProvidedEmail: "",
    },
  }),
});

const data = await response.json();
console.log(response.status, data);
```

Browser fetch using an existing NextAuth session:

```js
const requirementId = crypto.randomUUID();

const response = await fetch("/api/requirements", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    requirementId,
    originalRequirement: "Please add virtual scrolling to the analytics dashboard.",
    summarizedRequirement: "Add virtual scrolling to the analytics dashboard",
    context: {
      conversationId: crypto.randomUUID(),
      workspacePath: "/Users/dev/projects/my-app",
      timestamp: new Date().toISOString(),
    },
    consent: {
      requirementId,
      consentedAt: new Date().toISOString(),
      consentOptions: {
        dataCollection: true,
        contact: true,
        anonymization: false,
      },
      userProvidedEmail: "dev@example.com",
    },
  }),
});

const data = await response.json();
console.log(response.status, data);
```

Fetch clusters:

```js
const response = await fetch("https://demand-pulse.vercel.app/api/clusters?limit=10&offset=0");
const data = await response.json();
console.log(data.data.clusters, data.data.statistics);
```

### Python

Plugin submission:

```python
import os
import uuid
import requests
from datetime import datetime, timezone

now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
requirement_id = str(uuid.uuid4())

payload = {
    "requirementId": requirement_id,
    "originalRequirement": "Need retry logic for database timeout errors.",
    "summarizedRequirement": "Add retry logic for database timeout errors",
    "context": {
        "conversationId": str(uuid.uuid4()),
        "workspacePath": "/Users/dev/projects/my-app",
        "timestamp": now,
    },
    "consent": {
        "requirementId": requirement_id,
        "consentedAt": now,
        "consentOptions": {
            "dataCollection": True,
            "contact": False,
            "anonymization": True,
        },
        "userProvidedEmail": "",
    },
}

response = requests.post(
    "https://demand-pulse.vercel.app/api/plugin/requirements",
    headers={
        "Content-Type": "application/json",
        "x-api-key": os.environ["DEMANDPULSE_API_KEY"],
    },
    json=payload,
    timeout=30,
)

print(response.status_code)
print(response.json())
```

Fetch clusters:

```python
import requests

response = requests.get(
    "https://demand-pulse.vercel.app/api/clusters",
    params={"limit": 10, "offset": 0},
    timeout=30,
)

print(response.status_code)
print(response.json())
```
