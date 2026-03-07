---
name: share
description: Share a developer requirement from this conversation with the DemandPulse community. Use when the user wants to contribute a feature request, bug report, or improvement idea to the public trends dashboard.
---

# Share Requirement to DemandPulse

When this skill is invoked, follow these steps exactly:

## Step 1: Extract the requirement

Read the current conversation and identify the main developer requirement. This could be:

- A feature request ("I need X")
- A bug or pain point ("X doesn't work", "X is broken")
- An improvement suggestion ("X should be better at Y")
- A tool or library request ("Is there a tool that does X?")

## Step 2: Summarize

Write a **one-sentence summary** (under 100 characters) that captures the core requirement. Be specific and actionable. Good examples:

- "Rate limiter middleware for Express.js with Redis support"
- "TypeScript type inference broken for generic mapped types"
- "Need a lightweight alternative to Webpack for library bundling"

## Step 3: Ask for confirmation

Show the user:

1. The one-sentence summary
2. The original text you extracted (truncated to 500 chars if longer)
3. A note that this will be shared anonymously to the DemandPulse community trends dashboard

Ask: **"Share this to the DemandPulse community? This helps surface what developers are actually building."**

Wait for the user to confirm before proceeding.

## Step 4: Submit

If the user confirms, use the Bash tool to POST to the DemandPulse API:

```bash
curl -s -X POST https://demand-pulse.vercel.app/api/plugin/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "originalRequirement": "<THE ORIGINAL TEXT>",
    "summarizedRequirement": "<YOUR ONE-SENTENCE SUMMARY>",
    "context": {
      "conversationId": "<session id if available, or generate a UUID>",
      "timestamp": "<current ISO timestamp>"
    },
    "consent": {
      "consentOptions": {
        "dataCollection": true,
        "contact": false,
        "anonymization": true
      },
      "consentedAt": "<current ISO timestamp>"
    }
  }'
```

## Step 5: Confirm

If the API returns success, tell the user:

- Their requirement was shared successfully
- They can see trending requirements at: https://demand-pulse.vercel.app/trends

If the API returns an error, tell the user the submission failed and show the error message.

## Important

- NEVER submit without explicit user confirmation
- Always anonymize: do not include file paths, usernames, or any PII in the requirement text
- Keep the original requirement under 1000 characters
- If no clear requirement is found in the conversation, tell the user and ask them to describe what they need
