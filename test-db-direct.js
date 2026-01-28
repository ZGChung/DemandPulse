// Direct database test script
import { PrismaClient } from '@prisma/client';

async function testDatabaseConnection() {
  console.log('Testing database connection...');

  try {
    // Try to create PrismaClient with adapter for SQLite
    const prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });

    console.log('PrismaClient created successfully');

    // Test connection by counting requirements
    const count = await prisma.requirement.count();
    console.log(`Number of requirements in database: ${count}`);

    // Test creating a requirement
    const testRequirement = await prisma.requirement.create({
      data: {
        originalRequirement: 'Test requirement from direct script',
        summarizedRequirement: 'Test requirement',
        conversationId: 'test-conv-' + Date.now(),
        workspacePath: '/test/path',
        detectedAt: new Date(),
        dataCollectionConsent: true,
        contactConsent: false,
        anonymizationConsent: true,
        dataRetentionDays: 365,
      }
    });

    console.log('Created test requirement with ID:', testRequirement.id);

    // Test getting requirements
    const requirements = await prisma.requirement.findMany({
      take: 5,
      orderBy: { detectedAt: 'desc' }
    });

    console.log(`Found ${requirements.length} requirements`);

    // Test statistics
    const total = await prisma.requirement.count();
    const pending = await prisma.requirement.count({ where: { status: 'PENDING' } });

    console.log('Statistics:');
    console.log(`  Total requirements: ${total}`);
    console.log(`  Pending requirements: ${pending}`);

    await prisma.$disconnect();
    console.log('✓ Database tests passed');
    return true;

  } catch (error) {
    console.error('✗ Database test failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Run test
testDatabaseConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});