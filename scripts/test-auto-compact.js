#!/usr/bin/env node

/**
 * Test script for Claude Code Auto-Compact System
 *
 * This script simulates a conversation and tests the auto-compact hooks.
 */

import { claudeCodeIntegration } from "../services/claude-code-integration.js";
import { hookManager } from "../services/hook-manager.js";
import { contextMonitor } from "../services/context-monitor.js";
import { autoCompactService } from "../services/auto-compact-service.js";

async function simulateConversation() {
  console.log("🚀 Starting Claude Code Auto-Compact Test");
  console.log("=".repeat(60));

  try {
    // Initialize integration
    console.log("\n1. Initializing Claude Code integration...");
    await claudeCodeIntegration.initialize();

    // Start integration
    console.log("\n2. Starting integration...");
    await claudeCodeIntegration.start();

    // Get initial status
    const status = claudeCodeIntegration.getStatus();
    console.log("\n3. Initial Status:");
    console.log(JSON.stringify(status, null, 2));

    // Simulate conversation messages
    console.log("\n4. Simulating conversation...");

    // Create some test messages that would trigger context monitoring
    const testMessages = [
      {
        role: "user",
        content:
          "I need to build a new feature for my application. Can you help me create a user authentication system?",
      },
      {
        role: "assistant",
        content:
          "Sure! I can help you build a user authentication system. What stack are you using?",
      },
      {
        role: "user",
        content:
          "I'm using Next.js with Prisma and PostgreSQL. I need JWT-based authentication with email/password login and social login options.",
      },
      {
        role: "assistant",
        content:
          "Great choice! Let me create a comprehensive authentication system for you. First, I'll set up the database schema...",
      },
      // Add more messages to simulate long conversation
      ...Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Test message ${i + 1}: ${"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(10)}`,
      })),
    ];

    // Simulate receiving messages
    for (const message of testMessages) {
      console.log(`\n📨 Simulating ${message.role} message...`);

      // Trigger message_received hook
      await hookManager.trigger("message_received", {
        role: message.role,
        content: message.content,
        timestamp: new Date(),
      });

      // Get current context status
      const contextStatus = contextMonitor.getContextStatus();
      console.log(
        `   Context: ${contextStatus.messageCount} messages, ${Math.round(contextStatus.usagePercentage * 100)}% usage`
      );

      // Small delay between messages
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Check final status
    console.log("\n5. Final Status:");
    const finalStatus = claudeCodeIntegration.getStatus();
    console.log(JSON.stringify(finalStatus, null, 2));

    // Test manual compact
    console.log("\n6. Testing manual compact...");
    const result = await autoCompactService.manualCompact();
    console.log("Manual compact result:", result);

    // Get compact history
    console.log("\n7. Compact History:");
    const history = autoCompactService.getHistory(5);
    history.forEach((event, i) => {
      console.log(
        `   ${i + 1}. ${event.timestamp.toISOString()} - ${event.strategy} - ${event.status}`
      );
    });

    // Get hook event history
    console.log("\n8. Hook Event History:");
    const hookHistory = hookManager.getEventHistory(10);
    hookHistory.forEach((event, i) => {
      console.log(`   ${i + 1}. ${event.timestamp.toISOString()} - ${event.event}`);
    });

    // Stop integration
    console.log("\n9. Stopping integration...");
    await claudeCodeIntegration.stop();

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run test
simulateConversation().catch(console.error);
