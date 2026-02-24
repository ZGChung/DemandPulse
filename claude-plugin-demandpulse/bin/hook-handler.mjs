#!/usr/bin/env node
/* global process, console */

/**
 * DemandPulse Claude Code Plugin Hook Handler
 *
 * Called by Claude Code hooks (PostToolUse, Stop). Uses official input schema:
 * session_id, transcript_path, cwd, permission_mode, hook_event_name; for tools: tool_name, tool_input.
 * On Stop + ENABLE_AUTO_DETECTION, reads transcript_path (JSONL) and may submit last user message to API.
 */

import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';

const CONFIG = {
  apiUrl: process.env.DEMANDPULSE_API_URL || 'http://localhost:3000',
  apiKey: process.env.DEMANDPULSE_API_KEY || '',
  enableAutoDetection: process.env.ENABLE_AUTO_DETECTION === 'true',
  defaultConsent: {
    dataCollection: process.env.DEFAULT_DATA_COLLECTION_CONSENT === 'true',
    contact: process.env.DEFAULT_CONTACT_CONSENT === 'true',
    anonymization: process.env.DEFAULT_ANONYMIZATION_CONSENT !== 'false',
  },
  requirementKeywords: [
    'need', 'want', 'should', 'must', 'require', 'requirement',
    'feature', 'bug', 'fix', 'improve', 'improvement', 'enhance',
    'problem', 'issue', 'error', 'broken', "doesn't work",
    'add', 'create', 'implement', 'build', 'develop'
  ],
  minRequirementLength: 10,
  maxRequirementLength: 1000,
};

const hookInput = await readStdinJson();
const eventName = hookInput.hook_event_name || hookInput.event;

console.error('[DemandPulse Hook] Event:', eventName);

// Only auto-submit on Stop when enabled
if (eventName === 'Stop' && CONFIG.enableAutoDetection && CONFIG.defaultConsent.dataCollection) {
  const transcriptPath = hookInput.transcript_path;
  if (transcriptPath) {
    try {
      const messageText = await getLastUserMessageFromTranscript(transcriptPath);
      if (messageText && containsRequirementKeywords(messageText) &&
          messageText.length >= CONFIG.minRequirementLength &&
          messageText.length <= CONFIG.maxRequirementLength) {
        await submitRequirement(messageText, hookInput);
        console.error('[DemandPulse Hook] Requirement submitted from transcript');
      }
    } catch (e) {
      console.error('[DemandPulse Hook] Transcript read/submit failed:', e.message);
    }
  }
}

process.exit(0);

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
 * Read transcript JSONL and return the last user message text, or null.
 * Tolerates common shapes: { role: "user", content: "..." }, { type: "user", text: "..." }, etc.
 */
async function getLastUserMessageFromTranscript(transcriptPath) {
  const raw = await readFile(transcriptPath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim());
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(lines[i]);
      const role = (obj.role || obj.type || '').toLowerCase();
      if (role !== 'user') continue;
      const text = obj.content ?? obj.text ?? obj.message ?? obj.input;
      if (typeof text === 'string' && text.trim().length > 0) return text.trim();
      if (Array.isArray(obj.content)) {
        const part = obj.content.find((p) => p?.type === 'text' && p?.text);
        if (part?.text) return String(part.text).trim();
      }
    } catch (_) { /* skip malformed line */ }
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
  const conversationId = hookInput.session_id || hookInput.conversation_id || requirementId;
  const workspacePath = hookInput.cwd ?? hookInput.workspace_path ?? null;
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
        dataCollection: CONFIG.defaultConsent.dataCollection,
        contact: CONFIG.defaultConsent.contact,
        anonymization: CONFIG.defaultConsent.anonymization,
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