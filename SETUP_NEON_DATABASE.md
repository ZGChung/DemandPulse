# Neon PostgreSQL Database Setup for DemandPulse

This guide walks you through setting up a Neon PostgreSQL database for the DemandPulse project.

## Option 1: Create a Neon PostgreSQL Database (Recommended)

### Step 1: Sign up for Neon
1. Go to [neon.tech](https://neon.tech) and sign up for a free account
2. Neon offers a generous free tier with 3 projects, 10GB storage, and 500MB of RAM

### Step 2: Create a New Project
1. After signing in, click "Create a project"
2. Name your project "DemandPulse" or similar
3. Select PostgreSQL version 16 (recommended)
4. Choose a region close to your users (e.g., us-east-2 for Ohio)

### Step 3: Get Your Connection String
1. Once the project is created, go to the "Connection Details" section
2. Copy the connection string that looks like:
   ```
   postgresql://neondb_owner:[password]@ep-[instance].pooler.us-east-2.aws.neon.tech/demandpulse?sslmode=require
   ```
3. You can also find it under "Connection Details" → "PSQL"

### Step 4: Update Environment Variables
1. Open `.env.local` in your project root
2. Uncomment the Neon PostgreSQL line and paste your connection string:
   ```bash
   DATABASE_URL=postgresql://neondb_owner:your_password@ep-your-instance.pooler.us-east-2.aws.neon.tech/demandpulse?sslmode=require&connect_timeout=30
   ```
3. Make sure to replace `[password]` and `[instance]` with your actual values

### Step 5: Test the Connection
Run the following commands to test your database connection:

```bash
# Generate Prisma Client
npx prisma generate

# Push the schema to Neon
npx prisma db push

# Optional: Seed the database if you have seed data
# npx prisma db seed
```

## Option 2: Use Local PostgreSQL (Development Only)

If you prefer to use a local PostgreSQL database for development:

### Step 1: Install PostgreSQL
- **macOS**: `brew install postgresql`
- **Ubuntu/Debian**: `sudo apt install postgresql postgresql-contrib`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### Step 2: Start PostgreSQL
```bash
# macOS with Homebrew
brew services start postgresql

# Linux (systemd)
sudo systemctl start postgresql

# Create database
createdb demandpulse
```

### Step 3: Update Environment Variables
In `.env.local`, uncomment the local PostgreSQL line:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/demandpulse
```

## Option 3: Use Docker PostgreSQL (Alternative)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: demandpulse
      POSTGRES_PASSWORD: password
      POSTGRES_DB: demandpulse
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Then update `.env.local`:
```bash
DATABASE_URL=postgresql://demandpulse:password@localhost:5432/demandpulse
```

## Database Operations

### Run Migrations
```bash
# Push schema changes
npx prisma db push

# Or create a migration (if you modify schema.prisma)
npx prisma migrate dev --name init
```

### View Database with Prisma Studio
```bash
npx prisma studio
```

### Reset Database
```bash
npx prisma migrate reset
```

## Troubleshooting

### Connection Issues
1. **SSL Mode**: Neon requires SSL. Make sure `?sslmode=require` is in your connection string
2. **Timeout**: Add `&connect_timeout=30` for longer connection timeout
3. **Pooler**: Use the pooled connection URL (ends with `.pooler.`) for better performance

### Prisma Issues
1. **Client not generated**: Run `npx prisma generate`
2. **Schema out of sync**: Run `npx prisma db push`
3. **Environment variables**: Make sure `DATABASE_URL` is set in `.env.local`

### Neon-Specific
1. **Branching**: Neon supports database branching. Create a branch for development/staging
2. **Autoscaling**: Neon automatically scales compute resources
3. **Backups**: Automatic backups are included in the free tier

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Use different databases** for development, staging, and production
3. **Rotate database passwords** regularly
4. **Enable IP restrictions** in Neon dashboard for production databases
5. **Use connection pooling** for better performance and resource management

## Next Steps

After setting up the database:

1. Run `npx prisma db push` to create tables
2. Test the API endpoints that use the database
3. Verify data persistence by creating and retrieving requirements
4. Set up database backups and monitoring for production

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [DemandPulse Database Schema](/prisma/schema.prisma)