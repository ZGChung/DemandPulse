# DemandPulse Development Status

**Handoff**: Another agent can continue from here. See **In Progress** and doc/HANDOFF.md for current work. Update this file when you complete tasks.

## Project Overview

**DemandPulse** is a Next.js 14 application that detects and analyzes developer requirements from Claude Code conversations. The platform captures real-time requirements from developers using Claude Code, processes them using AI, clusters similar requirements to identify trends, and provides analytics for product teams.

### Core Mission

Transform unstructured developer requirements from Claude Code conversations into actionable insights for product development, enabling data-driven decision making about feature prioritization and market trends.

## Architecture Overview

### Technology Stack

- **Frontend**: Next.js 14 App Router with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: SQLite (development), PostgreSQL-ready (production)
- **Authentication**: NextAuth.js with GitHub OAuth and role-based access (USER, ANALYST, ADMIN)
- **Security**: CSP headers, CSRF protection, rate limiting, input validation
- **Monitoring**: Structured logging, privacy audit logs, system health checks

### Key Directories

- `/app` - Next.js App Router pages and API routes
- `/components` - React components
- `/services` - Business logic and external integrations
- `/lib` - Utilities, validation, authentication, logging
- `/prisma` - Database schema and migrations
- `/scripts` - Development and testing scripts

## Current Development Status

### ✅ Completed Features

#### 1. **Core Requirement Processing**

- ✅ Requirement submission API (`/api/requirements`)
- ✅ Mock Claude Code integration for testing
- ✅ Real plugin API (`/api/plugin/requirements`, x-api-key); E2E script `npm run e2e:plugin` (see doc/PLUGIN-INTEGRATION.md)
- ✅ Requirement summarization and processing
- ✅ Consent management and privacy compliance
- ✅ Database models for requirements, users, clusters

#### 2. **Authentication & Authorization**

- ✅ GitHub OAuth integration
- ✅ Role-based access control (USER, ANALYST, ADMIN)
- ✅ Session management with NextAuth.js
- ✅ Protected routes and API endpoints

#### 3. **Admin Dashboard**

- ✅ Admin layout with authentication checks
- ✅ Dashboard with statistics cards
- ✅ Requirements management page
- ✅ Clusters management page
- ✅ Users management page
- ✅ System settings page
- ✅ Analytics page (basic)
- ✅ Audit logs API endpoint
- ✅ Privacy requests API endpoint
- ✅ System health API endpoint

#### 4. **Security Implementation**

- ✅ Content Security Policy (CSP) headers
- ✅ CSRF protection with token validation
- ✅ Rate limiting (in-memory with Redis fallback)
- ✅ Input validation with Zod schemas
- ✅ Email masking for privacy
- ✅ Privacy audit logging
- ✅ Data deletion queue for GDPR compliance

#### 5. **Database & Data Models**

- ✅ User model with roles
- ✅ Requirement model with status tracking
- ✅ Cluster model for requirement grouping
- ✅ PrivacyAuditLog model for compliance
- ✅ DataDeletionQueue model for GDPR
- ✅ SystemSettings model (file-based fallback)

#### 6. **Development Infrastructure**

- ✅ ESLint configuration (87 warnings remaining)
- ✅ Prettier formatting
- ✅ TypeScript strict mode
- ✅ Git hooks (pre-commit, pre-push)
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Comprehensive test suite (93 passing tests)

### 🚧 Partially Implemented

#### 1. **Claude Code Integration**

- ⚠️ Mock service for testing (`services/claude-code-integration.ts`)
- ⚠️ Internal hook system for event handling
- ⚠️ Context monitoring and auto-compact features
- ❌ **Missing**: Real Claude Code API client
- ❌ **Missing**: WebSocket connection for real-time events
- ❌ **Missing**: OAuth authentication with Claude Code
- ✅ Plugin package (claude-plugin-demandpulse); optional: publish to npm/marketplace

#### 2. **AI-Powered Clustering**

- ⚠️ Basic keyword-based clustering
- ⚠️ Cluster management UI
- ❌ **Missing**: Vector embeddings for requirements
- ❌ **Missing**: Similarity search algorithms
- ❌ **Missing**: Integration with vector database (Pinecone/Weaviate)

#### 3. **Advanced Analytics**

- ⚠️ Basic analytics API endpoint
- ⚠️ Analytics page with summary cards
- ❌ **Missing**: Interactive charts and visualizations
- ❌ **Missing**: Trend analysis over time
- ❌ **Missing**: Predictive analytics for requirement volume

#### 4. **Admin UI Components**

- ⚠️ All major admin pages created
- ✅ Audit logs page UI created
- ✅ Privacy requests page UI created
- ✅ System health page UI created
- ✅ Navigation sidebar in admin layout
- ✅ Mobile/responsive: landing hamburger nav, trends/dashboard responsive headers, admin mobile drawer, viewport meta
- ✅ P3-13 监控与可观测: instrumentation.ts, global-error.tsx, withRequestLogging (trace id + duration), doc/MONITORING.md

### ❌ Not Yet Implemented

#### 1. **Real Claude Code Integration**

- ✅ **Plugin path**: Stop hook reads `transcript_path` (JSONL), submits last user message to `POST /api/plugin/requirements` when `ENABLE_AUTO_DETECTION` and consent env are set; skill `/demandpulse:submit` for manual submit. See doc/CLAUDE_CODE_API.md.
- ❌ Real-time WebSocket connection to Claude Code events
- ❌ Claude Code OAuth authentication flow
- ✅ Plugin manifest and packaging (claude-plugin-demandpulse) for distribution

#### 2. **Production Deployment**

- ✅ Docker containerization (Dockerfile multi-stage, docker-compose, Next.js standalone output)
- ✅ Production environment configuration (doc/PRODUCTION_ENV.md：必选/推荐/可选变量，部署前检查清单)
- ✅ Monitoring: Sentry (client/server), structured logging, instrumentation, global-error, request logging + trace ids (see doc/MONITORING.md)
- ✅ Performance optimization and caching (GET /api/requirements anonymous response cached 30s; clusters/health already cached)

#### 3. **Advanced Features**

- ✅ Email notifications for admins (new requirement → all ADMIN users with email, via Resend/mock)
- ✅ User dashboard with personal insights (GET /api/me/insights, “Trends you’re in” in PersonalInsights)
- ✅ Requirement prioritization algorithms (GET /api/requirements?sort=priority, recency + cluster size)
- ✅ Team collaboration features (dashboard “Your teams” widget, links to /teams)
- API documentation (Swagger/OpenAPI) – 已退役，不再维护公开 API 文档与对应规范文件

## Current Work in Progress

### Active Tasks

None.

### Recently Completed (latest first)

1. **Real Claude Code (plugin)** – Stop hook in claude-plugin-demandpulse: handler uses `hook_event_name` and `transcript_path`, parses JSONL for last user message, keyword/consent/length check, POST to /api/plugin/requirements; doc/CLAUDE_CODE_API.md updated.
2. **API documentation** – OpenAPI 文档补充 GET /api/requirements 的 sort 参数（recent|priority）、GET /api/me/insights、GET|POST /api/organizations 及对应 schema。
3. **Team collaboration** – Dashboard 右侧增加 “Your teams” 组件，拉取 /api/organizations，展示最多 3 个团队及成员数，链接到 /teams 与 /teams/[id]。
4. **Performance/caching** – GET /api/requirements 匿名请求结果缓存 30s（Cache-Control s-maxage=30），与 clusters/health 一致。
5. **Requirement prioritization** – DatabaseService.getPrioritizedRequirements (recency + cluster size score); GET /api/requirements?sort=priority; api-client getRequirements(sort).
6. **Production environment configuration** – doc/PRODUCTION_ENV.md：生产环境变量说明（必选/推荐/可选）、部署前检查清单、Vercel/Docker 简述。
7. **User dashboard personal insights** – GET /api/me/insights (contributionCount + clusters for user); PersonalInsights fetches it and shows “Trends you’re in” with links to /trends. DatabaseService: getRequirementCountForUser, getClustersForUser.
8. **Docker containerization** – Dockerfile (node:20-alpine, deps → builder → runner), Next.js `output: "standalone"`, docker-compose.yml, .dockerignore; README Docker section.
9. **Admin email notifications** – On new requirement submission, all users with role ADMIN (and email) receive a notification (subject/summary/submitter link). Uses existing email-service (Resend/mock). Dependabot: ignore eslint/tailwind/dotenv/@types/node; ESLint import resolver set to node on main.
10. **P3-12 团队/组织能力** – Organization + OrganizationMember schema, GET/POST /api/organizations, GET /api/organizations/[id] and [id]/requirements, Teams page and team detail (org board), dashboard nav “Teams”
11. **P1 Growth** – User “My Requirements” page (real API, filter, CSV export, live stats); Onboarding last-step CTA “View Trends”; Dashboard nav “Invite” + #referral scroll
12. **Admin System Health Page** - UI for monitoring system status (overall status, system info, database/disk/memory/files/external services)
13. **Admin Navigation Sidebar** - Unified sidebar navigation for Dashboard, Requirements, Clusters, Users, Analytics, Audit Logs, Privacy Requests, System Health, Settings
14. **Admin Analytics Page** - Created with time range filtering and metrics display
15. **Admin Users Page API Integration** - Converted from server to client component with real API integration
16. **Missing Admin API Endpoints** - Created analytics, audit-logs, privacy-requests, system-health APIs
17. **Settings Service** - File-based persistence for system settings with caching
18. **Admin Audit Logs Page** - UI for viewing privacy audit logs with filtering and pagination
19. **Admin Privacy Requests Page** - UI for managing data deletion requests with bulk actions
20. **P1-6 邮件摘要** - Weekly digest: /api/cron/weekly-digest (CRON_SECRET); HTML+text template; sends to users with email; Vercel cron Mon 9am
21. **P2-10 公开 API/文档** - 已下线，不再对用户开放 /api-docs、/api/openapi 与相关入口
22. **P2-11 性能与缓存** - lib/cache TTL cache; /api/clusters and /api/health cached (60s/10s), Cache-Control headers
23. **P2-9 向量聚类** - assignToCluster after embedding (POST /api/requirements + plugin); GET/POST /api/cron/run-clustering (CRON_SECRET) for batch K-means
24. **P3-13 监控与可观测** - instrumentation.ts, global-error.tsx, withRequestLogging, doc/MONITORING.md
25. **P3-15 移动端/响应式** - landing hamburger nav, admin mobile drawer, responsive headers
26. **P3-14 i18n** - LocaleProvider, POST /api/locale, language switcher in LandingNav, landing/nav wired to t()

## Known Issues & Technical Debt

### 1. **Prisma Migration Issues**

- **Problem**: Node.js 24.10.0 simdjson library mismatch (libsimdjson.27.dylib vs libsimdjson.29.dylib)
- **Impact**: Cannot run Prisma migrations or pre-commit hooks
- **Workaround**: Using file-based settings instead of database table, manual schema updates
- **Priority**: High - blocks database schema changes

### 2. **Security Warnings**

- **ESLint Warnings**: 127 warnings remaining (down from 198 - fixed most unused variables and any types)
- **npm audit**: CI allows failures (`|| true` in GitHub Actions)
- **Priority**: Medium - should be addressed before production

### 3. **Mock Dependencies**

- Claude Code: plugin path (Stop hook + skill) implemented; WebSocket/OAuth not implemented
- Rate limiting uses in-memory fallback (not Redis in production)
- Email service: implemented (Resend + mock); admin new-requirement notifications wired
- **Priority**: High for Claude Code integration, Medium for others

### 4. **Performance Considerations**

- No caching layer for frequently accessed data
- No database connection pooling configuration
- No CDN for static assets
- **Priority**: Medium - address before scaling

## Database Schema Summary

### Core Models

```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  name          String?
  image         String?
  role          UserRole @default(USER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  requirements  Requirement[]
  privacyAuditLogs PrivacyAuditLog[]
}

model Requirement {
  id                    String   @id @default(cuid())
  originalRequirement   String
  summarizedRequirement String
  status                RequirementStatus @default(PENDING)
  userId                String?
  user                  User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  clusterId             String?
  cluster               Cluster? @relation(fields: [clusterId], references: [id], onDelete: SetNull)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model Cluster {
  id                String   @id @default(cuid())
  name              String
  description       String
  requirementCount  Int      @default(0)
  firstDetectedAt   DateTime @default(now())
  lastDetectedAt    DateTime @default(now())
  requirements      Requirement[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model PrivacyAuditLog {
  id         String   @id @default(cuid())
  action     String   // CREATE, READ, UPDATE, DELETE
  entityType String   // User, Requirement, Cluster, etc.
  entityId   String
  actorType  String   // USER, ADMIN, SYSTEM
  actorId    String?
  actor      User?    @relation(fields: [actorId], references: [id])
  changes    Json?
  reason     String?
  createdAt  DateTime @default(now())
}

model DataDeletionQueue {
  id              String   @id @default(cuid())
  entityType      String
  entityId        String
  deletionReason  String
  scheduledAt     DateTime
  requestedBy     String?
  requestedByUser User?    @relation(fields: [requestedBy], references: [id])
  processedAt     DateTime?
  processedBy     String?
  status          DeletionStatus @default(PENDING)
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## API Endpoints

### Public Endpoints

- `POST /api/requirements` - Submit a requirement (authenticated)
- `GET /api/requirements` - List requirements (admin only)
- `POST /api/mock/requirements` - 已退役；仅本地开发时临时可用

### Admin Endpoints (require ADMIN role)

- `GET /api/admin/users` - List users with pagination and filtering
- `PATCH /api/admin/users` - Update user role
- `DELETE /api/admin/users` - Deactivate user (soft delete)
- `GET /api/admin/settings` - Get system settings
- `POST /api/admin/settings` - Create system settings
- `PUT /api/admin/settings` - Update system settings
- `GET /api/admin/requirements` - List requirements with filtering
- `PATCH /api/admin/requirements` - Update requirement status
- `GET /api/admin/clusters` - List clusters
- `POST /api/admin/clusters` - Create cluster
- `GET /api/admin/analytics` - System analytics with time range
- `GET /api/admin/audit-logs` - Privacy audit logs with filtering
- `GET /api/admin/privacy-requests` - Data deletion requests
- `PATCH /api/admin/privacy-requests` - Update request status
- `GET /api/admin/system-health` - System health metrics

## Security Implementation

### 1. **Authentication & Authorization**

- NextAuth.js with GitHub OAuth provider
- Role-based middleware for API routes
- Session validation on all admin routes

### 2. **Input Validation**

- Zod schemas for all API endpoints
- Custom validation utilities in `lib/validation.ts`
- XSS prevention with HTML sanitization

### 3. **Rate Limiting**

- In-memory rate limiter with Redis fallback
- Configurable limits per endpoint type
- IP-based and user-based limiting

### 4. **Privacy & Compliance**

- Email masking for admin views
- Privacy audit logging for all admin actions
- GDPR-compliant data deletion queue
- Consent management for requirement submission

### 5. **Headers & CSP**

- Content Security Policy headers in middleware
- CSRF protection with token validation
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

## Development Environment

### Prerequisites

- Node.js 18+ (currently 24.10.0 with simdjson issue)
- npm or yarn
- GitHub OAuth app for authentication
- Redis (optional, for production rate limiting)

### Setup

```bash
npm install
cp .env.example .env  # Configure environment variables
npm run dev
```

### Testing

```bash
npm test              # Run test suite
npm run test:e2e      # End-to-end tests
npm run test:coverage # Test coverage report
```

### Code Quality

```bash
npm run lint          # ESLint check
npm run format        # Prettier formatting
npm run type-check    # TypeScript compilation check
```

## Next Steps & Priority Order

### Phase 1: Complete Admin UI (High Priority)

1. ✅ **Create admin audit logs page** - Filterable table of privacy audit logs
2. ✅ **Create admin privacy requests page** - Manage data deletion requests
3. ✅ **Create admin system health page** - Monitor system status
4. ✅ **Update admin layout with navigation sidebar** - Unified navigation

### Phase 2: Claude Code Integration (High Priority)

1. **Research Claude Code API documentation** - User provided URL: https://platform.claude.com/docs/en/home
2. **Implement real Claude Code API client** - Replace mock integration
3. **Implement WebSocket connection** - Real-time event handling
4. **Implement OAuth authentication** - Claude Code plugin authentication
5. **Create plugin manifest and packaging** - Distribution as Claude Code plugin

### Phase 3: Advanced Features (Medium Priority)

1. **Implement vector embeddings for requirements** - AI-powered similarity detection
2. **Integrate vector database** - Pinecone or Weaviate for clustering
3. **Add interactive charts to analytics** - Chart.js or Recharts
4. **Implement email notifications** - Nodemailer integration
5. **Create user dashboard** - Personal insights and requirement history

### Phase 4: Production Readiness (Medium Priority)

1. **Fix Prisma migration issue** - Resolve simdjson library mismatch
2. **Implement Redis for rate limiting** - Production-ready rate limiting
3. **Add monitoring integration** - Sentry for error tracking
4. **Docker containerization** - Easy deployment
5. **Performance optimization** - Caching, database optimization

### Phase 5: Documentation & Polish (Low Priority)

1. **API documentation** - Swagger/OpenAPI specification
2. **User documentation** - How-to guides for admins and users
3. **Developer documentation** - Architecture decisions and contributing guide
4. **Accessibility audit** - WCAG compliance
5. **Internationalization** - Multi-language support (P3-14 done)

## Critical Dependencies & Decisions Needed

### 1. **Claude Code API Access**

- Need detailed API documentation for real integration
- OAuth client credentials from Claude Code
- WebSocket endpoint details for real-time events

### 2. **Vector Database Selection**

- Choose between Pinecone, Weaviate, or pgvector
- Consider cost, performance, and maintenance
- Need to update database schema accordingly

### 3. **Production Hosting**

- Platform decision: Vercel, AWS, Railway, etc.
- Database hosting: Supabase, AWS RDS, etc.
- Redis hosting: Upstash, Redis Cloud, etc.

### 4. **Monitoring & Observability**

- Error tracking: Sentry, LogRocket, etc.
- Performance monitoring: Datadog, New Relic, etc.
- Log aggregation: Logtail, Papertrail, etc.

## Success Metrics

### Functional Requirements

- [x] Requirement submission and processing
- [x] User authentication and authorization
- [x] Admin dashboard with basic functionality
- [ ] Real Claude Code integration
- [ ] AI-powered clustering
- [ ] Comprehensive analytics
- [ ] Production deployment

### Non-Functional Requirements

- [x] Security compliance (CSP, CSRF, rate limiting)
- [x] Privacy compliance (GDPR, audit logging)
- [ ] Performance (response time < 200ms)
- [ ] Reliability (99.9% uptime)
- [ ] Maintainability (test coverage > 80%)
- [ ] Scalability (handle 1000+ concurrent users)

## Notes for Next Developer

### Key Architectural Decisions

1. **Next.js App Router** - Using latest patterns with server components where appropriate
2. **Prisma ORM** - Type-safe database access with SQLite for development
3. **Tailwind CSS** - Utility-first styling for consistency
4. **Zod Validation** - Type-safe validation at API boundaries
5. **File-based Settings** - Temporary solution until Prisma migration issue resolved

### Development Patterns

- API routes follow REST conventions with consistent error handling
- Admin pages are being converted to client components for real-time updates
- Services follow singleton pattern for shared state management
- Logging uses structured JSON format for production monitoring

### Testing Strategy

- Unit tests for utilities and services
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Test coverage tracked but not enforced (currently 93 passing tests)

### Current Focus

The immediate priority is completing the admin UI and implementing real Claude Code integration. The project has strong foundations but needs these core features to be truly "ready to use and easy to use" as requested by the stakeholder.

---

_Last Updated: 2026-02-25_
_Documentation Maintainer: Claude (deepseek-chat)_
_Project Goal: Make DemandPulse a mature, production-ready platform for developer requirement analysis_

### Progress Summary (2026-02-25)

- **Branch**: main, 3 commits ahead of origin (plugin Stop hook + transcript_path, OpenAPI sort/me/insights/organizations, dashboard Your teams widget).
- **CI/CD**: GitHub Actions – test (lint + tests), build (Next.js), deploy (Vercel), security (audit, license, gitleaks). Pipeline runs on push to main.
- **Status**: Working tree clean. Core platform complete; plugin path for Claude Code done; admin UI, auth, security, Docker, monitoring, i18n, teams/orgs in place.
