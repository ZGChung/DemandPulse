# DemandPulse API Reference

DemandPulse provides a REST API for submitting and analyzing development requirements. This document describes all available endpoints, authentication methods, and data formats.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-deployment-url.com`

## Authentication

DemandPulse supports multiple authentication methods for different use cases:

### 1. NextAuth Session (Web Users)
- **Method**: GitHub OAuth
- **Usage**: Web application users
- **How it works**: Users log in via GitHub, receive a JWT session cookie
- **Required for**: `POST /api/requirements` (submitting requirements via web)

### 2. API Key (Plugin Integration)
- **Method**: `x-api-key` header
- **Usage**: Claude Code plugin and external integrations
- **Setup**: Set `PLUGIN_API_KEY` environment variable on server, use same key in `x-api-key` header
- **Required for**: `/api/plugin/requirements` endpoints

### 3. Public Access (Read-only)
- **Method**: No authentication required
- **Usage**: Public read access to requirements and health checks
- **Endpoints**: `GET /api/requirements`, `/api/health`

## Endpoints

### Health Check
```http
GET /api/health
```
Check if the API is running and get system information.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "app": {
    "name": "DemandPulse",
    "url": "http://localhost:3000"
  },
  "features": {
    "claudeCodePlugin": true,
    "aiProcessing": true
  },
  "environment": "development"
}
```

### Get Requirements
```http
GET /api/requirements
```
Retrieve requirements with optional filtering. Public read access.

**Query Parameters**:
- `status` (optional): Filter by status: `pending`, `processed`, or `rejected`
- `limit` (optional): Number of requirements to return (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalRequirements": 150,
      "pendingRequirements": 25,
      "processedRequirements": 125,
      "totalClusters": 12,
      "uniqueUsers": 45,
      "lastUpdated": "2025-01-15T10:30:00Z"
    },
    "requirements": [
      {
        "id": "uuid",
        "originalRequirement": "We need to add dark mode support",
        "summarizedRequirement": "Add dark mode",
        "status": "processed",
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z",
        "embedding": null,
        "clusterId": "cluster-uuid"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  },
  "endpoints": {
    "POST": "/api/requirements",
    "GET": "/api/requirements"
  },
  "rateLimit": {
    "maxRequests": 100,
    "windowMs": 900000
  }
}
```

### Submit Requirement
```http
POST /api/requirements
```
Submit a new development requirement with user consent. Requires authentication.

**Headers**:
- `Content-Type: application/json`
- Authentication via NextAuth session cookie

**Request Body**:
```json
{
  "requirementId": "550e8400-e29b-41d4-a716-446655440000",
  "originalRequirement": "We need to implement real-time collaboration features for the code editor.",
  "summarizedRequirement": "Add real-time collaboration to code editor",
  "context": {
    "conversationId": "conv-123",
    "userId": "user-456",
    "workspacePath": "/projects/my-app",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "consent": {
    "requirementId": "550e8400-e29b-41d4-a716-446655440000",
    "consentOptions": {
      "dataCollection": true,
      "contact": false,
      "anonymization": true
    },
    "userProvidedEmail": null,
    "consentedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "requirementId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Requirement submitted successfully",
  "retentionDays": 365,
  "privacyNotice": "Your data will be anonymized and used for product analysis. You can request deletion at any time."
}
```

### Get Clusters
```http
GET /api/clusters
```
Retrieve requirement clusters and public statistics for trends analysis.

**Query Parameters**:
- `limit` (optional): Number of clusters to return (1-100, default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "clusters": [
      {
        "id": "cluster-uuid",
        "name": "UI/UX Improvements",
        "description": "Requests related to user interface and experience",
        "keywords": ["dark mode", "responsive", "accessibility"],
        "requirementCount": 25,
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-01-15T10:30:00Z"
      }
    ],
    "statistics": {
      "totalRequirements": 150,
      "totalClusters": 12,
      "trendingClusters": ["UI/UX Improvements", "Performance"],
      "popularKeywords": ["dark mode", "real-time", "mobile"]
    }
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 12,
    "hasMore": false
  }
}
```

### Plugin Integration

#### Submit Requirement via Plugin
```http
POST /api/plugin/requirements
```
Submit a requirement from Claude Code plugin. Requires API key authentication.

**Headers**:
- `Content-Type: application/json`
- `x-api-key: your-plugin-api-key`

**Request Body**: Same as regular requirement submission

**Response**: Same as regular requirement submission

#### Generate Plugin Test Requirements
```http
GET /api/plugin/requirements
```
Generate mock requirements for plugin testing. Requires API key authentication.

**Query Parameters**:
- `count` (optional): Number of requirements to generate (1-100, default: 1)

**Response**:
```json
{
  "success": true,
  "requirements": [
    {
      "id": "uuid",
      "originalRequirement": "Generated test requirement",
      "summarizedRequirement": "Test requirement",
      "status": "pending",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "message": "Generated requirements for plugin testing"
}
```

## Rate Limiting

- **Endpoint**: `POST /api/requirements`
- **Limit**: 100 requests per 15 minutes (configurable via environment variables)
- **Storage**: Redis-based with in-memory fallback
- **Headers**: Rate limit information is returned in response headers

## Validation

All endpoints validate request data using Zod schemas. Common validation rules:

1. **Requirement Text**: 10-1000 characters
2. **UUID Format**: All IDs must be valid UUID v4
3. **Timestamps**: ISO 8601 format
4. **Email**: Valid email format when provided
5. **Pagination Limits**: Limits enforced (1-100)

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request body",
  "details": {
    "field": "originalRequirement",
    "issue": "String must contain at least 10 character(s)"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Common Error Codes**:
- `400`: Bad Request (validation failed)
- `401`: Unauthorized (missing/invalid authentication)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## CORS

CORS is configured to allow requests from:
- The application's own domain (`NEXT_PUBLIC_APP_URL`)
- `localhost:3000` (development)
- Additional origins can be configured via environment variables

## Data Privacy

All submissions include consent metadata for GDPR compliance. Key privacy features:

1. **Anonymization**: Enabled by default for all data
2. **Data Retention**: Configurable retention period (default: 365 days)
3. **Right to Deletion**: Users can request data deletion
4. **Consent Tracking**: All consent decisions are logged with timestamps

## Examples

### Using cURL

**Submit a requirement via plugin**:
```bash
curl -X POST http://localhost:3000/api/plugin/requirements \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "requirementId": "550e8400-e29b-41d4-a716-446655440000",
    "originalRequirement": "We need to add automated testing",
    "summarizedRequirement": "Add automated testing",
    "context": {
      "conversationId": "conv-123",
      "timestamp": "2025-01-15T10:30:00Z"
    },
    "consent": {
      "requirementId": "550e8400-e29b-41d4-a716-446655440000",
      "consentOptions": {
        "dataCollection": true,
        "contact": false,
        "anonymization": true
      },
      "consentedAt": "2025-01-15T10:30:00Z"
    }
  }'
```

**Get public requirements**:
```bash
curl "http://localhost:3000/api/requirements?limit=5&status=processed"
```

## SDKs and Libraries

Currently, DemandPulse doesn't provide official SDKs. However, you can use the API directly with:

- **JavaScript/TypeScript**: `fetch` API or libraries like Axios
- **Python**: `requests` library
- **Go**: `net/http` package
- **Other languages**: Any HTTP client

## OpenAPI Specification

A complete OpenAPI 3.0 specification is available at `/docs/api/swagger.yaml` or can be downloaded from the repository.

---

*Last Updated: 2025-01-15*
*API Version: 1.0.0*