# DemandPulse

**Real-time demand radar for the AI-native developer era**

DemandPulse aggregates and analyzes developer needs from AI coding workflows, providing a live signal of unmet market opportunities. The platform captures high-level requirement descriptions (not code) from developers using AI assistants, analyzes them with AI, and visualizes what developers are actually trying to build right now.

## 🚀 Live Demo

- **Production**: https://demand-pulse.vercel.app
- **GitHub Actions**: CI/CD pipeline with automated testing and deployment

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

---

_Last updated: $(date)_
