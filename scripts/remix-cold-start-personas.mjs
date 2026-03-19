/* global console, process */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const USER_EMAIL_PREFIX = process.env.USER_EMAIL_PREFIX || "seed-user";
const BATCH_LABEL = process.env.BATCH_LABEL || "";
const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Avery",
  "Parker",
  "Cameron",
  "Quinn",
  "Drew",
  "Logan",
  "Hayden",
  "Sydney",
  "Reese",
  "Harper",
  "Rowan",
  "Emerson",
  "Blake",
  "Finley",
];
const LAST_NAMES = [
  "Chen",
  "Patel",
  "Martinez",
  "Nguyen",
  "Kim",
  "Johnson",
  "Garcia",
  "Wright",
  "Singh",
  "Brown",
  "Lopez",
  "Lee",
  "Clark",
  "Young",
  "Walker",
  "Hall",
  "Allen",
  "Scott",
  "Green",
  "Baker",
];

function userPrefix() {
  return BATCH_LABEL ? `${USER_EMAIL_PREFIX}-${BATCH_LABEL}-` : `${USER_EMAIL_PREFIX}-`;
}

function conversationPrefix() {
  return BATCH_LABEL ? `coldstart-${BATCH_LABEL}-` : "coldstart-";
}

function workspacePrefix() {
  return BATCH_LABEL ? `/seed/cold-start/${BATCH_LABEL}/` : "/seed/cold-start/";
}

function pseudoRandom(seed) {
  const value = Math.sin(seed * 9999) * 10000;
  return value - Math.floor(value);
}

function buildUserName(index) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  return `${first} ${last}`;
}

function buildUserImage(name, index) {
  const palette = ["0F172A", "1D4ED8", "0F766E", "7C3AED", "BE123C", "92400E"];
  const background = palette[index % palette.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=ffffff`;
}

function buildCreatedAt(index, now) {
  const dayOffset = Math.floor(pseudoRandom(index + 101) * 200) + 3;
  return new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
}

function buildDetectedAt(index, now) {
  const bucket = pseudoRandom(index + 301);
  let dayOffset;

  if (bucket < 0.15) {
    dayOffset = Math.floor(pseudoRandom(index + 302) * 2);
  } else if (bucket < 0.38) {
    dayOffset = 2 + Math.floor(pseudoRandom(index + 303) * 6);
  } else if (bucket < 0.62) {
    dayOffset = 8 + Math.floor(pseudoRandom(index + 304) * 12);
  } else if (bucket < 0.84) {
    dayOffset = 20 + Math.floor(pseudoRandom(index + 305) * 18);
  } else {
    dayOffset = 38 + Math.floor(pseudoRandom(index + 306) * 50);
  }

  const minuteOffset = Math.floor(pseudoRandom(index + 307) * 24 * 60);
  return new Date(now.getTime() - (dayOffset * 24 * 60 + minuteOffset) * 60 * 1000);
}

async function runInChunks(items, chunkSize, callback) {
  for (let index = 0; index < items.length; index += chunkSize) {
    const chunk = items.slice(index, index + chunkSize);
    await callback(chunk, index);
  }
}

async function runWithConcurrency(items, concurrency, callback) {
  for (let index = 0; index < items.length; index += concurrency) {
    const chunk = items.slice(index, index + concurrency);
    await Promise.all(chunk.map((item, chunkIndex) => callback(item, index + chunkIndex)));
  }
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
    const now = new Date();
    const users = await prisma.user.findMany({
      where: {
        email: {
          startsWith: userPrefix(),
        },
      },
      orderBy: {
        email: "asc",
      },
      select: {
        id: true,
        email: true,
      },
    });

    const requirements = await prisma.requirement.findMany({
      where: {
        OR: [
          {
            conversationId: {
              startsWith: conversationPrefix(),
            },
          },
          {
            workspacePath: {
              startsWith: workspacePrefix(),
            },
          },
        ],
      },
      orderBy: {
        conversationId: "asc",
      },
      select: {
        id: true,
      },
    });

    await runInChunks(users, 20, async (chunk, startIndex) => {
      await runWithConcurrency(chunk, 5, async (user, chunkIndex) => {
        const absoluteIndex = startIndex + chunkIndex;
        const name = buildUserName(absoluteIndex);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            name,
            image: buildUserImage(name, absoluteIndex),
            createdAt: buildCreatedAt(absoluteIndex, now),
          },
        });
      });
    });

    await runInChunks(requirements, 20, async (chunk, startIndex) => {
      await runWithConcurrency(chunk, 5, async (requirement, chunkIndex) => {
        const absoluteIndex = startIndex + chunkIndex;
        const detectedAt = buildDetectedAt(absoluteIndex, now);

        await prisma.requirement.update({
          where: { id: requirement.id },
          data: {
            detectedAt,
            processedAt: new Date(detectedAt.getTime() + 5 * 60 * 1000),
            createdAt: detectedAt,
          },
        });
      });
    });

    await syncClusterStats(prisma);

    console.log(
      JSON.stringify(
        {
          batchLabel: BATCH_LABEL || null,
          updatedUsers: users.length,
          updatedRequirements: requirements.length,
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
