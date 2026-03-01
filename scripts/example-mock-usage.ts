#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Example: How to use the mock Claude Code service programmatically
 * This shows how to integrate the mock service into tests or other scripts
 */

import { randomUUID } from "crypto";

/**
 * Example 1: Generate a single mock requirement
 */
function generateExampleRequirement() {
  return {
    requirementId: randomUUID(),
    originalRequirement: "I need to implement a dark mode toggle for my React app.",
    summarizedRequirement: "Add dark mode toggle to React application",
    context: {
      conversationId: randomUUID(),
      workspacePath: "/Users/dev/projects/react-app",
      timestamp: new Date().toISOString(),
    },
    consent: {
      consentOptions: {
        dataCollection: true,
        contact: true,
        anonymization: false,
      },
      userProvidedEmail: "developer@example.com",
      consentedAt: new Date().toISOString(),
    },
  };
}

/**
 * Example 2: Generate multiple requirements for testing
 */
function generateTestRequirements(count: number) {
  const templates = [
    {
      original: "Add user profile editing functionality",
      summary: "Implement user profile editor",
      intent: "feature_request",
    },
    {
      original: "Fix memory leak in image gallery component",
      summary: "Fix memory leak in image gallery",
      intent: "bug_fix",
    },
    {
      original: "Optimize database queries for faster page loads",
      summary: "Optimize database query performance",
      intent: "improvement",
    },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = templates[i % templates.length];
    return {
      requirementId: randomUUID(),
      originalRequirement: template.original,
      summarizedRequirement: template.summary,
      context: {
        conversationId: randomUUID(),
        workspacePath: `/test/project-${i + 1}`,
        timestamp: new Date().toISOString(),
      },
      consent: {
        consentOptions: {
          dataCollection: i % 2 === 0, // Alternate true/false
          contact: i % 3 === 0, // Every 3rd one
          anonymization: i % 4 === 0, // Every 4th one
        },
        userProvidedEmail: i % 5 === 0 ? `user${i}@test.com` : undefined,
        consentedAt: new Date().toISOString(),
      },
    };
  });
}

/**
 * Example 3: Simulate sending requirements to API
 */
async function simulateApiSend(requirement: any, apiUrl: string = "http://localhost:3000") {
  console.log(`📤 Simulating send to ${apiUrl}/api/requirements`);
  console.log(`   Requirement: ${requirement.summarizedRequirement}`);
  console.log(`   ID: ${requirement.requirementId}`);

  // In a real implementation, you would use fetch()
  // const response = await fetch(`${apiUrl}/api/requirements`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(requirement)
  // });

  // For this example, just simulate success
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        requirementId: requirement.requirementId,
        message: "Requirement submitted successfully",
      });
    }, 100);
  });
}

/**
 * Main example
 */
async function main() {
  console.log("📚 Mock Claude Code Service - Usage Examples\n");

  // Example 1: Single requirement
  console.log("1. Generating a single requirement:");
  const singleReq = generateExampleRequirement();
  console.log(`   ${singleReq.summarizedRequirement}`);
  console.log(`   Email provided: ${singleReq.consent.userProvidedEmail ? "Yes" : "No"}`);

  // Example 2: Multiple requirements
  console.log("\n2. Generating 3 test requirements:");
  const testReqs = generateTestRequirements(3);
  testReqs.forEach((req, i) => {
    console.log(`   ${i + 1}. ${req.summarizedRequirement}`);
    console.log(
      `      Data collection: ${req.consent.consentOptions.dataCollection ? "✅" : "❌"}`
    );
  });

  // Example 3: Simulate API send
  console.log("\n3. Simulating API send:");
  const result = await simulateApiSend(singleReq);
  console.log(`   Result: ${JSON.stringify(result, null, 2)}`);

  // Example 4: Integration with tests
  console.log("\n4. Integration example for tests:");
  console.log(`
// In your test file:
import { generateTestRequirements } from './example-mock-usage';

describe('Requirements API', () => {
  it('should accept valid requirements', async () => {
    const testRequirements = generateTestRequirements(2);

    for (const req of testRequirements) {
      const response = await fetch('/api/requirements', {
        method: 'POST',
        body: JSON.stringify(req)
      });

      expect(response.status).toBe(201);
    }
  });
});
  `);

  console.log("\n🎯 Summary:");
  console.log("• Use generateExampleRequirement() for single requirements");
  console.log("• Use generateTestRequirements(n) for bulk testing");
  console.log("• Integrate with fetch() for actual API calls");
  console.log("• See scripts/mock-claude-code.ts for complete CLI tool");
}

// Run the example
main().catch(console.error);
