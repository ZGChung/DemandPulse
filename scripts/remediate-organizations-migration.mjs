import { execSync } from "node:child_process";
import process from "node:process";

import pg from "pg";

const migrationName = "20260220100000_add_organizations";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  globalThis.console.error("DATABASE_URL is required");
  process.exit(1);
}

const { Client } = pg;
const repairSql = `
DO $$
BEGIN
  CREATE TYPE "OrgRole" AS ENUM ('MEMBER', 'ADMIN', 'OWNER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "OrgRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "role" "OrgRole" NOT NULL DEFAULT 'MEMBER';
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX IF NOT EXISTS "Organization_slug_idx" ON "Organization"("slug");
CREATE INDEX IF NOT EXISTS "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

DO $$
BEGIN
  ALTER TABLE "OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
`;

async function getMigrationRecord(client) {
  const result = await client.query(
    `
      SELECT migration_name, started_at, finished_at, rolled_back_at, logs
      FROM "_prisma_migrations"
      WHERE migration_name = $1
      ORDER BY started_at DESC
      LIMIT 1
    `,
    [migrationName]
  );

  return result.rows[0] ?? null;
}

async function getRepairState(client) {
  const result = await client.query(`
    SELECT
      EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrgRole') AS has_org_role,
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Organization') AS has_organization_table,
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'OrganizationMember') AS has_organization_member_table,
      EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Organization_slug_key') AS has_org_slug_key,
      EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Organization_slug_idx') AS has_org_slug_idx,
      EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'OrganizationMember_organizationId_idx') AS has_member_org_idx,
      EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'OrganizationMember_userId_idx') AS has_member_user_idx,
      EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'OrganizationMember_organizationId_userId_key') AS has_member_unique_idx,
      EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrganizationMember_organizationId_fkey') AS has_member_org_fk,
      EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrganizationMember_userId_fkey') AS has_member_user_fk
  `);

  return result.rows[0];
}

function isRepairComplete(repairState) {
  return Object.values(repairState).every(Boolean);
}

async function applyRepair(client) {
  globalThis.console.log("Applying direct SQL repair for organizations migration.");
  await client.query(repairSql);
}

function run(command) {
  execSync(command, { stdio: "inherit" });
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const record = await getMigrationRecord(client);

    if (!record) {
      globalThis.console.log(`No existing record for ${migrationName}. Running migrate deploy.`);
      run("npx prisma migrate deploy");
      return;
    }

    const isFailed = record.finished_at === null && record.rolled_back_at === null;
    const isRolledBack = record.rolled_back_at !== null;
    const isApplied = record.finished_at !== null && record.rolled_back_at === null;

    globalThis.console.log(
      JSON.stringify(
        {
          migrationName,
          startedAt: record.started_at,
          finishedAt: record.finished_at,
          rolledBackAt: record.rolled_back_at,
          isFailed,
          isRolledBack,
          isApplied,
        },
        null,
        2
      )
    );

    if (isApplied) {
      globalThis.console.log(`${migrationName} is already applied. Nothing to remediate.`);
      return;
    }

    if (isFailed) {
      globalThis.console.log(`Resolving failed migration ${migrationName} as rolled back.`);
      run(`npx prisma migrate resolve --rolled-back ${migrationName}`);
    }

    let repairState = await getRepairState(client);
    globalThis.console.log(JSON.stringify({ repairState }, null, 2));

    if (!isRepairComplete(repairState)) {
      await applyRepair(client);
      repairState = await getRepairState(client);
      globalThis.console.log(JSON.stringify({ repairStateAfterRepair: repairState }, null, 2));
    }

    if (!isRepairComplete(repairState)) {
      throw new Error("Organizations migration repair is incomplete after SQL remediation");
    }

    globalThis.console.log(`Marking ${migrationName} as applied.`);
    run(`npx prisma migrate resolve --applied ${migrationName}`);

    globalThis.console.log("Running migrate deploy after remediation.");
    run("npx prisma migrate deploy");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  globalThis.console.error("Failed to remediate organizations migration", error);
  process.exit(1);
});
