#!/usr/bin/env node

/**
 * Simple Mock Claude Code Integration
 *
 * This script simulates Claude Code plugin detecting developer requirements
 * and sending mock data to the DemandPulse API for testing.
 *
 * Usage:
 *   node mock-claude-code.js [--count=N] [--interval=MS] [--api-url=URL]
 *
 * Examples:
 *   node mock-claude-code.js --count=5           # Send 5 mock requirements
 *   node mock-claude-code.js --interval=2000     # Send every 2 seconds
 *   node mock-claude-code.js --api-url=http://localhost:3000
 */

import { v4 as uuidv4 } from 'uuid';

// Default configuration
const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:3000',
  count: 1,
  interval: 0, // 0 means send all at once
  verbose: false,
  authToken: null,
};

// Sample requirement templates
const REQUIREMENT_TEMPLATES = [
  {
    original: "I need to add user authentication to my Next.js app. Can you help me set up NextAuth.js with Google OAuth?",
    summary: "Add NextAuth.js authentication with Google OAuth provider",
    intent: "feature_request",
    keywords: ["authentication", "nextauth", "google", "oauth"]
  },
  {
    original: "There's a bug where the API returns 500 error when the database connection times out. Need to add proper error handling and retry logic.",
    summary: "Fix database connection timeout error with retry logic",
    intent: "bug_fix",
    keywords: ["bug", "database", "timeout", "error", "retry"]
  },
  {
    original: "The current dashboard is slow when loading large datasets. Can we implement virtual scrolling or pagination?",
    summary: "Optimize dashboard performance with virtual scrolling",
    intent: "improvement",
    keywords: ["performance", "dashboard", "virtual", "scrolling", "pagination"]
  },
  {
    original: "I want to create a CLI tool that automatically formats code and runs tests before commits.",
    summary: "Create pre-commit hook CLI tool for code formatting and testing",
    intent: "new_tool",
    keywords: ["cli", "tool", "pre-commit", "formatting", "testing"]
  },
  {
    original: "How do I implement real-time notifications using WebSockets in a React app?",
    summary: "Implement real-time notifications with WebSockets",
    intent: "feature_request",
    keywords: ["realtime", "websockets", "notifications", "react"]
  }
];

// Sample workspace paths
const WORKSPACE_PATHS = [
  '/Users/dev/projects/my-app',
  '/home/dev/workspace/project',
  '/workspace/frontend',
  '/code/backend-service',
  null // Sometimes no workspace path
];

class MockClaudeCode {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.requirementsSent = 0;
    this.errors = 0;
  }

  /**
   * Generate a mock requirement
   */
  generateMockRequirement() {
    const template = REQUIREMENT_TEMPLATES[Math.floor(Math.random() * REQUIREMENT_TEMPLATES.length)];
    const workspacePath = WORKSPACE_PATHS[Math.floor(Math.random() * WORKSPACE_PATHS.length)];
    const now = new Date().toISOString();
    const requirementId = uuidv4();
    const conversationId = uuidv4();

    return {
      requirementId,
      originalRequirement: template.original,
      summarizedRequirement: template.summary,
      context: {
        conversationId,
        workspacePath,
        timestamp: now
      },
      consent: {
        consentOptions: {
          dataCollection: Math.random() > 0.3, // 70% chance of consent
          contact: Math.random() > 0.7, // 30% chance of contact consent
          anonymization: Math.random() > 0.5 // 50% chance of anonymization
        },
        userProvidedEmail: Math.random() > 0.8 ? `user${Math.floor(Math.random() * 1000)}@example.com` : undefined,
        consentedAt: now
      }
    };
  }

  /**
   * Send a requirement to the API
   */
  async sendRequirement(requirement) {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add auth token if provided
    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/api/requirements`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requirement)
      });

      if (response.ok) {
        const data = await response.json();
        if (this.config.verbose) {
          console.log(`✅ Requirement sent successfully: ${data.requirementId}`);
          console.log(`   Summary: ${requirement.summarizedRequirement}`);
        } else {
          console.log(`✅ ${requirement.summarizedRequirement}`);
        }
        return { success: true, data };
      } else {
        const error = await response.text();
        console.error(`❌ Failed to send requirement: ${response.status} ${response.statusText}`);
        if (this.config.verbose) {
          console.error(`   Error: ${error}`);
        }
        this.errors++;
        return { success: false, error };
      }
    } catch (error) {
      console.error(`❌ Network error: ${error.message}`);
      this.errors++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Run the mock integration
   */
  async run() {
    console.log('🚀 Starting Mock Claude Code Integration');
    console.log(`📊 Configuration:`);
    console.log(`   API URL: ${this.config.apiUrl}`);
    console.log(`   Count: ${this.config.count}`);
    console.log(`   Interval: ${this.config.interval}ms`);
    console.log(`   Verbose: ${this.config.verbose}`);
    console.log('');

    if (this.config.interval > 0) {
      // Send with interval
      for (let i = 0; i < this.config.count; i++) {
        const requirement = this.generateMockRequirement();
        await this.sendRequirement(requirement);
        this.requirementsSent++;

        if (i < this.config.count - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.interval));
        }
      }
    } else {
      // Send all at once
      const promises = [];
      for (let i = 0; i < this.config.count; i++) {
        const requirement = this.generateMockRequirement();
        promises.push(this.sendRequirement(requirement));
        this.requirementsSent++;
      }

      await Promise.all(promises);
    }

    console.log('');
    console.log('📈 Summary:');
    console.log(`   Requirements sent: ${this.requirementsSent}`);
    console.log(`   Errors: ${this.errors}`);
    console.log(`   Success rate: ${((this.requirementsSent - this.errors) / this.requirementsSent * 100).toFixed(1)}%`);
  }

  /**
   * Simple one-shot API call for testing
   */
  static async testConnection(apiUrl) {
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
    } catch (error) {
      console.error(`❌ Cannot connect to API: ${error.message}`);
      return false;
    }
  }
}

// Command line interface
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');

      switch (key) {
        case 'count':
          config.count = parseInt(value, 10);
          break;
        case 'interval':
          config.interval = parseInt(value, 10);
          break;
        case 'api-url':
          config.apiUrl = value;
          break;
        case 'verbose':
          config.verbose = value === 'true' || value === '1' || value === undefined;
          break;
        case 'auth-token':
          config.authToken = value;
          break;
        case 'help':
          printHelp();
          process.exit(0);
      }
    }
  }

  return config;
}

function printHelp() {
  console.log(`
Mock Claude Code Integration
============================

Simulates Claude Code plugin detecting developer requirements and sending
mock data to the DemandPulse API for testing.

Usage:
  node mock-claude-code.js [options]

Options:
  --count=N          Number of mock requirements to send (default: 1)
  --interval=MS      Interval between requests in milliseconds (default: 0 = all at once)
  --api-url=URL      API base URL (default: http://localhost:3000)
  --verbose          Show detailed output
  --auth-token=TOKEN Authentication token for protected endpoints
  --help             Show this help message

Examples:
  # Send 5 mock requirements
  node mock-claude-code.js --count=5

  # Send one requirement every 2 seconds
  node mock-claude-code.js --interval=2000

  # Test with custom API URL
  node mock-claude-code.js --api-url=http://localhost:3000 --count=3 --verbose

  # Test API connection only
  node mock-claude-code.js --api-url=http://localhost:3000 --count=0
  `);
}

// Main execution
async function main() {
  const config = parseArgs();

  // Test API connection first
  console.log('🔍 Testing API connection...');
  const isHealthy = await MockClaudeCode.testConnection(config.apiUrl);

  if (!isHealthy) {
    console.error('❌ Cannot proceed: API is not accessible');
    process.exit(1);
  }

  if (config.count === 0) {
    console.log('✅ API connection test successful');
    process.exit(0);
  }

  // Run the mock integration
  const mock = new MockClaudeCode(config);
  await mock.run();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default MockClaudeCode;