# Migration Guide: SQLite to PostgreSQL

This guide explains how to migrate from SQLite (development) to PostgreSQL (production) for the AI Arena platform.

## Overview

The AI Arena platform is designed with easy database migration in mind:

- **Development**: Uses SQLite for simplicity and zero setup
- **Production**: Uses PostgreSQL for scalability and reliability

## Prerequisites

- PostgreSQL server running (local or cloud)
- Database credentials available
- Backup of your current SQLite data (optional)

## Step 1: Update Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

## Step 2: Update Environment Variables

Update your `.env` file (or production environment):

```bash
# Development (SQLite)
# DATABASE_URL="file:./dev.db"

# Production (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/ai_arena"
```

### Example for different environments:

#### Local PostgreSQL

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_arena"
```

#### Heroku PostgreSQL

```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
```

#### Railway PostgreSQL

```bash
DATABASE_URL="postgresql://postgres:pass@containers-us-west-X.railway.app:XXXX/railway"
```

#### Supabase PostgreSQL

```bash
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

## Step 3: Generate and Apply Migration

```bash
# Generate Prisma client for PostgreSQL
npm run generate

# Apply schema to PostgreSQL (creates tables)
npm run migrate

# Or create migration files first (Django-style)
npm run makemigrations
npm run migrate
```

## Step 4: Data Migration (Optional)

If you want to migrate existing SQLite data to PostgreSQL:

### Option A: Export/Import via JSON

```bash
# Export from SQLite
node scripts/export-data.js > backup.json

# Import to PostgreSQL
node scripts/import-data.js backup.json
```

### Option B: Use Prisma Studio

1. Open SQLite database: `npx prisma studio`
2. Export data manually
3. Switch to PostgreSQL and import

### Option C: Custom Migration Script

Create a migration script that reads from SQLite and writes to PostgreSQL.

## Step 5: Update Production Scripts

For production deployment, update your `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "node scripts/seed.js"
  }
}
```

## Step 6: Deployment Configuration

### Vercel

Add to `vercel.json`:

```json
{
  "build": {
    "env": {
      "PRISMA_GENERATE_SKIP_AUTOINSTALL": "true"
    }
  },
  "functions": {
    "app/api/**/*": {
      "maxDuration": 30
    }
  }
}
```

### Railway

Add to `railway.json`:

```json
{
  "build": {
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

### Docker

Add to `Dockerfile`:

```dockerfile
# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy app
COPY . .
RUN npm run build

# Run migrations on startup
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

## Step 7: Environment-Specific Configuration

Create different database configurations for different environments:

### `.env.local` (Development)

```bash
DATABASE_URL="file:./dev.db"
```

### `.env.production` (Production)

```bash
DATABASE_URL="postgresql://username:password@host:5432/ai_arena"
```

## Step 8: Testing Migration

Test the migration thoroughly:

```bash
# Test database operations
npm run test:database

# Test full application
npm run test:hybrid

# Check database GUI (Django's dbshell equivalent)
npm run dbshell
```

## Key Differences: SQLite vs PostgreSQL

| Feature          | SQLite               | PostgreSQL             |
| ---------------- | -------------------- | ---------------------- |
| Setup            | Zero configuration   | Requires server setup  |
| Scalability      | Single file, limited | Highly scalable        |
| Concurrency      | Limited writes       | Excellent concurrency  |
| Data Types       | Limited              | Rich type system       |
| Full-text Search | Basic                | Advanced (GIN indexes) |
| JSON Support     | Basic                | Advanced JSONB         |
| Deployment       | File-based           | Server-based           |

## Schema Compatibility

Our Prisma schema is designed to be compatible with both databases:

- ✅ `String` fields work in both
- ✅ `DateTime` with `@default(now())` works in both
- ✅ `@id @default(cuid())` works in both
- ✅ Relations work identically
- ✅ Enums work in both

## Troubleshooting

### Common Issues

1. **Connection String Format**

   - Ensure proper escaping of special characters
   - Check SSL requirements for cloud databases

2. **Migration Errors**

   - Ensure PostgreSQL is running
   - Check user permissions
   - Verify database exists

3. **Type Mismatches**
   - Our schema is designed to be compatible
   - Check for any custom SQL in migrations

### Rolling Back

To roll back to SQLite:

1. Change `prisma/schema.prisma` provider back to `"sqlite"`
2. Update `DATABASE_URL` back to `"file:./dev.db"`
3. Run `npm run db:push`

## Performance Considerations

PostgreSQL optimizations for production:

1. **Indexes**: Add indexes for frequently queried fields
2. **Connection Pooling**: Use PgBouncer or similar
3. **Read Replicas**: For high-traffic scenarios
4. **Monitoring**: Set up query performance monitoring

## Security Considerations

1. **Environment Variables**: Never commit production credentials
2. **SSL**: Always use SSL in production
3. **User Permissions**: Create dedicated database user with minimal permissions
4. **Backups**: Set up regular database backups

## Next Steps

After migration:

1. Monitor performance
2. Set up database backups
3. Configure monitoring and alerts
4. Plan for scaling as user base grows

## Support

For issues with migration:

1. Check Prisma documentation
2. Review PostgreSQL logs
3. Test with a small dataset first
4. Consider gradual migration strategies
