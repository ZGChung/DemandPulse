# DemandPulse Claude Code Plugin

Share developer requirements with the DemandPulse community — zero config by default.

**Requirements:** Claude Code 1.0.33 or later. Run `claude --version` to check.

## Install (recommended)

**Option A — From the plugin marketplace (if available)**  
In Claude Code, run:

```bash
/plugin install demandpulse
```

**Option B — Load from source**  
From the DemandPulse repo root (the directory that contains `claude-plugin-demandpulse/`), run:

```bash
claude --plugin-dir ./claude-plugin-demandpulse
```

Or with an absolute path so the plugin is always found:

```bash
claude --plugin-dir "$(pwd)/claude-plugin-demandpulse"
```

Then in Claude Code, run **`/demandpulse:share`** after a conversation where you discuss a feature, bug, or improvement.

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
├── commands/share.md             # Slash command (same as skill)
├── hooks/hooks.json              # Stop hook (for optional auto-submit)
├── skills/share/
│   └── SKILL.md                  # /demandpulse:share skill
├── bin/hook-handler.mjs          # Hook handler
└── README.md
```

## Troubleshooting: `/demandpulse:share` not found

If the slash command is not recognized after loading the plugin with `--plugin-dir`:

1. **Run from the repo root** — `claude --plugin-dir ./claude-plugin-demandpulse` must be run from the directory that contains `claude-plugin-demandpulse/`.
2. **Use an absolute path** — `claude --plugin-dir "$(pwd)/claude-plugin-demandpulse"` (from that same root).
3. **Restart Claude Code** fully (quit and relaunch) after changing the plugin.
4. **Check `/help`** — look for `demandpulse` or `demandpulse:share` in the list.

If the command still does not appear, some Claude Code versions have known issues with plugin slash commands when using `--plugin-dir`. As a **fallback**, add the skill as a personal skill so you can use **`/share`** (same behavior):

```bash
mkdir -p ~/.claude/skills
ln -s "$(pwd)/claude-plugin-demandpulse/skills/share" ~/.claude/skills/share
```

Run the above from the DemandPulse repo root. Then in Claude Code use **`/share`** instead of `/demandpulse:share`.

## License

MIT
