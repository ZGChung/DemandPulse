/* global console, process */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const CLUSTER_NAME = "Authentication Systems";
const CLUSTER_DESCRIPTION = "Login, OAuth, 2FA, and security requirements";
const SEED_PREFIX = "seed-auth-systems";

const AUTH_REQUIREMENTS = [
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
];

function buildRequirementText(summary, index) {
  return `${summary}. Acceptance criteria: secure implementation, production-ready validation, auditability, and admin visibility for authentication events. Seed item ${index + 1} of ${AUTH_REQUIREMENTS.length}.`;
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
    const now = new Date();

    const existingCluster = await prisma.requirementCluster.findFirst({
      where: { name: CLUSTER_NAME },
      select: { id: true },
    });

    const cluster = existingCluster
      ? await prisma.requirementCluster.update({
          where: { id: existingCluster.id },
          data: {
            description: CLUSTER_DESCRIPTION,
          },
        })
      : await prisma.requirementCluster.create({
          data: {
            name: CLUSTER_NAME,
            description: CLUSTER_DESCRIPTION,
            requirementCount: 0,
            firstDetectedAt: now,
            lastDetectedAt: now,
          },
        });

    await prisma.requirement.deleteMany({
      where: {
        conversationId: {
          startsWith: SEED_PREFIX,
        },
      },
    });

    const requirementIds = [];

    for (const [index, summary] of AUTH_REQUIREMENTS.entries()) {
      const detectedAt = new Date(now.getTime() - (AUTH_REQUIREMENTS.length - index) * 60 * 60 * 1000);
      const requirement = await prisma.requirement.create({
        data: {
          originalRequirement: buildRequirementText(summary, index),
          summarizedRequirement: summary,
          conversationId: `${SEED_PREFIX}-${String(index + 1).padStart(2, "0")}`,
          workspacePath: "/seed/authentication-systems",
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
        requirementCount: AUTH_REQUIREMENTS.length,
        firstDetectedAt: new Date(now.getTime() - AUTH_REQUIREMENTS.length * 60 * 60 * 1000),
        lastDetectedAt: now,
      },
    });

    console.log(
      JSON.stringify(
        {
          clusterId: cluster.id,
          clusterName: CLUSTER_NAME,
          requirementCount: AUTH_REQUIREMENTS.length,
          requirementIds,
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
