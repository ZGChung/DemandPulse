# Database Setup Guide

This guide explains how to set up databases for DemandPulse development and testing.

## Quick Start

For immediate testing without database setup:

```bash
# Test database configuration (no actual database required)
npm run db:simple-test
```

## Option 1: SQLite (Simplest for Development)

SQLite is the easiest option for local development testing.

### Setup Steps:

1. **Update schema for SQLite compatibility**:

   ```prisma
   # In prisma/schema.prisma, change:
   datasource db {
     provider = "postgresql"  # Change this to "sqlite"
   }
   ```

2. **Remove PostgreSQL-specific types**:
   - Remove `@db.Text` annotations (SQLite uses String)
   - Remove `@db.VarChar(255)` (use String)
   - Remove `@db.JsonB` (use Json)
   - Change `String[]` arrays to `Json` type

3. **Update environment**:

   ```bash
   # In .env.local
   DATABASE_URL=file:./dev.db
   ```

4. **Run migrations**:

   ```bash
   npx prisma db push
   ```

5. **Test connection**:
   ```bash
   npm run db:test
   ```

## Option 2: Local PostgreSQL (Recommended for Production-like Testing)

### Installation (macOS):

```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database
createdb demandpulse
```

### Configuration:

1. **Update environment**:

   ```bash
   # In .env.local
   DATABASE_URL=postgresql://postgres@localhost:5432/demandpulse

   # If you set a password:
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/demandpulse
   ```

2. **Run migrations**:

   ```bash
   npx prisma db push
   ```

3. **Test connection**:
   ```bash
   npm run db:test
   ```

## Option 3: Neon PostgreSQL (Cloud - Easiest for Team Collaboration)

Neon provides free PostgreSQL databases in the cloud.

### Setup Steps:

1. **Sign up for Neon** at [neon.tech](https://neon.tech)

2. **Create a new project** and database

3. **Get connection string** from Neon dashboard

4. **Update environment**:

   ```bash
   # In .env.local
   DATABASE_URL=postgresql://neondb_owner:[password]@ep-[instance].pooler.us-east-2.aws.neon.tech/demandpulse?sslmode=require&connect_timeout=30
   ```

5. **Run migrations**:

   ```bash
   npx prisma db push
   ```

6. **Test connection**:
   ```bash
   npm run db:test
   ```

## Testing Commands

| Command                  | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `npm run db:simple-test` | Check database configuration without connecting |
| `npm run db:test`        | Full database connection test                   |
| `npm run db:push`        | Apply database schema migrations                |
| `npm run db:studio`      | Open Prisma Studio (database GUI)               |
| `npm run db:generate`    | Generate Prisma Client                          |

## Troubleshooting

### "DATABASE_URL is not set"

- Check that `.env.local` exists and has `DATABASE_URL`
- Run: `cp .env.example .env.local` and update DATABASE_URL

### "Prisma CLI not available"

- Run: `npm install` to install dependencies

### PostgreSQL connection issues:

- Ensure PostgreSQL is running: `brew services list | grep postgres`
- Check port: PostgreSQL default is 5432
- Verify database exists: `psql -l`

### SQLite schema errors:

- Current schema uses PostgreSQL-specific types
- Simplify schema or use PostgreSQL

## Development Notes

- **For quick testing**: Use SQLite with simplified schema
- **For production testing**: Use PostgreSQL (local or Neon)
- **Schema**: Current schema is optimized for PostgreSQL
- **Migrations**: Use `npx prisma db push` for schema changes
