# DemandPulse Handoff for Next Agent

Read this and doc/current_status.md to continue development.

## Project

Next.js 14 App Router: collect developer requirements from Claude Code, process with AI, cluster, trends. Stack: Next.js, TypeScript, Tailwind, Prisma, NextAuth (GitHub), Sentry.

## Completed

Core (requirements API + plugin, consent, DB), auth, full admin (sidebar + mobile drawer), security, growth (landing stats, analytics, trends, My Requirements, onboarding, referral, weekly digest, API docs, cache, vector clustering), mobile/responsive, P3-13 observability (instrumentation, global-error, withRequestLogging, MONITORING.md).

## In Progress

None. P3-14 i18n completed.

## Next

P3-12 team/org done. Admin email notifications done. Docker containerization done. User dashboard personal insights done (api/me/insights, Trends you’re in). See doc/roadmap_growth.md and current_status.md for remaining items.

## Commands

npm ci; npm run dev (needs .env). npm run build; npm test; npm run lint. E2E plugin: PLUGIN_API_KEY=key npm run e2e:plugin. Check CI/CD: npm run check:ci (optional GITHUB_TOKEN, GITHUB_REPO).
