/* global console, process */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const USER_COUNT = Number(process.env.USER_COUNT || 100);
const TARGET_REQUIREMENTS_PER_USER = Number(process.env.TARGET_REQUIREMENTS_PER_USER || 2);
const USER_EMAIL_PREFIX = process.env.USER_EMAIL_PREFIX || "seed-user";
const USER_EMAIL_DOMAIN = process.env.USER_EMAIL_DOMAIN || "example.com";
const REUSABLE_REQUIREMENT_PREFIXES = ["seed-", "coldstart-"];

const CLUSTER_TEMPLATES = {
  "Authentication Systems": [
    "Add organization-wide session anomaly alerts",
    "Implement delegated admin login approvals",
    "Support tenant-specific SSO branding flows",
    "Add MFA recovery flows with audit trails",
    "Improve account lockout review tooling",
    "Add re-authentication for critical profile changes",
    "Support passkey onboarding prompts after first login",
    "Implement adaptive login policies by team role",
  ],
  "Data Visualization": [
    "Add multi-segment trend comparison dashboards",
    "Support saved chart presets for repeated analysis",
    "Create product usage scorecards for leadership reviews",
    "Improve chart annotations for weekly reporting",
    "Add live metric boards for customer success teams",
    "Support richer dashboard filtering by plan and region",
    "Create compact KPI cards for mobile reporting views",
    "Add comparative charts for release-over-release analysis",
  ],
  "API Development": [
    "Add signed webhook replay for failed partner deliveries",
    "Support usage quotas by API client workspace",
    "Build integration health endpoints for external systems",
    "Add SDK examples for high-volume import workflows",
    "Implement asynchronous job polling for bulk operations",
    "Support versioned partner APIs with deprecation headers",
    "Add audit visibility for privileged integration tokens",
    "Create integration diagnostics for sandbox environments",
  ],
  "Mobile Optimization": [
    "Improve mobile navigation responsiveness on low-end devices",
    "Add compact mobile cards for dense project lists",
    "Support better mobile onboarding progress states",
    "Optimize mobile filter drawers for one-handed use",
    "Add adaptive layouts for mobile analytics snapshots",
    "Improve mobile loading placeholders on slow networks",
    "Support device-aware push notification preferences",
    "Add mobile-safe interactions for settings forms",
  ],
  "DevOps Automation": [
    "Add environment drift summaries to deployment reviews",
    "Support rollback checkpoints in production rollout flows",
    "Create reusable pipeline templates for service teams",
    "Add release gating based on service health signals",
    "Support staged infrastructure rollout orchestration",
    "Improve deployment alerting for failed migrations",
    "Add approval workflows for sensitive production changes",
    "Create audit summaries for infrastructure automation jobs",
  ],
};

function makeUserEmail(index) {
  return `${USER_EMAIL_PREFIX}-${String(index).padStart(3, "0")}@${USER_EMAIL_DOMAIN}`;
}

function makeUserName(index) {
  return `Seed User ${String(index).padStart(3, "0")}`;
}

function shouldReuseRequirement(conversationId) {
  return REUSABLE_REQUIREMENT_PREFIXES.some((prefix) => conversationId.startsWith(prefix));
}

function buildGeneratedRequirementText(summary, clusterName, clusterDescription, seedNumber) {
  return `${summary}. Cold-start seed item ${seedNumber} for ${clusterName}. Context: ${clusterDescription}. Acceptance criteria: production-ready implementation, measurable impact, admin visibility, and clear rollout notes.`;
}

async function ensureColdStartUsers(prisma) {
  const now = new Date();
  const users = [];

  for (let index = 1; index <= USER_COUNT; index += 1) {
    const createdAt = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);
    const email = makeUserEmail(index);
    const name = makeUserName(index);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        role: "USER",
        emailVerified: now,
      },
      create: {
        email,
        name,
        role: "USER",
        emailVerified: now,
        createdAt,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: { requirements: true },
        },
      },
    });

    users.push(user);
  }

  return users;
}

async function getReusableRequirements(prisma) {
  const requirements = await prisma.requirement.findMany({
    where: {
      userId: null,
    },
    select: {
      id: true,
      conversationId: true,
    },
    orderBy: {
      detectedAt: "asc",
    },
  });

  return requirements.filter((requirement) => shouldReuseRequirement(requirement.conversationId));
}

async function createColdStartRequirement(prisma, cluster, generationIndex) {
  const templates = CLUSTER_TEMPLATES[cluster.name] || [
    `Add more seeded demand signals for ${cluster.name}`,
  ];
  const template = templates[generationIndex % templates.length];
  const now = new Date();
  const detectedAt = new Date(now.getTime() - generationIndex * 60 * 60 * 1000);
  const conversationId = `coldstart-${cluster.id}-${String(generationIndex).padStart(4, "0")}`;

  const requirement = await prisma.requirement.create({
    data: {
      originalRequirement: buildGeneratedRequirementText(
        template,
        cluster.name,
        cluster.description,
        generationIndex + 1
      ),
      summarizedRequirement: template,
      conversationId,
      workspacePath: `/seed/cold-start/${cluster.name.toLowerCase().replace(/\s+/g, "-")}`,
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
    select: {
      id: true,
    },
  });

  return requirement.id;
}

async function syncClusterStats(prisma) {
  const clusters = await prisma.requirementCluster.findMany({
    select: { id: true },
  });

  for (const cluster of clusters) {
    const [count, range] = await Promise.all([
      prisma.requirement.count({
        where: { clusters: { some: { id: cluster.id } } },
      }),
      prisma.requirement.aggregate({
        where: { clusters: { some: { id: cluster.id } } },
        _min: { detectedAt: true },
        _max: { detectedAt: true },
      }),
    ]);

    await prisma.requirementCluster.update({
      where: { id: cluster.id },
      data: {
        requirementCount: count,
        firstDetectedAt: range._min.detectedAt || new Date(),
        lastDetectedAt: range._max.detectedAt || new Date(),
      },
    });
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  if (!Number.isInteger(USER_COUNT) || USER_COUNT <= 0) {
    throw new Error("USER_COUNT must be a positive integer");
  }

  if (!Number.isInteger(TARGET_REQUIREMENTS_PER_USER) || TARGET_REQUIREMENTS_PER_USER <= 0) {
    throw new Error("TARGET_REQUIREMENTS_PER_USER must be a positive integer");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const clusters = await prisma.requirementCluster.findMany({
      orderBy: { requirementCount: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (clusters.length === 0) {
      throw new Error("No requirement clusters found. Seed clusters before creating cold-start users.");
    }

    const users = await ensureColdStartUsers(prisma);
    const reusableRequirements = await getReusableRequirements(prisma);
    let generatedRequirements = 0;
    let assignments = 0;
    let generationIndex = 0;

    for (const user of users) {
      const currentCount = user._count.requirements;
      const neededAssignments = Math.max(TARGET_REQUIREMENTS_PER_USER - currentCount, 0);

      for (let slot = 0; slot < neededAssignments; slot += 1) {
        let requirementId;

        if (reusableRequirements.length > 0) {
          requirementId = reusableRequirements.shift().id;
          await prisma.requirement.update({
            where: { id: requirementId },
            data: { userId: user.id },
          });
        } else {
          const cluster = clusters[generationIndex % clusters.length];
          requirementId = await createColdStartRequirement(prisma, cluster, generationIndex);
          await prisma.requirement.update({
            where: { id: requirementId },
            data: { userId: user.id },
          });
          generatedRequirements += 1;
          generationIndex += 1;
        }

        assignments += 1;
      }
    }

    await syncClusterStats(prisma);

    const [coldStartUserCount, assignedRequirementCount, clusterSummary] = await Promise.all([
      prisma.user.count({
        where: {
          email: {
            startsWith: `${USER_EMAIL_PREFIX}-`,
          },
        },
      }),
      prisma.requirement.count({
        where: {
          user: {
            email: {
              startsWith: `${USER_EMAIL_PREFIX}-`,
            },
          },
        },
      }),
      prisma.requirementCluster.findMany({
        orderBy: { requirementCount: "desc" },
        select: {
          id: true,
          name: true,
          requirementCount: true,
        },
      }),
    ]);

    console.log(
      JSON.stringify(
        {
          userCountTarget: USER_COUNT,
          targetRequirementsPerUser: TARGET_REQUIREMENTS_PER_USER,
          coldStartUserCount,
          assignedRequirementCount,
          reusedExistingRequirements: assignments - generatedRequirements,
          generatedRequirements,
          clusterSummary,
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
