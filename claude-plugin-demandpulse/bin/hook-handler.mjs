#!/usr/bin/env node
/* global process, console */

/**
 * DemandPulse Claude Code Plugin — Stop Hook Handler
 *
 * Runs on every Claude Stop event. By default, only logs.
 * Set DEMANDPULSE_AUTO_SUBMIT=true to enable automatic requirement detection
 * and submission (opt-in for power users).
 *
 * Most users should use /demandpulse:share instead for explicit sharing.
 */

import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';

const API_URL = process.env.DEMANDPULSE_API_URL || 'https://demand-pulse.vercel.app';
const AUTO_SUBMIT = process.env.DEMANDPULSE_AUTO_SUBMIT === 'true';

const KEYWORDS = [
  'need', 'want', 'should', 'must', 'require', 'requirement',
  'feature', 'bug', 'fix', 'improve', 'improvement', 'enhance',
  'problem', 'issue', 'error', 'broken', "doesn't work",
  'add', 'create', 'implement', 'build', 'develop'
];

const hookInput = await readStdinJson();
const eventName = hookInput.hook_event_name || hookInput.event;

if (eventName === 'Stop' && AUTO_SUBMIT) {
  const transcriptPath = hookInput.transcript_path;
  if (transcriptPath) {
    try {
      const text = await getLastUserMessage(transcriptPath);
      if (text && text.length >= 10 && text.length <= 1000 && hasKeyword(text)) {
        await submit(text, hookInput);
        console.error('[DemandPulse] Auto-submitted requirement');
      }
    } catch (e) {
      console.error('[DemandPulse] Auto-submit failed:', e.message);
    }
  }
}

process.exit(0);

async function readStdinJson() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(new Error(`Bad stdin JSON: ${e.message}`)); }
    });
    process.stdin.on('error', reject);
  });
}

async function getLastUserMessage(path) {
  const raw = await readFile(path, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(lines[i]);
      const role = (obj.role || obj.type || '').toLowerCase();
      if (role !== 'user') continue;
      const text = obj.content ?? obj.text ?? obj.message ?? obj.input;
      if (typeof text === 'string' && text.trim()) return text.trim();
      if (Array.isArray(obj.content)) {
        const part = obj.content.find(p => p?.type === 'text' && p?.text);
        if (part?.text) return String(part.text).trim();
      }
    } catch { /* skip */ }
  }
  return null;
}

function hasKeyword(text) {
  const lower = text.toLowerCase();
  return KEYWORDS.some(k => lower.includes(k));
}

async function submit(text, hookInput) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const summary = text.length > 100 ? text.substring(0, 100) + '...' : text;

  const res = await fetch(`${API_URL}/api/plugin/requirements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requirementId: id,
      originalRequirement: text,
      summarizedRequirement: summary,
      context: {
        conversationId: hookInput.session_id || id,
        timestamp: now,
      },
      consent: {
        consentOptions: { dataCollection: true, contact: false, anonymization: true },
        consentedAt: now,
      },
    }),
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}
