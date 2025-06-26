#!/usr/bin/env node

/**
 * Help command for AI Arena - shows all available npm commands
 * Similar to Django's `python manage.py help`
 */

console.log(`
AI Arena - Available Commands

DEVELOPMENT
  npm run dev              Start development server (localhost:3000)
  npm run build            Build for production
  npm run start            Start production server
  npm run lint             Run ESLint code linting

DATABASE (Django-style)
  npm run makemigrations   Create new migration files from schema changes
  npm run migrate          Apply migrations to database
  npm run showmigrations   Show migration status (applied/pending)
  npm run dbshell          Open database GUI (Prisma Studio)
  npm run shell            Alias for dbshell - open database GUI
  npm run generate         Regenerate Prisma client after schema changes

PRODUCTION DATABASE
  npm run migrate:deploy   Deploy migrations (production environments)
  npm run migrate:reset    Reset all migrations (WARNING: destructive)
  npm run migrate:status   Check detailed migration status
  npm run db:seed          Seed database with initial data

TESTING
  npm run test:database    Test database operations (CRUD, search, etc.)
  npm run test:ollama      Full integration test with Ollama models
  npm run test:quick       Quick conversation test with custom topic
  npm run test:hybrid      Test hybrid client/server architecture

HELP & INFO
  npm run help             Show this help message

QUICK START EXAMPLES

  # Set up new project
  npm install && npm run migrate && npm run dev

  # Django-style database workflow
  npm run makemigrations   # After changing prisma/schema.prisma
  npm run migrate          # Apply the changes
  npm run showmigrations   # Verify what's applied

  # Test everything works
  npm run test:database    # Test database operations
  npm run test:ollama      # Test AI integration

  # Open database admin
  npm run dbshell          # Visual database editor

TIPS FOR DJANGO DEVELOPERS

  • makemigrations → migrate → showmigrations (same workflow!)
  • dbshell opens Prisma Studio (like Django Admin)
  • Schema changes go in prisma/schema.prisma (not models.py)
  • See DJANGO-COMMANDS.md for detailed comparison

DOCUMENTATION

  • README.md              - Getting started guide
  • DJANGO-COMMANDS.md     - Django developer guide
  • MIGRATION-TO-POSTGRESQL.md - Production database setup

TROUBLESHOOTING

  • If Ollama tests fail: Check 'ollama serve' is running
  • If database tests fail: Run 'npm run migrate' first
  • If dev server conflicts: Check if port 3000 is available
  • For API errors: Verify .env file has correct configuration

AI Arena - Where AIs debate, discuss, and explore ideas!
`);
