# DemandPulse Handoff for Next Agent

Read this and doc/current_status.md to continue development.

## Project

Next.js 14 App Router: collect developer requirements from Claude Code, process with AI, cluster, trends. Stack: Next.js, TypeScript, Tailwind, Prisma, NextAuth (GitHub), Sentry.

## Completed

Core (requirements API + plugin, consent, DB), auth, full admin (sidebar + mobile drawer), security, growth (landing stats, analytics, trends, My Requirements, onboarding, referral, weekly digest, API docs, cache, vector clustering), mobile/responsive, P3-13 observability (instrumentation, global-error, withRequestLogging, MONITORING.md).

## In Progress - P3-14 i18n

Done: messages/en.json, messages/zh.json, lib/i18n.ts (LOCALE_COOKIE, SUPPORTED_LOCALES, getMessage).
TODO: (1) Client LocaleProvider with locale and t(key), read cookie NEXT_LOCALE. (2) POST /api/locale to set cookie. (3) Language switcher in LandingNav. (4) Wrap app with provider and use t() in landing/nav.

## Next

Finish P3-14; then P3-12 team/org. See doc/roadmap_growth.md.

## Commands

npm ci; npm run dev (needs .env). npm run build; npm test; npm run lint. E2E plugin: PLUGIN_API_KEY=key npm run e2e:plugin.
