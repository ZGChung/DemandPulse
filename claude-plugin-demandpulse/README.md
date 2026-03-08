# DemandPulse Claude Code Plugin

Share developer requirements with the DemandPulse community — zero config by default.

## Install

```bash
/plugin install demandpulse
```

Or load from source:

```bash
claude --plugin-dir ./claude-plugin-demandpulse
```

## Usage

After a conversation where you discuss a feature need, bug, or improvement:

```
/demandpulse:share
```

Claude will:

1. Extract the requirement from your conversation
2. Summarize it in one sentence
3. Show you the summary and ask for confirmation
4. Optionally ask for your DemandPulse account (GitHub email or username) to link the submission to your account
5. Submit to the DemandPulse community

See what developers are building at **https://demand-pulse.vercel.app/trends**

## Linking to your DemandPulse account

Submissions can be linked to your DemandPulse account (the same GitHub email or username you use to sign in at demand-pulse.vercel.app) so they appear under "My requirements". No API key or Anthropic account needed.

- **Technical users**: Set your account once so you're never prompted:
  ```bash
  export DEMANDPULSE_ACCOUNT=your@email.com
  ```
  Or create `~/.config/demandpulse/account` with one line (your email or GitHub username).
- **Others**: The first time you run `/demandpulse:share`, Claude will ask you to enter your DemandPulse account. You can then choose to save it locally so you won't be asked again.

## No config required by default

The plugin works out of the box. If you don't provide an account, submissions are anonymous.

### Optional: Auto-submit (Power Users)

If you want requirements auto-detected and submitted on every session end:

```bash
export DEMANDPULSE_AUTO_SUBMIT=true
```

If you have set `DEMANDPULSE_ACCOUNT` or saved your account to `~/.config/demandpulse/account`, auto-submitted requirements will be linked to your account. This is disabled by default; most users should use `/demandpulse:share` instead.

## Privacy

- All submissions are anonymous by default
- No file paths, usernames, or PII are included
- You always see what will be shared before it's sent
- Data collection requires your explicit confirmation

## Structure

```
claude-plugin-demandpulse/
├── .claude-plugin/plugin.json    # Plugin manifest
├── hooks/hooks.json              # Stop hook (for optional auto-submit)
├── skills/submit-requirement/
│   └── SKILL.md                  # /demandpulse:share skill
├── bin/hook-handler.mjs          # Hook handler
└── README.md
```

## License

MIT
