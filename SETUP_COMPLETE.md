# Atomic CRM Setup - READY FOR FIRST USER

## ✅ Current Status

**Environment**: Production Supabase + Local Dev Server
**Backend**: Fully initialized with migrations and edge functions
**Frontend**: Running at http://localhost:5173/

---

## 🎯 Next Step: Create First Admin User

### IMPORTANT: Use Fresh Email Alias

Due to an existing user in the shared Supabase project, use:

**Email**: `jgtolentino.rn+atomic@gmail.com`
**Password**: (your choice - min 6 characters)

### Steps:

1. Open http://localhost:5173/
2. Click "Sign Up" (or navigate to signup page)
3. Enter the email alias above
4. Create a password
5. Click "Create Account"

**Why the email alias?**
The email `jgtolentino.rn@gmail.com` already exists in `auth.users` from another app in the shared Supabase project. Using the `+atomic` alias allows you to:
- Receive emails at the same inbox
- Create a separate Atomic CRM account
- Avoid authentication conflicts

---

## 📋 What Was Configured

### 1. Environment Configuration

**File**: `.env.development.local` (git-ignored, overrides `.env.development`)

```bash
VITE_SUPABASE_URL=https://spdtwktxdalcfigzeqrz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_IS_DEMO=false
VITE_INBOUND_EMAIL=2aff30e603e54dc3eb556bd9e03ee099@inbound.postmarkapp.com
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgres://postgres.spdtwktxdalcfigzeqrz:SHWYXDMFAwXI1drT@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Environment File Priority** (Vite development mode):
```
.env.development.local  ← HIGHEST (current configuration)
.env.local
.env.development
.env
```

### 2. Backend Initialization

**Supabase Project**: `spdtwktxdalcfigzeqrz`

**Migrations Applied** (11 total):
- `20240730075029_init_db.sql` - Core database schema
- `20240730075425_init_triggers.sql` - User sync triggers
- `20240730075555_create_functions.sql` - Database functions
- `20240730081505_init_seed_data.sql` - Seed data
- `20241126025532_init_state.sql` - Init state tracking
- `20241210025532_init_state.sql` - Updated init state
- `20241214080453_readonly_user.sql` - Readonly user support
- `20241230111530_update_task_complete_status.sql` - Task status fix
- `20250102063238_attachment_url.sql` - Attachment URL handling
- `20250113103000_avatar_support.sql` - Avatar support
- `20250116165700_avatar_placeholder.sql` - Avatar placeholders

**Edge Functions Deployed** (4 total):
- `mergeContacts` - Contact merging logic
- `postmark` - Inbound email processing
- `updatePassword` - Password update handling
- `users` - User management (creation, updates)

**Database Tables Created** (in `public` schema):
- `companies` - Company records
- `contacts` - Contact records
- `contactNotes` - Notes on contacts
- `deals` - Deal pipeline records
- `dealNotes` - Notes on deals
- `sales` - Sales team members (synced with auth.users)
- `tags` - Tag records
- `tasks` - Task records

### 3. Configuration Files Updated

**`supabase/config.toml`**:
- Updated `major_version = 17` to match remote database

**`src/components/atomic-crm/providers/supabase/supabase.ts`**:
- Using standard `public` schema (default behavior)
- No schema override needed

---

## 🔧 Environment Switching Guide

### Switch to Local Supabase (Full Stack)

```bash
# Remove production override
rm .env.development.local

# Start local Supabase + Vite dev server
make start
```

**Access Local Services**:
- Frontend: http://localhost:5173/
- Supabase Dashboard: http://localhost:54323/
- REST API: http://127.0.0.1:54321
- Database: postgres://postgres:postgres@127.0.0.1:54322/postgres

### Switch Back to Production Supabase (Current)

```bash
# Ensure .env.development.local exists (already configured)
# Just restart dev server
npm run dev
```

---

## 📊 Database Schema Overview

**Atomic CRM Tables** (isolated in `public` schema):
- All CRM tables use standard Supabase conventions
- Row-Level Security (RLS) policies enforced
- Triggers sync `auth.users` ↔ `sales` table

**Finance PPM Tables** (also in `public` schema):
- Separate set of tables for Finance PPM app
- No naming conflicts with Atomic CRM

**Schema Isolation Note**:
Initially attempted to use `crm` schema for isolation, but reverted to standard `public` schema because:
- `npx supabase db push` creates tables in `public` by default
- Edge functions expect standard schema
- Atomic CRM is designed for `public` schema

---

## ⚠️ Troubleshooting

### Issue: "Invalid login credentials"
**Cause**: Existing user with same email in auth.users
**Solution**: Use email alias `jgtolentino.rn+atomic@gmail.com`

### Issue: App connects to 127.0.0.1:54321
**Cause**: `.env.development.local` doesn't exist or dev server not restarted
**Solution**:
```bash
# Verify file exists
cat .env.development.local | grep VITE_SUPABASE_URL
# Should show: https://spdtwktxdalcfigzeqrz.supabase.co

# Restart dev server
npm run dev
```

### Issue: Table not found errors
**Cause**: Migrations not applied to remote database
**Solution**:
```bash
# Check migration status
npx supabase migration list

# Repair migration history if tables already exist
npx supabase migration repair --status applied <migration_version>

# Or push migrations
npx supabase db push
```

### Issue: Edge function errors
**Cause**: Functions not deployed to production
**Solution**:
```bash
# Deploy all functions
npx supabase functions deploy
```

---

## 📚 Additional Resources

**Documentation**:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed environment configuration
- [QUICK_START.md](./QUICK_START.md) - Quick reference commands
- [AGENTS.md](./AGENTS.md) - Development workflows and architecture

**Official Docs**:
- [Atomic CRM Documentation](https://github.com/marmelab/atomic-crm/tree/main/doc)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## ✅ Ready to Go!

1. ✅ Production Supabase configured
2. ✅ Database migrations applied (11 total)
3. ✅ Edge functions deployed (4 total)
4. ✅ Environment variables set
5. ✅ Dev server running
6. ⏳ **Next**: Create first admin user at http://localhost:5173/

**Use email alias**: `jgtolentino.rn+atomic@gmail.com`
