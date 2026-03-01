#!/usr/bin/env ts-node
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Setup script for local PostgreSQL database
 * This creates a local database for testing if Neon is not available
 */

import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

async function setupLocalDatabase() {
  console.log("🚀 Setting up local PostgreSQL database for testing...\n");

  const envLocalPath = join(__dirname, "..", ".env.local");

  // Check if .env.local exists
  if (!existsSync(envLocalPath)) {
    console.log("❌ .env.local file not found");
    console.log("Run: cp .env.example .env.local");
    return;
  }

  // Read current .env.local
  let envContent = readFileSync(envLocalPath, "utf8");

  // Check if DATABASE_URL is already set (not commented out)
  const hasDatabaseUrl =
    envContent.includes("\nDATABASE_URL=") && !envContent.includes("\n# DATABASE_URL=");

  if (hasDatabaseUrl) {
    console.log("ℹ️  DATABASE_URL is already set in .env.local");
    console.log(
      "Current DATABASE_URL:",
      envContent.match(/DATABASE_URL=.*/)?.[0]?.substring(0, 50) + "..." || "Not found"
    );

    const response = "skip"; // In a real CLI, we would prompt the user
    if (response === "skip") {
      console.log("Skipping database setup...");
      return;
    }
  }

  console.log("1. Checking for PostgreSQL installation...");

  try {
    // Check if PostgreSQL is installed
    execSync("which psql", { stdio: "pipe" });
    console.log("   ✅ PostgreSQL is installed");
  } catch {
    console.log("   ❌ PostgreSQL is not running");
    console.log("\n   Start PostgreSQL:");
    console.log("   macOS: brew services start postgresql");
    console.log("   Linux: sudo systemctl start postgresql");
    console.log("   Or start your Docker container");
    return;
  }

  console.log('\n3. Creating database "demandpulse"...');

  try {
    // Try to create the database
    execSync("createdb demandpulse", { stdio: "pipe" });
    console.log('   ✅ Database "demandpulse" created');
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      console.log('   ℹ️  Database "demandpulse" already exists');
    } else {
      console.log("   ❌ Failed to create database:", error.message);
      console.log("\n   You may need to create it manually:");
      console.log("   createdb demandpulse");
      console.log("\n   Or connect as postgres user:");
      console.log("   sudo -u postgres createdb demandpulse");
      return;
    }
  }

  console.log("\n4. Updating .env.local with local database URL...");

  // Update .env.local to use local database
  const localDbUrl = "DATABASE_URL=postgresql://localhost:5432/demandpulse";

  // Replace any existing DATABASE_URL line
  if (envContent.includes("\nDATABASE_URL=")) {
    envContent = envContent.replace(/\nDATABASE_URL=.*/g, `\n${localDbUrl}`);
  } else {
    // Add it after the last environment variable
    envContent += `\n\n${localDbUrl}\n`;
  }

  writeFileSync(envLocalPath, envContent);
  console.log("   ✅ Updated .env.local with local database URL");

  console.log("\n5. Testing the connection...");

  try {
    // Generate Prisma client
    execSync("npx prisma generate", { stdio: "pipe" });
    console.log("   ✅ Prisma client generated");

    // Try to push schema
    console.log("   Pushing schema to database...");
    execSync("npx prisma db push --skip-generate", { stdio: "pipe" });
    console.log("   ✅ Schema pushed successfully");
  } catch (error: any) {
    console.log("   ❌ Failed to setup database:", error.message);
    console.log("\n   You can try manually:");
    console.log("   npx prisma generate");
    console.log("   npx prisma db push");
    return;
  }

  console.log("\n🎉 Local database setup completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Test the connection: npm run db:test");
  console.log("2. Start the development server: npm run dev");
  console.log("3. View database with Prisma Studio: npm run db:studio");
  console.log("\nTo switch to Neon PostgreSQL later:");
  console.log("1. Create a Neon database at https://neon.tech");
  console.log("2. Update DATABASE_URL in .env.local with your Neon connection string");
  console.log("3. Run: npx prisma db push");
}

// Run the setup
setupLocalDatabase().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
