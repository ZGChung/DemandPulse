# DemandPulse Deployment Guide

## Prerequisites

1. **GitHub Account** with repository access
2. **Vercel Account** for deployment
3. **PostgreSQL Database** (Supabase, Neon, or self-hosted)
4. **DeepSeek API Key** for AI processing

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Application
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=DemandPulse

# API Keys (Keep these secret!)
DEEPSEEK_API_KEY=sk-your-deepseek-api-key

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication (Optional for MVP)
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://your-domain.vercel.app

# Rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Feature flags
ENABLE_CLAUDE_CODE_PLUGIN=true
ENABLE_AI_PROCESSING=true
```

## Deployment Steps

### 1. Local Development Setup

```bash
# Clone repository
git clone https://github.com/your-username/demandpulse.git
cd demandpulse

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### 2. GitHub Repository Setup

1. Push code to GitHub
2. Configure repository secrets in GitHub Settings → Secrets and variables → Actions:
   - `DEEPSEEK_API_KEY`
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

### 3. Vercel Deployment

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
vercel --prod
```

#### Option B: Vercel Dashboard
1. Import GitHub repository in Vercel
2. Configure environment variables in Vercel project settings
3. Deploy

### 4. Database Setup

#### Using Supabase (Recommended)
1. Create Supabase project
2. Get connection string from Project Settings → Database
3. Run migrations:
```bash
npx prisma db push
```

#### Using Neon
1. Create Neon project
2. Get connection string from Dashboard
3. Run migrations

### 5. CI/CD Pipeline

The GitHub Actions workflow (`/.github/workflows/ci.yml`) automatically:
- Runs tests on every push
- Builds application
- Deploys to Vercel on main branch
- Runs security checks

## China Accessibility Configuration

For users in China, configure:

### 1. DNS Configuration
- Use a China-optimized DNS provider
- Configure CNAME records for your domain

### 2. CDN Configuration
```json
{
  "regions": ["hkg1", "sin1", "syd1"],
  "headers": {
    "Cache-Control": "public, max-age=3600"
  }
}
```

### 3. Environment Optimization
```env
# Reduce external dependencies
ENABLE_EXTERNAL_ANALYTICS=false
USE_CHINA_OPTIMIZED_APIS=true
```

## Monitoring & Maintenance

### 1. Health Checks
- API: `GET /api/health`
- Database: Check Prisma connection
- AI Service: DeepSeek API status

### 2. Logging
- Vercel Logs for API routes
- Database query logs (optional)
- Error tracking with Sentry (recommended)

### 3. Backup Strategy
- Daily database backups
- Environment variable backups
- Code repository backups

## Security Considerations

### 1. API Security
- Rate limiting enabled
- CORS configured
- Input validation
- SQL injection prevention

### 2. Data Privacy
- GDPR compliance built-in
- Data anonymization
- Consent management
- Data retention policies

### 3. Secrets Management
- Never commit secrets to git
- Use environment variables
- Rotate API keys regularly
- Monitor for leaked secrets

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify network access
   - Check firewall settings

2. **AI Processing Errors**
   - Verify DeepSeek API key
   - Check rate limits
   - Monitor API status

3. **Build Failures**
   - Check Node.js version
   - Verify environment variables
   - Review build logs

### Support
- GitHub Issues for bug reports
- Vercel Support for deployment issues
- Database provider support for data issues

## Scaling Considerations

### 1. Database Scaling
- Connection pooling
- Read replicas for analytics
- Database indexing optimization

### 2. API Scaling
- Edge functions for global latency
- Caching strategy
- Load balancing

### 3. Cost Optimization
- Monitor API usage
- Optimize database queries
- Use CDN for static assets