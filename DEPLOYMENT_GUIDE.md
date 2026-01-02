# Atomic CRM Deployment Guide

## Environment Configuration

This project uses **environment-based configuration** to switch between local development and production Supabase instances.

### Environment File Priority (Vite)

**For `npm run dev` (development mode)**:
```
.env.development.local  ← HIGHEST PRIORITY (git-ignored) ← YOU ARE HERE
.env.local              ← Second priority (git-ignored)
.env.development        ← Development defaults (local Supabase)
.env                    ← Base configuration
```

**For `npm run build` (production build)**:
```
.env.production.local   ← HIGHEST PRIORITY (git-ignored)
.env.production         ← Production defaults
.env                    ← Base configuration
```

---

## Development Workflows

### Option 1: Local Supabase (Original Setup)

**Use Case**: Full local development with local database

**Setup**:
```bash
# 1. Remove production override (if exists)
rm .env.development.local
rm .env.production.local

# 2. Start full local stack (Supabase + Vite)
make start
```

**Access**:
- Frontend: http://localhost:5173/
- Supabase Dashboard: http://localhost:54323/
- REST API: http://127.0.0.1:54321
- Database: postgres://postgres:postgres@127.0.0.1:54322/postgres

**Credentials** (from `.env.development`):
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Option 2: Production Supabase (Current Setup)

**Use Case**: Connect to production database from local dev server

**Setup**:
```bash
# 1. Ensure .env.development.local exists with production credentials (already configured)
# File is git-ignored, so it won't be committed

# 2. Start only Vite dev server (no local Supabase)
npm run dev
```

**Access**:
- Frontend: http://localhost:5173/
- Database: https://spdtwktxdalcfigzeqrz.supabase.co (production)
- Schema: `crm` (isolated from Finance PPM in `public`)

**Credentials** (from `.env.local`):
```bash
VITE_SUPABASE_URL=https://spdtwktxdalcfigzeqrz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Schema Isolation

**Production Supabase Project**: `spdtwktxdalcfigzeqrz`

**Schemas**:
- `public` → Finance PPM, BIR, Odoo tables (existing)
- `crm` → Atomic CRM tables (new)

**Tables in `crm` schema**:
- companies
- contacts
- contactNotes
- deals
- dealNotes
- sales
- tags
- tasks

**Configuration**:
- Supabase client configured to use `crm` schema (see `src/components/atomic-crm/providers/supabase/supabase.ts`)
- Database migrations applied to `crm` schema
- No conflicts with existing Finance PPM tables

---

## Switching Between Environments

### Local → Production
```bash
# Create .env.local with production credentials (already done)
cp .env.local.example .env.local  # (if starting fresh)

# Restart dev server
npm run dev
```

### Production → Local
```bash
# Remove production override
rm .env.local

# Start full local stack
make start
```

---

## Production Deployment

**Platform**: Vercel (recommended) or any static hosting

**Build Command**:
```bash
npm run build
```

**Environment Variables** (Vercel/hosting):
```bash
VITE_SUPABASE_URL=https://spdtwktxdalcfigzeqrz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_IS_DEMO=false
VITE_INBOUND_EMAIL=2aff30e603e54dc3eb556bd9e03ee099@inbound.postmarkapp.com
```

**Deployment Steps**:
1. Push to GitHub
2. Connect repo to Vercel
3. Configure environment variables
4. Deploy

---

## Database Migrations

### Production Supabase
```bash
# Apply migrations to 'crm' schema
psql "$DATABASE_URL" -c "SET search_path TO crm;" -f supabase/migrations/<migration>.sql

# Or use modified migrations (schema already changed)
psql "$DATABASE_URL" -f /tmp/atomic_crm_schema.sql
```

### Local Supabase
```bash
# Standard workflow
npx supabase migration new <name>
npx supabase migration up
```

---

## Troubleshooting

**Problem**: App connects to wrong Supabase instance

**Solution**:
```bash
# Check which .env files exist
ls -la .env*

# Verify .env.local has production URL
cat .env.local | grep VITE_SUPABASE_URL

# Restart dev server to reload env vars
npm run dev
```

**Problem**: Auth errors when creating accounts

**Solution**:
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/spdtwktxdalcfigzeqrz
2. Navigate to: **Authentication** → **Providers** → **Email**
3. Disable **Email confirmations** for development

**Problem**: Table conflicts between Finance PPM and CRM

**Solution**:
- Already resolved via schema isolation
- Finance PPM uses `public` schema
- Atomic CRM uses `crm` schema
- Supabase client configured for `crm` schema

---

## Current Status

✅ Production Supabase configured (spdtwktxdalcfigzeqrz)
✅ CRM schema created and isolated
✅ 8 CRM tables migrated
✅ Supabase client configured for schema isolation
✅ .env.local configured for production access
✅ Dev server running at http://localhost:5173/

**Next Step**: Configure Supabase Auth settings in dashboard (see Troubleshooting section)
