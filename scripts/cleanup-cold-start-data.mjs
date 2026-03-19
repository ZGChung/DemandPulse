/* global console, process */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const USER_EMAIL_PREFIX = process.env.USER_EMAIL_PREFIX || "seed-user";
const BATCH_LABEL = process.env.BATCH_LABEL || "";
const DELETE_SEEDED_REQUIREMENTS = process.env.DELETE_SEEDED_REQUIREMENTS === "true";

function userEmailPrefix() {
  return BATCH_LABEL ? `${USER_EMAIL_PREFIX}-${BATCH_LABEL}-` : `${USER_EMAIL_PREFIX}-`;
}

function coldstartConversationPrefix() {
  return BATCH_LABEL ? `coldstart-${BATCH_LABEL}-` : "coldstart-";
}

function coldstartWorkspacePrefix() {
  return BATCH_LABEL ? `/seed/cold-start/${BATCH_LABEL}/` : "/seed/cold-start/";
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

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const seedUsers = await prisma.user.findMany({
      where: {
        email: {
          startsWith: userEmailPrefix(),
        },
      },
      select: { id: true, email: true },
    });

    const seedUserIds = seedUsers.map((user) => user.id);

    const [unassignedRequirementsResult, deletedColdstartRequirementsResult] = await prisma.$transaction([
      prisma.requirement.updateMany({
        where: {
          userId: {
            in: seedUserIds.length > 0 ? seedUserIds : ["__none__"],
          },
        },
        data: {
          userId: null,
        },
      }),
      prisma.requirement.deleteMany({
        where: {
          OR: [
            {
              conversationId: {
                startsWith: coldstartConversationPrefix(),
              },
            },
            {
              workspacePath: {
                startsWith: coldstartWorkspacePrefix(),
              },
            },
          ],
        },
      }),
    ]);

    let deletedSeededRequirementsResult = { count: 0 };
    if (DELETE_SEEDED_REQUIREMENTS) {
      deletedSeededRequirementsResult = await prisma.requirement.deleteMany({
        where: {
          conversationId: {
            startsWith: "seed-",
          },
        },
      });
    }

    const deletedUsersResult = await prisma.user.deleteMany({
      where: {
        id: {
          in: seedUserIds.length > 0 ? seedUserIds : ["__none__"],
        },
      },
    });

    await syncClusterStats(prisma);

    console.log(
      JSON.stringify(
        {
          batchLabel: BATCH_LABEL || null,
          deletedUsers: deletedUsersResult.count,
          unassignedRequirements: unassignedRequirementsResult.count,
          deletedColdstartRequirements: deletedColdstartRequirementsResult.count,
          deletedSeededClusterRequirements: deletedSeededRequirementsResult.count,
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
