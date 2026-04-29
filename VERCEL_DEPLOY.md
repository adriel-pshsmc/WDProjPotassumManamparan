# Deploying to Vercel (serverless) — quicknotes

This project includes serverless API routes under `api/auth/*` using `iron-session` for encrypted cookie sessions. These routes rely on `src/db.js` which supports both SQLite (local) and Postgres (Neon) via `DATABASE_URL`.

Steps
1. Provision Neon (or other Postgres) and run migrations:
   ```bash
   psql "$DATABASE_URL" -f migrations/001_create_users.sql
   ```

2. In Vercel project settings add the following environment variables:
   - DATABASE_URL
   - IRON_SESSION_PASSWORD (at least 32 characters)
   - NODE_ENV=production
   - PG_SERVERLESS=1

3. Deploy to Vercel (push to GitHub then import, or use the CLI):
   ```bash
   vercel --prod
   ```

Local testing
 - Use `vercel dev` to run the serverless functions locally.
