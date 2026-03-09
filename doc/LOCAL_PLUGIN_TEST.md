# Testing the DemandPulse plugin in Claude Code

Step-by-step guide to test the Claude Code plugin against the **live** DemandPulse app (https://demand-pulse.vercel.app). No need to run the app or database locally.

---

## Prerequisites

- **Claude Code** installed ([docs](https://docs.anthropic.com/en/docs/claude-code))
- **DemandPulse repo** cloned (so you can load the plugin from the `claude-plugin-demandpulse/` directory)

---

## Step 1: Load the plugin in Claude Code

The plugin talks to the live app by default (`https://demand-pulse.vercel.app`). You only need to load it from your repo so you’re using the latest skill and hook code.

From the **DemandPulse repo root** (where `claude-plugin-demandpulse/` lives):

```bash
claude --plugin-dir ./claude-plugin-demandpulse
```

Or, if Claude Code supports loading a plugin by path, point it at the full path to `claude-plugin-demandpulse`.

You should see the DemandPulse plugin loaded (e.g. skill `demandpulse:share` available).

---

## Step 2: Test the share flow (in-chat prompt)

1. In Claude Code, have a short conversation that includes a clear requirement, for example:
   - “I need a rate limiter for my Express API that uses Redis.”
   - “We should add retry logic when the payment gateway times out.”

2. Run:

   ```
   /demandpulse:share
   ```

3. Claude will:
   - Extract and summarize the requirement
   - Ask you to confirm
   - If you haven’t set an account (see Step 4), ask: “Enter your DemandPulse account (GitHub email or username) or press Enter to submit anonymously.”

4. **Link to your account (optional)**
   - Enter the **same email or username** you use to sign in at https://demand-pulse.vercel.app (GitHub).
   - After a successful submit, Claude may ask: “Save to local config so you won’t be asked next time?”
   - Answer **yes** to write `~/.config/demandpulse/account` so you’re not prompted again.

5. **Anonymous submit**
   - When asked for your DemandPulse account, press Enter (or say “skip”) to submit without linking.

6. You should see a success message and a link to the trends page.

---

## Step 3: Verify on the live app

- **Trends (public)**  
  Open **https://demand-pulse.vercel.app/trends**. New submissions may appear in trends depending on processing.

- **My requirements (logged in)**
  1. Sign in at **https://demand-pulse.vercel.app** with GitHub.
  2. Open the home page (“My requirements”).
  3. If you linked your account when sharing (entered your GitHub email/username), your submission should appear there.

---

## Step 4 (optional): Pre-set account so you’re not prompted

**Option A – Environment variable**

Before starting Claude Code:

```bash
export DEMANDPULSE_ACCOUNT=your@email.com
claude --plugin-dir ./claude-plugin-demandpulse
```

Use the same email or username you use to sign in at demand-pulse.vercel.app. Then run `/demandpulse:share`; Claude will not ask for your account.

**Option B – Config file**

```bash
mkdir -p ~/.config/demandpulse
echo 'your@email.com' > ~/.config/demandpulse/account
```

Use the same email or username as on the live site. The plugin will read this file; no need to set `DEMANDPULSE_ACCOUNT`.

---

## Step 5 (optional): Test the API with curl

To hit the live backend without Claude Code:

```bash
curl -s -X POST https://demand-pulse.vercel.app/api/plugin/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "originalRequirement": "Need rate limiting for Express API",
    "summarizedRequirement": "Rate limiter for Express with Redis",
    "demandpulseAccount": "your@email.com",
    "context": {
      "conversationId": "test-'$(date +%s)'",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    },
    "consent": {
      "consentOptions": { "dataCollection": true, "contact": false, "anonymization": true },
      "consentedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }
  }'
```

Replace `your@email.com` with the email you use to sign in at demand-pulse.vercel.app. You should get HTTP 201 and `"success": true`. Omit `demandpulseAccount` to submit anonymously.

---

## Troubleshooting

| Issue                                                | What to check                                                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/demandpulse:share` not recognized                  | Add as personal skill: `mkdir -p ~/.claude/skills && ln -s "$(pwd)/claude-plugin-demandpulse/skills/share" ~/.claude/skills/share`. Then use **`/share`**.   |
| Plugin can’t reach the app                           | By default the plugin uses https://demand-pulse.vercel.app. If you set `DEMANDPULSE_API_URL`, ensure it’s correct and reachable.                             |
| “Rate limit exceeded”                                | Anonymous submissions are limited per IP; wait or use `demandpulseAccount` so the request is tied to a user.                                                 |
| Submission succeeds but nothing in “My requirements” | Sign in at demand-pulse.vercel.app and use the same email/username as `demandpulseAccount` when you shared.                                                  |
| Claude doesn’t ask for my account                    | The skill reads from `DEMANDPULSE_ACCOUNT` or `~/.config/demandpulse/account` first. Unset the env or remove/empty the file to get the in-chat prompt again. |

---

## Summary

1. Load the plugin: `claude --plugin-dir ./claude-plugin-demandpulse` (from repo root), then run **`/demandpulse:share`**. If the command is not recognized, use the fallback in the troubleshooting table above (**`/share`** via personal skill).
2. In a conversation, run `/demandpulse:share`, confirm, and when asked enter your DemandPulse account (or skip for anonymous).
3. Optionally save the account to `~/.config/demandpulse/account` or set `DEMANDPULSE_ACCOUNT` so you’re not prompted next time.
4. Verify on **https://demand-pulse.vercel.app** (trends and, when signed in, My requirements).
