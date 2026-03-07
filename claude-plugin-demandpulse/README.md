# DemandPulse Claude Code Plugin

Share developer requirements with the DemandPulse community — zero config, fully anonymous.

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
4. Submit it anonymously to the DemandPulse community

See what developers are building at **https://demand-pulse.vercel.app/trends**

## No Config Required

The plugin works out of the box. No API keys, no environment variables, no setup.

### Optional: Auto-submit (Power Users)

If you want requirements auto-detected and submitted on every session end:

```bash
export DEMANDPULSE_AUTO_SUBMIT=true
```

This is disabled by default. Most users should use `/demandpulse:share` instead.

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
