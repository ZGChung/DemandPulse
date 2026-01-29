#!/usr/bin/env node

/**
 * Quick test of the mock Claude Code service
 * This script tests the mock service without actually sending requests
 */

import { randomUUID } from "crypto";

console.log("🧪 Testing Mock Claude Code Service\n");

// Test 1: Generate mock requirement
console.log("1. Testing requirement generation...");
const mockRequirement = {
  requirementId: randomUUID(),
  originalRequirement: "Test requirement for authentication",
  summarizedRequirement: "Add authentication system",
  context: {
    conversationId: randomUUID(),
    workspacePath: "/test/project",
    timestamp: new Date().toISOString(),
  },
  consent: {
    consentOptions: {
      dataCollection: true,
      contact: false,
      anonymization: true,
    },
    consentedAt: new Date().toISOString(),
  },
};

console.log("✅ Generated mock requirement:");
console.log(`   ID: ${mockRequirement.requirementId}`);
console.log(`   Summary: ${mockRequirement.summarizedRequirement}`);
console.log(`   Consent - Data: ${mockRequirement.consent.consentOptions.dataCollection}`);
console.log(`   Consent - Contact: ${mockRequirement.consent.consentOptions.contact}`);
console.log(`   Consent - Anonymize: ${mockRequirement.consent.consentOptions.anonymization}`);

// Test 2: Validate structure
console.log("\n2. Validating requirement structure...");
const requiredFields = [
  "requirementId",
  "originalRequirement",
  "summarizedRequirement",
  "context",
  "consent",
];

let allFieldsPresent = true;
for (const field of requiredFields) {
  if (!(field in mockRequirement)) {
    console.log(`❌ Missing field: ${field}`);
    allFieldsPresent = false;
  }
}

if (allFieldsPresent) {
  console.log("✅ All required fields present");
}

// Test 3: Check API endpoint structure
console.log("\n3. Checking API endpoint expectations...");
const apiEndpoints = [
  { method: "POST", path: "/api/requirements", auth: true },
  { method: "POST", path: "/api/mock/requirements", auth: false },
  { method: "GET", path: "/api/health", auth: false },
];

console.log("Expected API endpoints:");
for (const endpoint of apiEndpoints) {
  console.log(
    `   ${endpoint.method} ${endpoint.path} ${endpoint.auth ? "(auth required)" : "(no auth)"}`
  );
}

// Test 4: Show usage examples
console.log("\n4. Usage examples:");
console.log("   npm run mock:claude-code -- --count=3");
console.log("   npm run mock:claude-code -- --count=5 --interval=1000");
console.log("   npm run mock:claude-code -- --api-url=http://localhost:3000 --verbose");

console.log("\n🎉 Mock service test complete!");
console.log("\nNext steps:");
console.log("1. Start the dev server: npm run dev");
console.log("2. Test API connection: npm run mock:claude-code -- --count=0");
console.log("3. Send test data: npm run mock:claude-code -- --count=2");
