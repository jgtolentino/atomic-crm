# Atomic CRM Quick Start

## Current Configuration ✅

You are currently running in **PRODUCTION MODE** (connecting to production Supabase).

### What's Running

- **Frontend**: http://localhost:5173/
- **Backend**: https://spdtwktxdalcfigzeqrz.supabase.co (production)
- **Schema**: `crm` (isolated from Finance PPM)

---

## Environment Switching

### Switch to Local Development
```bash
rm .env.development.local
make start
```

### Switch to Production (Current)
```bash
# Already configured - .env.development.local exists with production credentials
npm run dev
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server (uses .env.local if exists)
make start              # Start full local stack (Supabase + Vite)
make stop               # Stop local Supabase

# Testing
npm test                # Run unit tests
npm run typecheck       # TypeScript validation
npm run lint            # Code quality checks

# Building
npm run build           # Production build

# Database
npx supabase migration new <name>   # Create migration
npx supabase migration up            # Apply migrations
```

---

## Next Steps

1. **Configure Supabase Auth** (required for account creation):
   - Go to: https://supabase.com/dashboard/project/spdtwktxdalcfigzeqrz
   - Navigate to: **Authentication** → **Providers** → **Email**
   - Set **Enable email confirmations** to **OFF** (for development)

2. **Try Creating an Account**:
   - Open: http://localhost:5173/
   - Click "Sign Up"
   - Fill in email and password
   - Should create account in production Supabase `crm` schema

3. **Import Sample Data** (optional):
   - Login to CRM
   - Navigate to Contacts
   - Click "Import" button
   - Upload `test-data/contacts.csv`

---

## File Structure

```
.env.development        ← Local Supabase config (committed)
.env.local             ← Production override (git-ignored) ← YOU ARE HERE
.env.production        ← Production build config

supabase/
  migrations/          ← Database migrations (applied to 'crm' schema)

src/
  components/
    atomic-crm/        ← Main CRM application
    ui/                ← Shadcn UI components
```

---

## Troubleshooting

**Issue**: Can't create account
- **Fix**: Disable email confirmation in Supabase dashboard (see Next Steps #1)

**Issue**: App connects to local Supabase (127.0.0.1)
- **Fix**: Ensure `.env.local` exists with production URL

**Issue**: Database table not found
- **Fix**: Migrations applied to `crm` schema, check Supabase client config

---

**Documentation**: See `DEPLOYMENT_GUIDE.md` for detailed setup instructions
