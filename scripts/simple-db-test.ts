#!/usr/bin/env ts-node
/**
 * Simple database connection test
 * Usage: npx ts-node scripts/simple-db-test.ts
 */

import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function testDatabaseConfig() {
  console.log("🔍 Testing database configuration...\n");

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log("❌ DATABASE_URL is not set in environment variables");
    console.log("\nPlease set DATABASE_URL in .env.local file");
    console.log("Example for local SQLite:");
    console.log("DATABASE_URL=file:./dev.db");
    console.log("\nExample for PostgreSQL:");
    console.log("DATABASE_URL=postgresql://username:password@localhost:5432/demandpulse");
    return;
  }

  console.log("1. Checking DATABASE_URL format...");

  if (databaseUrl.startsWith("postgresql://")) {
    console.log(`   ✅ PostgreSQL URL detected`);
    console.log(`   URL: ${databaseUrl.substring(0, 50)}...`);
    console.log("\n   To test PostgreSQL connection:");
    console.log("   1. Install PostgreSQL: brew install postgresql");
    console.log("   2. Start PostgreSQL: brew services start postgresql");
    console.log("   3. Create database: createdb demandpulse");
    console.log("   4. Run: npx prisma db push");
  } else if (databaseUrl.startsWith("file:")) {
    console.log(`   ✅ SQLite URL detected`);
    console.log(`   Database file: ${databaseUrl.replace("file:", "")}`);
    console.log("\n   Note: Current schema uses PostgreSQL-specific types");
    console.log("   For SQLite testing, simplify the schema first.");
  } else {
    console.log(`   ⚠️  Unknown URL format: ${databaseUrl.substring(0, 50)}...`);
  }

  console.log("\n2. Checking Prisma configuration...");
  try {
    // Try to load Prisma config
    const { execSync } = require("child_process");
    const output = execSync("npx prisma --version", { encoding: "utf8" });
    console.log(`   ✅ Prisma CLI: ${output.trim()}`);
  } catch (error) {
    console.log("   ❌ Prisma CLI not available");
    console.log("   Run: npm install");
  }

  console.log("\n📋 Next steps:");
  console.log("1. For quick testing, use SQLite with simplified schema");
  console.log("2. For production-like testing, set up PostgreSQL");
  console.log("3. Run: npx prisma db push (after database is available)");
  console.log("4. Test with: npx ts-node scripts/test-database-connection.ts");
}

// Run the test
testDatabaseConfig().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
