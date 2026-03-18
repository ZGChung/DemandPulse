import { execSync } from "node:child_process";

import pg from "pg";

const migrationName = "20260220100000_add_organizations";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const { Client } = pg;

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

function run(command) {
  execSync(command, { stdio: "inherit" });
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const record = await getMigrationRecord(client);

    if (!record) {
      console.log(`No existing record for ${migrationName}. Running migrate deploy.`);
      run("npx prisma migrate deploy");
      return;
    }

    const isFailed = record.finished_at === null && record.rolled_back_at === null;
    const isRolledBack = record.rolled_back_at !== null;
    const isApplied = record.finished_at !== null && record.rolled_back_at === null;

    console.log(
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

    if (isFailed) {
      console.log(`Resolving failed migration ${migrationName} as rolled back.`);
      run(`npx prisma migrate resolve --rolled-back ${migrationName}`);
    }

    if (isApplied) {
      console.log(`${migrationName} is already applied. Nothing to remediate.`);
      return;
    }

    console.log("Running migrate deploy after remediation.");
    run("npx prisma migrate deploy");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to remediate organizations migration", error);
  process.exit(1);
});
