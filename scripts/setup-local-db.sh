#!/bin/bash

# Setup script for local database testing
echo "🔧 Setting up local database for testing..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
fi

# Update DATABASE_URL for SQLite
echo "📝 Configuring SQLite database..."

# Create a backup
cp .env.local .env.local.backup

# Use a more compatible approach
cat > .env.local.tmp << 'EOF'
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DemandPulse

# API Keys
DEEPSEEK_API_KEY=sk-ad1c20254b264c7797291c63bc59b945

# Database
# For local development (SQLite - easier for testing):
DATABASE_URL=file:./dev.db

# For local development (PostgreSQL):
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/demandpulse

# For Neon PostgreSQL (production/development):
# DATABASE_URL=postgresql://neondb_owner:[password]@ep-[instance].pooler.us-east-2.aws.neon.tech/demandpulse?sslmode=require&connect_timeout=30

# For Prisma Data Platform (alternative):
# DATABASE_URL="prisma+postgres://prisma:password@aws-us-east-1.prisma-data.com/?api_key=your_api_key"

# Authentication (for future use)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Feature flags
ENABLE_CLAUDE_CODE_PLUGIN=true
ENABLE_AI_PROCESSING=true
EOF

mv .env.local.tmp .env.local

echo "✅ Local database configuration updated"
echo ""
echo "📋 Next steps:"
echo "1. Note: Current schema uses PostgreSQL-specific types"
echo "2. For SQLite testing, simplify the schema first"
echo "3. Or set up PostgreSQL for production-like testing"
echo "4. See DATABASE-SETUP.md for detailed instructions"