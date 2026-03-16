# DemandPulse

**Real-time demand radar for the AI-native developer era**

DemandPulse aggregates and analyzes developer needs from AI coding workflows, providing a live signal of unmet market opportunities. The platform captures high-level requirement descriptions (not code) from developers using AI assistants, analyzes them with AI, and visualizes what developers are actually trying to build right now.

## 🚀 Live Demo

- **Production**: https://demand-pulse.vercel.app
- **Connect plugin**: https://demand-pulse.vercel.app/connect-plugin — install the Claude Code plugin and link submissions to your account
- **GitHub Actions**: CI/CD pipeline with automated testing and deployment

## 🔌 Connect Claude Code (plugin)

Requirements are collected from Claude Code via the DemandPulse plugin. You do **not** need to run the app locally; the plugin talks to the live site by default.

1. **Install** (in Claude Code): `/plugin install demandpulse`  
   Or from this repo (run from repo root): `claude --plugin-dir ./claude-plugin-demandpulse`
2. **Share a requirement**: In a conversation, run **`/demandpulse:share`**.
3. When prompted, enter your DemandPulse account (GitHub email or username) to link the submission to your account; or skip to submit anonymously.
4. View your submissions and trends at https://demand-pulse.vercel.app (My requirements and Trends).

Submissions go to the **live** database and appear on the site once processed.

## 📋 Features

### Current Implementation

- ✅ Real-time dashboard with demand overview
- ✅ Requirement statistics and trending clusters
- ✅ Claude Code integration for data collection
- ✅ **Mock Claude Code integration for testing**
- ✅ AI-powered requirement processing
- ✅ Privacy-first design with user consent
- ✅ **User authentication with NextAuth.js + GitHub OAuth**
- ✅ PostgreSQL database with Prisma ORM
- ✅ **SQLite support for development/testing**
- ✅ CI/CD pipeline with GitHub Actions
- ✅ Automated deployment to Vercel
- ✅ **Comprehensive security hardening (CORS, headers, validation)**
- ✅ **Structured logging and monitoring**
- ✅ **End-to-end testing framework**

### Coming Soon

- 🔄 Real-time data ingestion from AI coding tools
- 🔄 Advanced clustering and trend detection
- 🔄 Developer opt-in connection layer
- 🔄 B2B subscription dashboard
- 🔄 API for demand intelligence

## 📐 Design note (requirement vs contribution)

In the backend there is only one concept: **requirement** (one row in the `Requirement` table per submission). In the UI we often say **contribution** (“You have contributed X requirements”) to emphasize that the user is contributing to the community; the count is still the number of requirements linked to that user. See [doc/DESIGN.md](doc/DESIGN.md) for details.

## 🏗️ Architecture

```
Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend: Next.js API Routes + Prisma ORM
Database: PostgreSQL (Neon.tech)
AI Processing: DeepSeek API
CI/CD: GitHub Actions → Vercel
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- DeepSeek API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ZGChung/DemandPulse.git
cd DemandPulse
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Set up database:

```bash
npx prisma generate
npx prisma db push
```

5. Run development server:

```bash
npm run dev
```

6. Open http://localhost:3000

### Running with Docker

Build and run the production image:

```bash
cp .env.example .env
# Set NEXTAUTH_SECRET and optional DATABASE_URL in .env
docker compose up --build
```

Or build only: `docker build -t demandpulse .` then run with `docker run -p 3000:3000 --env-file .env demandpulse`.  
Requires `NEXTAUTH_SECRET` and (for auth) GitHub OAuth credentials in the env. For SQLite persistence, use a volume and `DATABASE_URL=file:/path/in/container/dev.db`.

## 📊 Development Roadmap

### Phase 1: Core Platform (Current)

- [x] Basic dashboard UI
- [x] API infrastructure
- [x] Database schema
- [x] CI/CD pipeline
- [x] Claude Code integration

### Phase 2: Data Collection & Processing

- [ ] Real-time requirement ingestion
- [ ] AI-powered clustering
- [ ] Trend detection algorithms
- [ ] Data anonymization pipeline

### Phase 3: Intelligence Layer

- [ ] Advanced analytics dashboard
- [ ] Search and discovery
- [ ] API for external access
- [ ] Custom reporting

### Phase 4: Monetization & Scale

- [ ] B2B subscription system
- [ ] Developer connection layer
- [ ] Enterprise features
- [ ] Multi-region deployment

## 🔧 API Endpoints

- `GET /api/health` - System health check
- `POST /api/requirements` - Submit new requirements
- `GET /api/requirements` - Get requirements (with filtering)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Contact

For questions or feedback, please open an issue on GitHub.

## 🎯 Strategic Positioning

DemandPulse is positioned as an **open-source collaborative project** rather than a traditional startup:

| Aspect        | Positioning                                                |
| ------------- | ---------------------------------------------------------- |
| **Goal**      | Solve cold start problem through open-source collaboration |
| **Model**     | Community-driven development with contributors             |
| **Incentive** | Reputation (GitHub stars, recognition) for contributors    |
| **Focus**     | Specific细分场景 (developer demand signal) - not broad     |

### Why Open Source?

- **Developer attention** is scarce — open source attracts organic interest
- **Collaborative mode** reduces maintenance cost
- **Community feedback** improves product faster than solo development

### Success Metrics

- GitHub stars and contributor count
- Active submissions from community
- Quality of clustering/insights generated

---

_Built with the belief that understanding what developers are building reveals market opportunities._
