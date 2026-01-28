// Test script for Requirements API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testGetRequirements() {
  console.log('Testing GET /api/requirements...');

  try {
    const response = await fetch(`${BASE_URL}/requirements`);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('✓ GET endpoint works');
      return true;
    } else {
      console.log('✗ GET endpoint returned error');
      return false;
    }
  } catch (error) {
    console.error('✗ Error testing GET endpoint:', error.message);
    return false;
  }
}

async function testPostRequirement() {
  console.log('\nTesting POST /api/requirements...');

  const testData = {
    requirementId: 'test-' + Date.now(),
    originalRequirement: 'Test requirement for API testing',
    summarizedRequirement: 'Test API requirement',
    context: {
      conversationId: 'test-conversation-' + Date.now(),
      workspacePath: '/test/workspace',
      timestamp: new Date().toISOString()
    },
    consent: {
      consentOptions: {
        dataCollection: true,
        contact: false,
        anonymization: true
      },
      userProvidedEmail: null,
      consentedAt: new Date().toISOString()
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log('✓ POST endpoint requires authentication (as expected)');
      return 'auth_required';
    } else if (response.ok) {
      console.log('✓ POST endpoint works');
      return true;
    } else {
      console.log('✗ POST endpoint returned error');
      return false;
    }
  } catch (error) {
    console.error('✗ Error testing POST endpoint:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('=== Testing Requirements API Endpoints ===\n');

  const getResult = await testGetRequirements();
  const postResult = await testPostRequirement();

  console.log('\n=== Test Summary ===');
  console.log(`GET /api/requirements: ${getResult ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`POST /api/requirements: ${postResult === true ? '✓ PASS' : postResult === 'auth_required' ? '✓ AUTH REQUIRED (expected)' : '✗ FAIL'}`);

  if (!getResult) {
    console.log('\n⚠️  GET endpoint failed. Possible issues:');
    console.log('  1. Server may not be running');
    console.log('  2. Database connection issue');
    console.log('  3. API route configuration problem');
  }
}

// Run tests
runTests().catch(console.error);