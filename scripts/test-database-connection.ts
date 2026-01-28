#!/usr/bin/env ts-node
/**
 * Test script to verify database connection
 * Usage: npx ts-node scripts/test-database-connection.ts
 */

import { PrismaClient } from '@prisma/client';
import { validateEnv } from '../lib/env';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Validate environment variables
    console.log('1. Validating environment variables...');
    validateEnv();
    console.log('   ✅ Environment validation passed\n');
  } catch (error: any) {
    console.log('   ❌ Environment validation failed:', error.message);
    console.log('\n   Make sure DATABASE_URL is set in .env.local');
    console.log('   Run: cp .env.example .env.local and update DATABASE_URL');
    return;
  }

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL is not set in environment variables');
    console.log('\nPlease set DATABASE_URL in .env.local file');
    console.log('Example for Neon PostgreSQL:');
    console.log('DATABASE_URL=postgresql://neondb_owner:password@ep-instance.pooler.us-east-2.aws.neon.tech/demandpulse?sslmode=require');
    return;
  }

  console.log('2. Checking DATABASE_URL format...');

  // Basic URL validation
  try {
    const url = new URL(databaseUrl.replace('postgresql://', 'http://'));
    console.log(`   ✅ Valid URL format`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Database: ${url.pathname.replace('/', '') || 'default'}\n`);
  } catch (error) {
    console.log('   ⚠️  URL format warning (continuing anyway)');
  }

  console.log('3. Testing Prisma Client connection...');

  let prisma: PrismaClient | null = null;
  try {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });

    // Test connection with a simple query
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('   ✅ Database connection successful!');

    if (result && Array.isArray(result) && result[0]) {
      const version = (result[0] as any).version;
      console.log(`   PostgreSQL Version: ${version.split(',')[0]}`);
    }

    // Test if tables exist
    console.log('\n4. Checking database schema...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;

      if (Array.isArray(tables) && tables.length > 0) {
        console.log(`   ✅ Found ${tables.length} table(s):`);
        tables.forEach((table: any) => {
          console.log(`      - ${table.table_name}`);
        });
      } else {
        console.log('   ℹ️  No tables found in database');
        console.log('   Run: npx prisma db push to create tables');
      }
    } catch (schemaError: any) {
      console.log('   ℹ️  Could not check tables (database might be empty)');
    }

  } catch (error: any) {
    console.log('   ❌ Database connection failed:', error.message);

    // Provide helpful error messages
    if (error.message.includes('SSL')) {
      console.log('\n   💡 SSL Connection Issue:');
      console.log('   Add ?sslmode=require to your DATABASE_URL');
      console.log('   Example: postgresql://...?sslmode=require');
    } else if (error.message.includes('timeout')) {
      console.log('\n   💡 Connection Timeout:');
      console.log('   Add &connect_timeout=30 to your DATABASE_URL');
      console.log('   Example: postgresql://...?sslmode=require&connect_timeout=30');
    } else if (error.message.includes('authentication')) {
      console.log('\n   💡 Authentication Failed:');
      console.log('   Check your username and password in DATABASE_URL');
    } else if (error.message.includes('does not exist')) {
      console.log('\n   💡 Database Does Not Exist:');
      console.log('   Create the database first or check the database name');
    }

    return;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('\n5. Cleanup: Database connection closed');
    }
  }

  console.log('\n🎉 Database connection test completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run migrations: npx prisma db push');
  console.log('2. Start development server: npm run dev');
  console.log('3. Test API endpoints that use the database');
}

// Run the test
testDatabaseConnection().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});