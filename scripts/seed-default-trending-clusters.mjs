/* global console, process */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const CLUSTERS = [
  {
    name: "Authentication Systems",
    description: "Login, OAuth, 2FA, and security requirements",
    prefix: "seed-auth-systems",
    workspacePath: "/seed/authentication-systems",
    acceptanceArea: "authentication events",
    requirements: [
      "Add NextAuth.js with Google OAuth for customer login",
      "Implement GitHub OAuth for developer accounts",
      "Add Microsoft SSO for enterprise workspace login",
      "Support Apple Sign In on web and iOS",
      "Implement passwordless magic-link authentication",
      "Add email verification during account registration",
      "Require two-factor authentication for admin users",
      "Offer TOTP-based MFA with authenticator apps",
      "Add backup recovery codes for MFA reset",
      "Implement SMS-based one-time passcodes as MFA fallback",
      "Lock accounts after repeated failed login attempts",
      "Add device recognition and suspicious-login alerts",
      "Support session revocation from account settings",
      "Implement refresh-token rotation for web sessions",
      "Expire inactive sessions after configurable timeout",
      "Add remember-me login with secure long-lived sessions",
      "Enforce strong password rules and breach-password checks",
      "Add self-service password reset via email links",
      "Build admin-only impersonation with audit logging",
      "Support organization SAML authentication",
      "Support SCIM user provisioning for enterprise customers",
      "Implement RBAC for auth-protected admin routes",
      "Add fine-grained permissions for team resources",
      "Protect API routes with JWT access tokens",
      "Support token introspection for internal APIs",
      "Implement API key management with scoped permissions",
      "Add account linking across OAuth and email login",
      "Support anonymous-to-authenticated account upgrade",
      "Add step-up authentication for billing actions",
      "Verify email ownership before changing login email",
      "Add secure account deletion with re-authentication",
      "Support WebAuthn passkeys for passwordless login",
      "Add CAPTCHA after abnormal login patterns",
      "Implement IP allowlists for admin authentication",
      "Add audit trails for login and logout events",
      "Show active sessions and recent login history",
      "Support tenant-aware login pages for organizations",
      "Implement invitation-based onboarding with auth acceptance",
      "Add secure token signing key rotation",
      "Enforce CSRF protection on session-based auth flows",
      "Support mobile deep links for password reset and magic links",
      "Implement biometric re-auth prompts in native clients",
    ],
  },
  {
    name: "Data Visualization",
    description: "Dashboards, charts, and analytics tools",
    prefix: "seed-data-viz",
    workspacePath: "/seed/data-visualization",
    acceptanceArea: "analytics dashboards",
    requirements: [
      "Build an executive KPI dashboard with real-time updates",
      "Add customizable line, bar, and pie charts for product metrics",
      "Support drill-down analytics from summary cards into raw events",
      "Create cohort retention visualizations for signup and activation",
      "Add funnel charts for onboarding conversion analysis",
      "Implement reusable dashboard widgets with drag-and-drop layout",
      "Support date-range comparison overlays on time-series charts",
      "Add export to PNG, SVG, and CSV for all charts",
      "Create heatmaps for user activity by hour and weekday",
      "Build geographic maps for regional usage analytics",
      "Add anomaly detection markers to dashboard trend lines",
      "Support dark mode across analytics dashboards",
      "Implement role-based dashboard visibility for teams",
      "Add embeddable charts for customer-facing reporting portals",
      "Create benchmarking widgets to compare teams or tenants",
      "Support real-time streaming visualizations for system telemetry",
      "Add goal tracking cards with progress indicators",
      "Implement histogram views for performance distribution analysis",
      "Add stacked area charts for product usage segmentation",
      "Support dual-axis charts for correlated business metrics",
      "Build interactive tooltips with annotations and notes",
      "Create user-defined calculated metrics in dashboards",
      "Add table-to-chart toggles for every analytics module",
      "Support scheduled dashboard snapshots by email",
      "Build campaign attribution reports with visual breakdowns",
      "Add dashboards for customer support ticket trends",
      "Implement feature adoption charts by plan tier",
      "Create SLA reporting widgets for operations teams",
      "Support threshold alerts directly from dashboard components",
      "Add forecasting visualizations for monthly growth projections",
      "Build finance dashboards for MRR, churn, and expansion revenue",
      "Add project burndown and velocity charts for engineering teams",
      "Support zooming and panning on dense time-series data",
      "Create retention matrices for subscription analytics",
      "Add dashboard comments and collaborative annotations",
      "Implement accessibility improvements for chart screen readers",
      "Support multi-source dashboards combining API and warehouse data",
      "Add shareable dashboard links with viewer permissions",
    ],
  },
  {
    name: "API Development",
    description: "REST APIs, GraphQL, and integration tools",
    prefix: "seed-api-dev",
    workspacePath: "/seed/api-development",
    acceptanceArea: "api integrations",
    requirements: [
      "Design a versioned REST API for customer account management",
      "Add OpenAPI documentation generation for every public endpoint",
      "Implement GraphQL schema federation across core services",
      "Support API rate limiting with per-plan quotas",
      "Add API key creation, rotation, and revocation controls",
      "Build webhook delivery with retries and signing secrets",
      "Implement idempotency keys for payment-related mutations",
      "Add cursor pagination for high-volume list endpoints",
      "Support partial response fields in REST API queries",
      "Create a developer portal for API onboarding and testing",
      "Add request/response examples in all API docs",
      "Implement OAuth scopes for third-party integrations",
      "Support sandbox mode for integration testing",
      "Add GraphQL persisted queries for performance optimization",
      "Build an SDK generator for TypeScript and Python clients",
      "Add API usage analytics for external developers",
      "Implement optimistic concurrency controls on write endpoints",
      "Support multipart file uploads through the public API",
      "Add API contract testing to CI pipelines",
      "Create mock servers from OpenAPI specs for local development",
      "Support bulk import and export endpoints for large datasets",
      "Add GraphQL subscriptions for live updates",
      "Implement webhook event replay from the admin console",
      "Create endpoint deprecation notices and migration headers",
      "Add API error codes with remediation guidance",
      "Support mTLS for enterprise API integrations",
      "Implement per-tenant API throttling and isolation",
      "Add audit logs for third-party API access",
      "Support HMAC request signing for partner integrations",
      "Create background jobs API for long-running tasks",
      "Add Postman collection generation from API docs",
      "Implement schema validation middleware for incoming payloads",
      "Support batched GraphQL operations with cost controls",
      "Add endpoint health checks and uptime status reporting",
      "Create integration templates for Stripe, Slack, and Salesforce",
    ],
  },
  {
    name: "Mobile Optimization",
    description: "Responsive design and mobile features",
    prefix: "seed-mobile-opt",
    workspacePath: "/seed/mobile-optimization",
    acceptanceArea: "mobile experience",
    requirements: [
      "Optimize dashboard layouts for small mobile screens",
      "Improve tap targets and spacing across navigation menus",
      "Add bottom-tab navigation for core mobile workflows",
      "Support offline mode for reading cached project data",
      "Implement image lazy loading for faster mobile page loads",
      "Reduce bundle size for mobile-first landing pages",
      "Add mobile-specific onboarding flows with swipe gestures",
      "Support biometric unlock for sensitive account actions",
      "Improve keyboard handling in mobile form submissions",
      "Add infinite scrolling for long mobile content feeds",
      "Create responsive tables that collapse into cards on phones",
      "Support push notifications for task updates",
      "Add install prompts for progressive web app usage",
      "Implement skeleton states optimized for slow mobile networks",
      "Support safe-area insets for modern iPhone devices",
      "Improve mobile chart rendering and touch interactions",
      "Add pull-to-refresh behavior on dashboard views",
      "Optimize media uploads over unstable cellular connections",
      "Support device-specific deep links into app screens",
      "Add haptic feedback for key mobile interactions",
      "Improve accessibility labels for mobile assistive tech",
      "Create mobile-friendly filters and faceted search drawers",
      "Optimize login and MFA screens for one-handed use",
      "Support mobile camera scanning for QR and document inputs",
      "Add compact card layouts for project summaries",
      "Implement adaptive image formats for mobile bandwidth savings",
      "Support landscape orientation for analytics views",
      "Improve Core Web Vitals for mobile traffic segments",
    ],
  },
  {
    name: "DevOps Automation",
    description: "CI/CD, deployment, and infrastructure",
    prefix: "seed-devops-auto",
    workspacePath: "/seed/devops-automation",
    acceptanceArea: "delivery pipelines",
    requirements: [
      "Automate preview environment creation for pull requests",
      "Add blue-green deployment support for production releases",
      "Implement GitHub Actions workflows for test, build, and deploy",
      "Support automatic rollback on failed health checks",
      "Add infrastructure drift detection for Terraform stacks",
      "Create self-service deployment dashboards for engineers",
      "Implement secret rotation automation across environments",
      "Add canary release orchestration with percentage rollouts",
      "Support ephemeral databases for integration testing",
      "Automate changelog generation from merged pull requests",
      "Add deployment freeze windows for critical business periods",
      "Implement CI caching to reduce build times",
      "Create runbooks linked from pipeline failure alerts",
      "Support policy checks for infrastructure changes in CI",
      "Add automated dependency update pull requests",
      "Implement observability setup during service bootstrap",
      "Support scheduled backups and restore verification jobs",
      "Automate certificate renewal for custom domains",
      "Add Slack notifications for deployment milestones",
      "Implement pipeline approval gates for production changes",
      "Create reusable CI templates for microservices",
      "Support database migration checks before deployment",
      "Add SLO-based release blocking for unstable services",
      "Implement auto-scaling rules for burst traffic workloads",
    ],
  },
];

function buildRequirementText(summary, index, total, clusterName, acceptanceArea) {
  return `${summary}. Acceptance criteria: production-ready implementation, measurable outcomes, observability, and admin visibility for ${acceptanceArea}. Seed item ${index + 1} of ${total} in ${clusterName}.`;
}

async function upsertCluster(prisma, now, clusterConfig) {
  const existingCluster = await prisma.requirementCluster.findFirst({
    where: { name: clusterConfig.name },
    select: { id: true },
  });

  return existingCluster
    ? prisma.requirementCluster.update({
        where: { id: existingCluster.id },
        data: {
          description: clusterConfig.description,
        },
      })
    : prisma.requirementCluster.create({
        data: {
          name: clusterConfig.name,
          description: clusterConfig.description,
          requirementCount: 0,
          firstDetectedAt: now,
          lastDetectedAt: now,
        },
      });
}

async function seedCluster(prisma, clusterConfig, clusterOffset) {
  const now = new Date();
  const cluster = await upsertCluster(prisma, now, clusterConfig);

  await prisma.requirement.deleteMany({
    where: {
      conversationId: {
        startsWith: clusterConfig.prefix,
      },
    },
  });

  const requirementIds = [];
  const total = clusterConfig.requirements.length;

  for (const [index, summary] of clusterConfig.requirements.entries()) {
    const hoursAgo = (clusterOffset * 100) + (total - index);
    const detectedAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    const requirement = await prisma.requirement.create({
      data: {
        originalRequirement: buildRequirementText(
          summary,
          index,
          total,
          clusterConfig.name,
          clusterConfig.acceptanceArea
        ),
        summarizedRequirement: summary,
        conversationId: `${clusterConfig.prefix}-${String(index + 1).padStart(2, "0")}`,
        workspacePath: clusterConfig.workspacePath,
        detectedAt,
        dataCollectionConsent: true,
        contactConsent: false,
        anonymizationConsent: false,
        status: "CLUSTERED",
        processedAt: now,
        dataRetentionDays: 3650,
        scheduledDeletionAt: new Date(now.getTime() + 3650 * 24 * 60 * 60 * 1000),
        clusters: {
          connect: { id: cluster.id },
        },
      },
      select: { id: true },
    });

    requirementIds.push(requirement.id);
  }

  await prisma.requirementCluster.update({
    where: { id: cluster.id },
    data: {
      requirementCount: total,
      firstDetectedAt: new Date(now.getTime() - ((clusterOffset * 100) + total) * 60 * 60 * 1000),
      lastDetectedAt: now,
    },
  });

  return {
    clusterId: cluster.id,
    clusterName: clusterConfig.name,
    requirementCount: total,
    requirementIds,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const results = [];
    for (const [index, clusterConfig] of CLUSTERS.entries()) {
      results.push(await seedCluster(prisma, clusterConfig, index));
    }

    console.log(JSON.stringify({ clusters: results }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
