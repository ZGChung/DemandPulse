#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Simple Mock Claude Code Integration for MVP Testing
 *
 * This is a minimal mock service that simulates Claude Code plugin
 * detecting developer requirements and sending data to the API.
 *
 * Features:
 * - Generates mock requirement data
 * - Sends POST requests to /api/requirements
 * - Simulates data flow from Claude Code to database
 * - Can be run from command line
 * - No external dependencies beyond Node.js built-ins
 */

import { randomUUID } from "crypto";

// Configuration
interface Config {
  apiUrl: string;
  count: number;
  interval: number;
  verbose: boolean;
}

const DEFAULT_CONFIG: Config = {
  apiUrl: "http://localhost:3000",
  count: 1,
  interval: 0,
  verbose: false,
};

// Sample requirement templates
const REQUIREMENT_TEMPLATES = [
  {
    original:
      "I need to add user authentication to my Next.js app. Can you help me set up NextAuth.js with Google OAuth?",
    summary: "Add NextAuth.js authentication with Google OAuth provider",
    intent: "feature_request",
    keywords: ["authentication", "nextauth", "google", "oauth"],
  },
  {
    original:
      "There's a bug where the API returns 500 error when the database connection times out. Need to add proper error handling and retry logic.",
    summary: "Fix database connection timeout error with retry logic",
    intent: "bug_fix",
    keywords: ["bug", "database", "timeout", "error", "retry"],
  },
  {
    original:
      "The current dashboard is slow when loading large datasets. Can we implement virtual scrolling or pagination?",
    summary: "Optimize dashboard performance with virtual scrolling",
    intent: "improvement",
    keywords: ["performance", "dashboard", "virtual", "scrolling", "pagination"],
  },
  {
    original:
      "I want to create a CLI tool that automatically formats code and runs tests before commits.",
    summary: "Create pre-commit hook CLI tool for code formatting and testing",
    intent: "new_tool",
    keywords: ["cli", "tool", "pre-commit", "formatting", "testing"],
  },
  {
    original: "How do I implement real-time notifications using WebSockets in a React app?",
    summary: "Implement real-time notifications with WebSockets",
    intent: "feature_request",
    keywords: ["realtime", "websockets", "notifications", "react"],
  },
];

// Sample workspace paths
const WORKSPACE_PATHS = [
  "/Users/dev/projects/my-app",
  "/home/dev/workspace/project",
  "/workspace/frontend",
  "/code/backend-service",
  null, // Sometimes no workspace path
];

/**
 * Generate a mock requirement
 */
function generateMockRequirement() {
  const template = REQUIREMENT_TEMPLATES[Math.floor(Math.random() * REQUIREMENT_TEMPLATES.length)];
  const workspacePath = WORKSPACE_PATHS[Math.floor(Math.random() * WORKSPACE_PATHS.length)];
  const now = new Date().toISOString();
  const requirementId = randomUUID();
  const conversationId = randomUUID();

  return {
    requirementId,
    originalRequirement: template.original,
    summarizedRequirement: template.summary,
    context: {
      conversationId,
      workspacePath,
      timestamp: now,
    },
    consent: {
      consentOptions: {
        dataCollection: Math.random() > 0.3, // 70% chance of consent
        contact: Math.random() > 0.7, // 30% chance of contact consent
        anonymization: Math.random() > 0.5, // 50% chance of anonymization
      },
      userProvidedEmail:
        Math.random() > 0.8 ? `user${Math.floor(Math.random() * 1000)}@example.com` : undefined,
      consentedAt: now,
    },
  };
}

/**
 * Send a requirement to the API
 */
async function sendRequirement(
  requirement: any,
  config: Config
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${config.apiUrl}/api/requirements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requirement),
    });

    if (response.ok) {
      const data = await response.json();
      if (config.verbose) {
        console.log(`✅ Requirement sent successfully: ${data.requirementId}`);
        console.log(`   Summary: ${requirement.summarizedRequirement}`);
      } else {
        console.log(`✅ ${requirement.summarizedRequirement}`);
      }
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`❌ Failed to send requirement: ${response.status} ${response.statusText}`);
      if (config.verbose) {
        console.error(`   Error: ${error}`);
      }
      return { success: false, error };
    }
  } catch (error: any) {
    console.error(`❌ Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test API connection
 */
async function testConnection(apiUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/api/health`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API is healthy: ${data.status} (${data.timestamp})`);
      return true;
    } else {
      console.error(`❌ API health check failed: ${response.status}`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Cannot connect to API: ${error.message}`);
    return false;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Config = { ...DEFAULT_CONFIG };

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");

      switch (key) {
        case "count":
          config.count = parseInt(value, 10);
          break;
        case "interval":
          config.interval = parseInt(value, 10);
          break;
        case "api-url":
          config.apiUrl = value;
          break;
        case "verbose":
          config.verbose = value === "true" || value === "1" || value === undefined;
          break;
        case "help":
          printHelp();
          process.exit(0);
      }
    }
  }

  return config;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Mock Claude Code Integration
============================

Simulates Claude Code plugin detecting developer requirements and sending
mock data to the DemandPulse API for testing.

Usage:
  npx tsx scripts/mock-claude-code.ts [options]

Options:
  --count=N          Number of mock requirements to send (default: 1)
  --interval=MS      Interval between requests in milliseconds (default: 0 = all at once)
  --api-url=URL      API base URL (default: http://localhost:3000)
  --verbose          Show detailed output
  --help             Show this help message

Examples:
  # Send 5 mock requirements
  npx tsx scripts/mock-claude-code.ts --count=5

  # Send one requirement every 2 seconds
  npx tsx scripts/mock-claude-code.ts --interval=2000

  # Test with custom API URL
  npx tsx scripts/mock-claude-code.ts --api-url=http://localhost:3000 --count=3 --verbose

  # Test API connection only
  npx tsx scripts/mock-claude-code.ts --api-url=http://localhost:3000 --count=0
  `);
}

/**
 * Main function
 */
async function main() {
  const config = parseArgs();

  console.log("🚀 Starting Mock Claude Code Integration");
  console.log(`📊 Configuration:`);
  console.log(`   API URL: ${config.apiUrl}`);
  console.log(`   Count: ${config.count}`);
  console.log(`   Interval: ${config.interval}ms`);
  console.log(`   Verbose: ${config.verbose}`);
  console.log("");

  // Test API connection first
  console.log("🔍 Testing API connection...");
  const isHealthy = await testConnection(config.apiUrl);

  if (!isHealthy) {
    console.error("❌ Cannot proceed: API is not accessible");
    process.exit(1);
  }

  if (config.count === 0) {
    console.log("✅ API connection test successful");
    process.exit(0);
  }

  // Run the mock integration
  let requirementsSent = 0;
  let errors = 0;

  if (config.interval > 0) {
    // Send with interval
    for (let i = 0; i < config.count; i++) {
      const requirement = generateMockRequirement();
      const result = await sendRequirement(requirement, config);
      requirementsSent++;
      if (!result.success) errors++;

      if (i < config.count - 1) {
        await new Promise((resolve) => setTimeout(resolve, config.interval));
      }
    }
  } else {
    // Send all at once
    const promises = [];
    for (let i = 0; i < config.count; i++) {
      const requirement = generateMockRequirement();
      promises.push(sendRequirement(requirement, config));
      requirementsSent++;
    }

    const results = await Promise.all(promises);
    errors = results.filter((r) => !r.success).length;
  }

  console.log("");
  console.log("📈 Summary:");
  console.log(`   Requirements sent: ${requirementsSent}`);
  console.log(`   Errors: ${errors}`);
  console.log(
    `   Success rate: ${(((requirementsSent - errors) / requirementsSent) * 100).toFixed(1)}%`
  );
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
