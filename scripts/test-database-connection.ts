#!/usr/bin/env ts-node
/**
 * Test script to verify database connection
 * Usage: npx ts-node scripts/test-database-connection.ts
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

import { validateEnv } from "../lib/env";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...\n");

  try {
    // Validate environment variables
    console.log("1. Validating environment variables...");
    validateEnv();
    console.log("   ✅ Environment validation passed\n");
  } catch (error: any) {
    console.log("   ❌ Environment validation failed:", error.message);
    console.log("\n   Make sure DATABASE_URL is set in .env.local");
    console.log("   Run: cp .env.example .env.local and update DATABASE_URL");
    return;
  }

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("❌ DATABASE_URL is not set in environment variables");
    console.log("\nPlease set DATABASE_URL in .env.local file");
    console.log("Example for Neon PostgreSQL:");
    console.log(
      "DATABASE_URL=postgresql://neondb_owner:password@ep-instance.pooler.us-east-2.aws.neon.tech/demandpulse?sslmode=require"
    );
    return;
  }

  console.log("2. Checking DATABASE_URL format...");

  // Basic URL validation
  try {
    if (databaseUrl.startsWith("postgresql://")) {
      const url = new URL(databaseUrl.replace("postgresql://", "http://"));
      console.log(`   ✅ PostgreSQL URL format`);
      console.log(`   Host: ${url.hostname}`);
      console.log(`   Database: ${url.pathname.replace("/", "") || "default"}\n`);
    } else if (databaseUrl.startsWith("file:")) {
      console.log(`   ✅ SQLite URL format`);
      console.log(`   Database file: ${databaseUrl.replace("file:", "")}\n`);
    } else {
      console.log(`   ⚠️  Unknown URL format: ${databaseUrl.substring(0, 50)}...\n`);
    }
  } catch (error) {
    console.log("   ⚠️  URL format warning (continuing anyway)");
  }

  console.log("3. Testing Prisma Client connection...");

  let prisma: PrismaClient | null = null;
  try {
    prisma = new PrismaClient({
      log: ["error", "warn"],
    });

    // Test connection with a simple query
    let result;
    if (databaseUrl.startsWith("postgresql://")) {
      result = await prisma.$queryRaw`SELECT version() as version`;
      console.log("   ✅ Database connection successful!");

      if (result && Array.isArray(result) && result[0]) {
        const version = (result[0] as any).version;
        console.log(`   PostgreSQL Version: ${version.split(",")[0]}`);
      }
    } else if (databaseUrl.startsWith("file:")) {
      // SQLite connection test
      result = await prisma.$queryRaw`SELECT sqlite_version() as version`;
      console.log("   ✅ Database connection successful!");

      if (result && Array.isArray(result) && result[0]) {
        const version = (result[0] as any).version;
        console.log(`   SQLite Version: ${version}`);
      }
    } else {
      console.log("   ✅ Database connection successful! (unknown database type)");
    }

    // Test if tables exist
    console.log("\n4. Checking database schema...");
    try {
      let tables;
      if (databaseUrl.startsWith("postgresql://")) {
        tables = await prisma.$queryRaw`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name
        `;
      } else if (databaseUrl.startsWith("file:")) {
        // SQLite table query
        tables = await prisma.$queryRaw`
          SELECT name as table_name
          FROM sqlite_master
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
          ORDER BY name
        `;
      } else {
        console.log("   ℹ️  Cannot check tables for unknown database type");
        return;
      }

      if (Array.isArray(tables) && tables.length > 0) {
        console.log(`   ✅ Found ${tables.length} table(s):`);
        tables.forEach((table: any) => {
          console.log(`      - ${table.table_name}`);
        });
      } else {
        console.log("   ℹ️  No tables found in database");
        console.log("   Run: npx prisma db push to create tables");
      }
    } catch (schemaError: any) {
      console.log("   ℹ️  Could not check tables (database might be empty)");
    }
  } catch (error: any) {
    console.log("   ❌ Database connection failed:", error.message);

    // Provide helpful error messages
    if (error.message.includes("SSL")) {
      console.log("\n   💡 SSL Connection Issue:");
      console.log("   Add ?sslmode=require to your DATABASE_URL");
      console.log("   Example: postgresql://...?sslmode=require");
    } else if (error.message.includes("timeout")) {
      console.log("\n   💡 Connection Timeout:");
      console.log("   Add &connect_timeout=30 to your DATABASE_URL");
      console.log("   Example: postgresql://...?sslmode=require&connect_timeout=30");
    } else if (error.message.includes("authentication")) {
      console.log("\n   💡 Authentication Failed:");
      console.log("   Check your username and password in DATABASE_URL");
    } else if (error.message.includes("does not exist")) {
      console.log("\n   💡 Database Does Not Exist:");
      console.log("   Create the database first or check the database name");
    } else if (error.message.includes('engine type "client"')) {
      console.log("\n   💡 Prisma Client Configuration Issue:");
      console.log("   Current schema is configured for PostgreSQL");
      console.log("   For SQLite testing, update the schema or use PostgreSQL");
      console.log("\n   Quick options:");
      console.log("   1. Use simple test: npm run db:simple-test");
      console.log("   2. Set up PostgreSQL locally");
      console.log("   3. Use Neon PostgreSQL (cloud)");
    }

    return;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log("\n5. Cleanup: Database connection closed");
    }
  }

  console.log("\n🎉 Database connection test completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Run migrations: npx prisma db push");
  console.log("2. Start development server: npm run dev");
  console.log("3. Test API endpoints that use the database");
}

// Run the test
testDatabaseConnection().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
