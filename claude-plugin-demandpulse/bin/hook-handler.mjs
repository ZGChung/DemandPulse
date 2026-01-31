#!/usr/bin/env node
/* global process, console */

/**
 * DemandPulse Claude Code Plugin Hook Handler
 *
 * This script is called by Claude Code hooks to process events and send
 * requirement data to the DemandPulse API.
 */

import { randomUUID } from 'crypto';

// Configuration
const CONFIG = {
  apiUrl: process.env.DEMANDPULSE_API_URL || 'http://localhost:3000',
  apiKey: process.env.DEMANDPULSE_API_KEY || '',
  enableAutoDetection: process.env.ENABLE_AUTO_DETECTION !== 'false',
  requirementKeywords: [
    'need', 'want', 'should', 'must', 'require', 'requirement',
    'feature', 'bug', 'fix', 'improve', 'improvement', 'enhance',
    'problem', 'issue', 'error', 'broken', 'doesn\'t work',
    'add', 'create', 'implement', 'build', 'develop'
  ],
  minRequirementLength: 10,
  maxRequirementLength: 1000,
};

// Parse hook input from stdin
const hookInput = await readStdinJson();

// Log for debugging
console.error('[DemandPulse Hook] Event:', hookInput.event);
console.error('[DemandPulse Hook] Tool:', hookInput.tool_name);

// Only process if auto-detection is enabled
if (!CONFIG.enableAutoDetection) {
  console.error('[DemandPulse Hook] Auto-detection disabled');
  process.exit(0);
}

// Check if this is a message event
if (!isMessageEvent(hookInput)) {
  console.error('[DemandPulse Hook] Not a message event, skipping');
  process.exit(0);
}

// Extract message text
const messageText = extractMessageText(hookInput);
if (!messageText) {
  console.error('[DemandPulse Hook] No message text found');
  process.exit(0);
}

// Check if message contains requirement keywords
if (!containsRequirementKeywords(messageText)) {
  console.error('[DemandPulse Hook] No requirement keywords found');
  process.exit(0);
}

// Validate message length
if (messageText.length < CONFIG.minRequirementLength || messageText.length > CONFIG.maxRequirementLength) {
  console.error('[DemandPulse Hook] Message length outside valid range');
  process.exit(0);
}

// Process as requirement
try {
  await submitRequirement(messageText, hookInput);
  console.error('[DemandPulse Hook] Requirement submitted successfully');
} catch (error) {
  console.error('[DemandPulse Hook] Failed to submit requirement:', error.message);
  process.exit(1);
}

/**
 * Read JSON from stdin
 */
async function readStdinJson() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error(`Failed to parse stdin as JSON: ${error.message}`));
      }
    });
    process.stdin.on('error', reject);
  });
}

/**
 * Check if hook input is a message event
 */
function isMessageEvent(hookInput) {
  const toolName = hookInput.tool_name?.toLowerCase() || '';
  const event = hookInput.event?.toLowerCase() || '';

  // Look for message-related events
  return toolName.includes('message') ||
         event.includes('message') ||
         toolName.includes('chat') ||
         event.includes('chat');
}

/**
 * Extract message text from hook input
 */
function extractMessageText(hookInput) {
  // Try different possible locations for message text
  const candidates = [
    hookInput.tool_input?.text,
    hookInput.tool_input?.content,
    hookInput.tool_input?.message,
    hookInput.tool_input?.input,
    hookInput.message,
    hookInput.content,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
    if (typeof candidate === 'object' && candidate.text) {
      return candidate.text.trim();
    }
  }

  return null;
}

/**
 * Check if text contains requirement keywords
 */
function containsRequirementKeywords(text) {
  const lowerText = text.toLowerCase();
  return CONFIG.requirementKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Submit requirement to DemandPulse API
 */
async function submitRequirement(messageText, hookInput) {
  const requirementId = randomUUID();
  const conversationId = hookInput.conversation_id || randomUUID();
  const workspacePath = hookInput.workspace_path || null;
  const now = new Date().toISOString();

  // Create a simple summary (first 100 chars)
  const summary = messageText.length > 100
    ? messageText.substring(0, 100) + '...'
    : messageText;

  // Prepare requirement submission
  const submission = {
    requirementId,
    originalRequirement: messageText,
    summarizedRequirement: summary,
    context: {
      conversationId,
      workspacePath,
      timestamp: now,
    },
    consent: {
      consentOptions: {
        dataCollection: true,
        contact: false,
        anonymization: true,
      },
      userProvidedEmail: undefined,
      consentedAt: now,
    },
  };

  console.error('[DemandPulse Hook] Submitting requirement:', {
    id: requirementId,
    summary,
    conversationId,
  });

  // Send to DemandPulse API
  const headers = {
    'Content-Type': 'application/json',
  };
  if (CONFIG.apiKey) {
    headers['x-api-key'] = CONFIG.apiKey;
  }
  const response = await fetch(`${CONFIG.apiUrl}/api/plugin/requirements`, {
    method: 'POST',
    headers,
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API responded with ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.error('[DemandPulse Hook] API response:', result);

  return result;
}