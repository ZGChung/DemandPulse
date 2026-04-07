# DemandPulse

> **Real-time demand radar for AI-native developers**

[![CI](https://github.com/ZGChung/DemandPulse/actions/workflows/ci.yml/badge.svg)](https://github.com/ZGChung/DemandPulse/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

DemandPulse connects **vibe coders** with **professional SWEs** by aggregating what developers are actually trying to build — revealing unmet market opportunities in real time.

## 🎯 Who is this for?

| User                  | How they benefit                                                    |
| --------------------- | ------------------------------------------------------------------- |
| **Vibe coders**       | Share requirements effortlessly, see your needs reflected in trends |
| **Professional SWEs** | Discover emerging opportunities before they become mainstream       |
| **Technical PMs**     | Real-time signal on what developers actually need                   |
| **Indie hackers**     | Find underserved niches from authentic developer demand             |

## ✨ Why DemandPulse?

Most trend data comes from:

- Job postings (lagging indicator)
- GitHub stars (only popular repos)
- Surveys (self-reported, often wrong)

DemandPulse captures **live developer intent** from actual coding sessions — not what people say they need, but what they _actually try to build_.

## 🔌 Quick Start (Claude Code Plugin)

The plugin is the primary way to contribute requirements.

### 1. Install the plugin

**Option A — From this repo:**

```bash
git clone https://github.com/ZGChung/DemandPulse.git
cd DemandPulse
claude --plugin-dir ./claude-plugin-demandpulse
```

**Option B — Marketplace (when available):**

```
/plugin install demandpulse
```

### 2. Share a requirement

After a conversation about a feature, bug, or workflow pain point:

```
/demandpulse:share
```

The plugin will:

1. Extract the main requirement from your conversation
2. Summarize it in one sentence
3. Ask for your confirmation
4. Submit anonymously (or link your account)

### 3. View trends

Visit [demand-pulse.vercel.app/trends](https://demand-pulse.vercel.app/trends) to see what's emerging.

## 📊 Live Demo

- **Trends Dashboard**: https://demand-pulse.vercel.app/trends
- **Submit Requirements**: https://demand-pulse.vercel.app/connect-plugin
- **Your Submissions**: https://demand-pulse.vercel.app (My requirements)

## 🏗️ Architecture

```
Frontend:     Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend:      Next.js API Routes + Prisma ORM
Database:     PostgreSQL (Neon.tech) / SQLite (dev)
AI:           DeepSeek API for requirement clustering
Auth:         NextAuth.js + GitHub OAuth
Plugin:       Claude Code plugin (Node.js)
CI/CD:        GitHub Actions → Vercel
```

## 🚀 Self-Hosting / Development

### Prerequisites

- Node.js 20+
- Claude Code
- PostgreSQL (production) or SQLite (dev)

### Setup

```bash
# Clone
git clone https://github.com/ZGChung/DemandPulse.git
cd DemandPulse

# Install
npm install

# Environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Database
npx prisma generate
npx prisma db push

# Run
npm run dev
```

### Environment Variables

```bash
# Auth (required)
GITHUB_ID=<github-oauth-app-id>
GITHUB_SECRET=<github-oauth-app-secret>
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL="file:./dev.db"  # SQLite for dev
# DATABASE_URL="postgresql://..." # PostgreSQL for prod

# Plugin (for testing plugin integration)
PLUGIN_API_KEY=<your-key>
```

### Testing

```bash
npm test          # Run all tests
npm run lint      # Lint
npm run typecheck # Type check
```

## 📋 Features

### Current

- ✅ `/demandpulse:share` — one-command requirement sharing from Claude Code
- ✅ Real-time trends dashboard
- ✅ AI-powered requirement clustering
- ✅ Anonymous + account-linked submission modes
- ✅ Privacy-first (opt-in, sanitized data)
- ✅ GitHub OAuth authentication
- ✅ Comprehensive test suite (55 suites, 1200+ tests)
- ✅ CI/CD with GitHub Actions

### Coming Soon

- 🔄 Plugin marketplace listing
- 🔄 Advanced trend detection
- 🔄 Email digests for trend watchers

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, branch naming, and commit format.

## 📄 License

MIT — see [LICENSE](LICENSE)

## 📞 Resources

- [API Documentation](doc/API.md)
- [Plugin Integration Guide](doc/PLUGIN-INTEGRATION.md)
- [Claude Code Hooks Reference](doc/CLAUDE_CODE_API.md)
- [Development Status](doc/current_status.md)

---

_Built with the belief that understanding what developers are building reveals market opportunities._
