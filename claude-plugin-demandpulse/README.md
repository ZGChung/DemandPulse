# DemandPulse Claude Code Plugin

DemandPulse lets Claude Code users share real developer requirements with the DemandPulse community trends dashboard.

The plugin is designed for explicit, low-friction sharing:

- `/demandpulse:share` turns the current conversation into a sanitized requirement draft
- Claude shows the summary and asks for confirmation before anything is sent
- Submissions are anonymous by default
- Users can optionally link a DemandPulse account to see their own submissions later
- An optional stop hook can auto-submit likely requirements for power users who opt in

## Requirements

- Claude Code with plugin support
- Node.js 18 or later
- Internet access to reach `https://demand-pulse.vercel.app`

## Install

### Marketplace install

If the plugin is published in a Claude Code marketplace, install it there and restart Claude Code after installation.

### Local install for development

From the DemandPulse repo root:

```bash
claude --plugin-dir ./claude-plugin-demandpulse
```

Or use the installer:

```bash
cd claude-plugin-demandpulse
npm install
npm run install-plugin
```

The installer copies the plugin into a Claude Code plugin directory so it can be loaded on restart.

## What Gets Installed

The plugin package contains:

- `.claude-plugin/plugin.json` for Claude Code plugin metadata
- `commands/share.md` for the `/demandpulse:share` slash command
- `skills/share/` for the guided sharing workflow
- `skills/submit-requirement/` for model-invoked requirement submission behavior
- `hooks/hooks.json` and `bin/hook-handler.mjs` for optional stop-hook auto-submit

## Usage

After a conversation where the user discusses a feature request, bug, missing integration, workflow pain point, or improvement:

```text
/demandpulse:share
```

The plugin should then:

1. Extract the main requirement from the current conversation.
2. Summarize it in one sentence.
3. Show the summary and extracted source text.
4. Ask for explicit confirmation.
5. Check for a saved DemandPulse account.
6. Submit the requirement to DemandPulse.

## Account Linking

Submissions can be linked to the user’s DemandPulse account using the same GitHub email or username they use to sign in at `demand-pulse.vercel.app`.

Supported account sources:

- `DEMANDPULSE_ACCOUNT`
- `~/.config/demandpulse/account`
- Direct user input at submit time

If no account is available, the submission stays anonymous.

## Environment Variables

Optional configuration:

- `DEMANDPULSE_ACCOUNT`: Default account identifier for linked submissions
- `DEMANDPULSE_AUTO_SUBMIT=true`: Enable stop-hook auto-submit
- `DEMANDPULSE_API_URL`: Override the default API base URL

Default API base URL:

```text
https://demand-pulse.vercel.app
```

## Privacy

The plugin is intended to collect product requirements, not workspace secrets.

- Explicit confirmation is required before manual submission
- Submissions should be sanitized to avoid file paths, usernames, tokens, and other PII
- Anonymous submission is the default path
- Linked submissions use only the account identifier the user chose to provide

## Release Checklist

For a marketplace release, verify all of the following:

- `.claude-plugin/plugin.json` has the correct name, description, version, and paths
- `commands/`, `skills/`, `hooks/`, and runtime files are included in the package artifact
- README installation and usage instructions match the released plugin behavior
- Command names in docs, installer output, and manifest are consistent
- The stop hook remains opt-in and clearly documented

## Validate The Package

From `claude-plugin-demandpulse/`:

```bash
npm pack --dry-run --ignore-scripts
```

That should show the packaged files that a marketplace or npm-based install will receive.

## Troubleshooting

If `/demandpulse:share` is missing:

- Restart Claude Code after installing or updating the plugin
- Confirm the plugin package includes the `commands/` directory
- Confirm the plugin was installed at the plugin root, not nested inside another directory
- For local development, verify the `--plugin-dir` path points directly at `claude-plugin-demandpulse/`

If account linking does not work:

- Check `DEMANDPULSE_ACCOUNT`
- Check `~/.config/demandpulse/account`
- Submit once manually and save the account when prompted

If auto-submit does not run:

- Confirm `DEMANDPULSE_AUTO_SUBMIT=true`
- Confirm Claude Code is loading the plugin hooks
- Confirm the conversation contains a recognizable requirement-like user message

## License

MIT
