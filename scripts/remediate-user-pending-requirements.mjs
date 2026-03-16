import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const GEMINI_EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

async function getEmbeddings(text, apiKey) {
  if (!apiKey) return null;

  const url = `${GEMINI_EMBED_URL}?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: {
        parts: [{ text }],
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini embeddings API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const vec =
    data.embedding?.values ?? data.embeddings?.[0]?.values ?? data.data?.[0]?.embedding ?? null;

  return Array.isArray(vec) ? vec : null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const geminiApiKey = process.env.GEMINI_API_KEY || "";
  const userEmail = getArg("email");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  if (!userEmail) {
    throw new Error("Usage: node scripts/remediate-user-pending-requirements.mjs --email=user@example.com");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: userEmail, mode: "insensitive" } },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new Error(`User not found for email: ${userEmail}`);
    }

    const pendingRequirements = await prisma.requirement.findMany({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      orderBy: { detectedAt: "desc" },
      select: {
        id: true,
        originalRequirement: true,
        summarizedRequirement: true,
        status: true,
        embedding: true,
        detectedAt: true,
      },
    });

    console.log(
      JSON.stringify(
        {
          user,
          pendingCount: pendingRequirements.length,
          pendingIds: pendingRequirements.map((req) => req.id),
        },
        null,
        2
      )
    );

    for (const requirement of pendingRequirements) {
      let embedding = Array.isArray(requirement.embedding) ? requirement.embedding : null;

      if (!embedding || embedding.length === 0) {
        try {
          embedding = await getEmbeddings(requirement.originalRequirement, geminiApiKey);
        } catch (error) {
          console.error(
            `Embedding generation failed for ${requirement.id}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      await prisma.requirement.update({
        where: { id: requirement.id },
        data: {
          embedding: embedding ?? undefined,
          status: "PROCESSED",
          processedAt: new Date(),
        },
      });

      console.log(
        JSON.stringify(
          {
            id: requirement.id,
            previousStatus: requirement.status,
            newStatus: "PROCESSED",
            embeddingGenerated: !!(embedding && embedding.length > 0),
          },
          null,
          2
        )
      );
    }

    const finalRequirements = await prisma.requirement.findMany({
      where: {
        userId: user.id,
      },
      orderBy: { detectedAt: "desc" },
      select: {
        id: true,
        summarizedRequirement: true,
        status: true,
        processedAt: true,
      },
      take: 10,
    });

    console.log(
      JSON.stringify(
        {
          recentRequirements: finalRequirements,
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
