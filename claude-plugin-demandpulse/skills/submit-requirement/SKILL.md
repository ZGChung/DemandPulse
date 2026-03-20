---
name: submit-requirement
description: Submit a requirement from the current conversation to DemandPulse. Use when the user wants a feature request, bug report, or workflow pain point tracked and shared.
---

# Submit Requirement To DemandPulse

When this skill is invoked, follow this workflow exactly.

## Step 1: Identify the requirement

Read the current conversation and extract the single strongest requirement being discussed. Valid examples:

- feature request
- bug report
- integration request
- workflow pain point
- tooling or automation gap

If there is no clear requirement, tell the user you could not identify one and ask them to state it explicitly before continuing.

## Step 2: Sanitize the source text

Build a short source excerpt from the conversation that captures the requirement. Before showing or submitting it:

- remove file paths
- remove usernames, email addresses, and personal names unless the user explicitly wants them shared
- remove tokens, secrets, stack traces, and raw logs
- remove irrelevant implementation detail that is not needed to explain the requirement

Keep the final original requirement text under 1000 characters.

## Step 3: Summarize

Write a one-sentence summary under 100 characters. The summary should be concrete and actionable. Good examples:

- "Need approval workflow support for staged production deploys"
- "Claude Code plugin should export conversation-derived product requirements"
- "Auto-submit requirement detection should stay opt-in and privacy-safe"

## Step 4: Ask for explicit confirmation

Show the user:

1. the one-sentence summary
2. the sanitized source text that will be submitted
3. a note that this goes to the DemandPulse community trends dashboard

Ask for clear confirmation before sending anything. Never submit without an explicit yes.

## Step 5: Check for a linked DemandPulse account

Before running any shell command, tell the user:

"Checking for a saved DemandPulse account on your machine so we can link this submission if you have one."

Then run:

```bash
ACCOUNT=$(cat ~/.config/demandpulse/account 2>/dev/null || echo "$DEMANDPULSE_ACCOUNT"); echo "${ACCOUNT:-}"
```

Use a non-empty result as the account value.

If the result is empty:

- reuse an account value the user already gave in this conversation, if available
- otherwise ask: "To link this submission to your DemandPulse account, enter the GitHub email or username you use at demand-pulse.vercel.app, or press Enter to submit anonymously."

If the user skips, submit anonymously.

## Step 6: Submit

POST to the DemandPulse API:

```text
https://demand-pulse.vercel.app/api/plugin/requirements
```

Use a JSON body with:

- `originalRequirement`
- `summarizedRequirement`
- `context.conversationId`
- `context.timestamp`
- `consent.consentOptions.dataCollection = true`
- `consent.consentOptions.contact = false`
- `consent.consentOptions.anonymization = true`
- `consent.consentedAt`

Include `demandpulseAccount` only when you have a non-empty value.

Escape quotes correctly before sending JSON.

## Step 7: Confirm the result

If the API succeeds:

- tell the user the requirement was shared successfully
- include the trends URL: `https://demand-pulse.vercel.app/trends`

If the user typed their account during this run, offer to save it:

"Do you want to save this account to ~/.config/demandpulse/account so you won't be asked next time?"

Only write the file if the user explicitly agrees.

If the API fails:

- tell the user submission failed
- include the returned error message or HTTP status
- do not claim the requirement was recorded

## Important Rules

- Never submit without explicit confirmation.
- Default to anonymous submission unless an account is available or the user provides one.
- Do not include workspace paths, repository names, or personal identifiers in the submitted requirement text unless the user explicitly wants them shared.
- Do not ask for extra consent options beyond the fixed submission payload used by this plugin.
- Keep the interaction short and operational.
