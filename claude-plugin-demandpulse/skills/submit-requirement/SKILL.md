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
3. A note that this will be shared to the DemandPulse community trends dashboard (and linked to their account if they provide their DemandPulse login)

Ask: **"Share this to the DemandPulse community? This helps surface what developers are actually building."**

Wait for the user to confirm before proceeding.

## Step 4: Get DemandPulse account (for linking)

Before submitting, determine the **DemandPulse account** (GitHub email or username the user uses to sign in at demand-pulse.vercel.app):

1. **Read from environment or file**  
   Run in Bash:

   ```bash
   ACCOUNT=$(cat ~/.config/demandpulse/account 2>/dev/null || echo "$DEMANDPULSE_ACCOUNT"); echo "${ACCOUNT:-}"
   ```

   If the output is non-empty, use it as the account value and do **not** ask the user.

2. **If empty — check this conversation**  
   If the user has already provided their DemandPulse account earlier in this conversation (e.g. in response to a previous share or a prompt from you), reuse that value.

3. **If still unknown — prompt in chat**  
   Ask: **"To link this submission to your DemandPulse account, enter the GitHub email or username you use to sign in at demand-pulse.vercel.app (or press Enter to submit anonymously)."**  
   Wait for the user's reply. If they provide a non-empty value, use it. If they skip (Enter or empty), leave the account empty (anonymous submission).

4. **Note for after submit**  
   If you obtained the account from the user's reply in this step (not from env or file), remember to offer saving it after a successful submit (Step 6).

## Step 5: Submit

Use the Bash tool to POST to the DemandPulse API. Include `demandpulseAccount` in the JSON body **only when** you have a non-empty account value from Step 4; otherwise omit the field.

Example with account:

```bash
curl -s -X POST https://demand-pulse.vercel.app/api/plugin/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "originalRequirement": "<THE ORIGINAL TEXT>",
    "summarizedRequirement": "<YOUR ONE-SENTENCE SUMMARY>",
    "demandpulseAccount": "<ACCOUNT FROM STEP 4>",
    "context": {
      "conversationId": "<session id or UUID>",
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

Example without account (anonymous):

```bash
curl -s -X POST https://demand-pulse.vercel.app/api/plugin/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "originalRequirement": "<THE ORIGINAL TEXT>",
    "summarizedRequirement": "<YOUR ONE-SENTENCE SUMMARY>",
    "context": {
      "conversationId": "<session id or UUID>",
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

Escape any quotes in the requirement text for JSON (e.g. replace `"` with `\"`).

## Step 6: Confirm and optionally offer to save account

If the API returns success:

- Tell the user their requirement was shared successfully and they can see trends at https://demand-pulse.vercel.app/trends

- **If you obtained the account from the user in Step 4 (they typed it in chat) and did not read it from env or file**, ask: **"Do you want to save this account so you won't be asked next time? I can write it to ~/.config/demandpulse/account."**
  - If the user says **yes**, run:
    ```bash
    mkdir -p ~/.config/demandpulse && echo '<THE ACCOUNT VALUE THEY TYPED>' > ~/.config/demandpulse/account
    ```
    Use exactly the value they provided (trimmed); do not modify it. Then confirm that it's saved.
  - If the user says **no**, do nothing. They will be prompted again next time.

If the API returns an error, tell the user the submission failed and show the error message.

## Important

- NEVER submit without explicit user confirmation
- Only run the "write to file" command when the user explicitly agrees to save their account
- Always anonymize: do not include file paths, usernames, or any PII in the requirement text
- Keep the original requirement under 1000 characters
- If no clear requirement is found in the conversation, tell the user and ask them to describe what they need
