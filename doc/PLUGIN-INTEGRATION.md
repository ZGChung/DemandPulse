# Claude Code Plugin — Real Integration

End-to-end flow: Claude Code plugin → DemandPulse backend (real API, no mock).

## Backend

1. Set in `.env`:
   - `PLUGIN_API_KEY=<secret>` (shared with plugin clients)
2. Start server: `npm run dev` (or deploy with env set).
3. Plugin endpoint: `POST /api/plugin/requirements` with header `x-api-key: <PLUGIN_API_KEY>`.

## Plugin (Claude Code)

1. Install: `claude --plugin-dir ./claude-plugin-demandpulse` or copy to `~/.config/claude-code/plugins/demandpulse`.
2. Set env for Claude Code:
   - `DEMANDPULSE_API_URL` — backend URL (default `http://localhost:3000`; production use your deployed URL).
   - `DEMANDPULSE_API_KEY` — same value as server `PLUGIN_API_KEY`.
3. Use skill: `/demandpulse:submit` to submit a requirement from the conversation.

## E2E check

With server running and `PLUGIN_API_KEY` set:

```bash
PLUGIN_API_KEY=your-key npm run e2e:plugin
```

Or: `./scripts/e2e-plugin-api.sh` (set `PLUGIN_API_KEY` and optionally `DEMANDPULSE_API_URL`).
