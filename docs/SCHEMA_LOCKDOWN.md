# Schema Lockdown - Production Safety Guardrails

**Status**: 🔒 **LOCKED TO `crm` SCHEMA**

This document explains the guardrails in place to prevent schema routing regressions.

---

## ✅ Current Configuration (LOCKED)

```bash
Primary Schema: crm
Fallback: public (alias views for backward compatibility)
Environment Variable: VITE_SUPABASE_SCHEMA=crm
```

**DO NOT CHANGE THIS CONFIGURATION WITHOUT EXPLICIT APPROVAL**

---

## 🛡️ Protection Mechanisms

### 1. Build-Time Healthcheck

**Location**: `scripts/healthcheck-schema.sh`

**Runs**: Automatically before every build

**Checks**:
- ✅ `VITE_SUPABASE_SCHEMA` is set to `crm`
- ✅ API routing to `crm` schema works
- ✅ All essential views exist (`contacts_summary`, `companies_summary`, `deals_summary`, `tasks_summary`)
- ✅ Public schema fallback works (non-critical, safety net)

**Failure Behavior**: Build **stops immediately** if any check fails

**Manual Run**:
```bash
npm run healthcheck
```

### 2. CI/CD Pipeline Check

**Location**: `.github/workflows/schema-healthcheck.yml`

**Triggers**:
- Every push to `main`/`master`
- Every pull request
- Manual workflow dispatch

**Validates**:
- Schema configuration
- API connectivity
- View accessibility

**Result**: PR cannot merge if healthcheck fails

### 3. Vercel Environment Lock

**Required for ALL environments:**

```bash
# Production
vercel env add VITE_SUPABASE_SCHEMA production <<< "crm"

# Preview
vercel env add VITE_SUPABASE_SCHEMA preview <<< "crm"

# Development
vercel env add VITE_SUPABASE_SCHEMA development <<< "crm"
```

**Status Check**:
```bash
vercel env ls | grep VITE_SUPABASE_SCHEMA
```

Should show:
```
VITE_SUPABASE_SCHEMA  Encrypted  Development, Preview, Production
```

---

## 🚨 What Happens if Schema Regresses to `public`

### Immediate Failures:
1. ❌ Build pipeline fails at healthcheck step
2. ❌ CI/CD workflow fails
3. ❌ Users see "relation does not exist" errors
4. ❌ All CRM features break (contacts, deals, tasks, notes)

### User Impact:
- **Severity**: 🔴 **CRITICAL - Total System Failure**
- **Scope**: All users
- **Features Affected**: All 6 essential features
- **Recovery Time**: ~5 minutes (revert + redeploy)

---

## 📋 Safe Schema Migration Procedure

**IF** you ever need to change schemas (NOT RECOMMENDED):

### Prerequisites:
1. Full database backup
2. Staging environment test
3. Rollback plan
4. User notification

### Steps:
1. Create new schema views/tables
2. Update `VITE_SUPABASE_SCHEMA` environment variable
3. Update `scripts/healthcheck-schema.sh` expected schema
4. Test on staging
5. Deploy to production with monitoring
6. Keep old schema active for 7 days (rollback window)

### Rollback:
```bash
# Revert environment variable
vercel env rm VITE_SUPABASE_SCHEMA production
vercel env add VITE_SUPABASE_SCHEMA production <<< "crm"

# Redeploy
vercel --prod --yes
```

---

## 🔒 Schema Architecture

### Primary: `crm` Schema

**Tables**:
- `crm.contacts`
- `crm.companies`
- `crm.tasks`
- `crm.deals`
- `crm.contactNotes`
- `crm.dealNotes`
- `crm.sales`
- `crm.tags`

**Views** (Summary with aggregations):
- `crm.contacts_summary` - Contact data + task counts
- `crm.companies_summary` - Company data + deal/contact counts
- `crm.deals_summary` - Deal data + notes count
- `crm.tasks_summary` - Task data + contact/company info
- `crm.contactNotes_summary` - Contact notes + relationships
- `crm.dealNotes_summary` - Deal notes + relationships

### Fallback: `public` Schema (Safety Net)

**Alias Views** (point to `crm` schema):
```sql
public.contacts_summary → crm.contacts_summary
public.companies_summary → crm.companies_summary
public.deals_summary → crm.deals_summary
public.tasks_summary → crm.tasks_summary
public.contactNotes_summary → crm.contactNotes_summary
public.dealNotes_summary → crm.dealNotes_summary
```

**Purpose**: Backward compatibility for:
- Legacy API clients
- Old mobile apps
- Third-party integrations
- Emergency fallback

---

## 🚫 Prohibited Actions

### ❌ NEVER Do This:

1. **Change `VITE_SUPABASE_SCHEMA` to `public`**
   - Reason: Breaks all features, no views in `public` schema
   - Impact: Total system failure

2. **Remove `crm` schema views**
   - Reason: API routing breaks immediately
   - Impact: All features non-functional

3. **Deploy without healthcheck**
   - Reason: No validation of schema configuration
   - Impact: Silent failures in production

4. **Skip Vercel environment variables**
   - Reason: Build uses wrong schema
   - Impact: Deployed app uses incorrect database objects

5. **Clone Plane.so into same Supabase project**
   - Reason: Schema conflicts, auth table collisions, migration hell
   - Impact: Both systems break, impossible to untangle
   - Alternative: Separate Plane deployment + SSO/webhook integration

---

## ✅ Verification Commands

### Local Development:
```bash
# Check environment variable
grep VITE_SUPABASE_SCHEMA .env.vercel

# Run healthcheck
npm run healthcheck

# Test API routing
curl -H "Accept-Profile: crm" \
  "$SUPABASE_URL/rest/v1/contacts_summary?select=id&limit=1"
```

### Production:
```bash
# Check Vercel environment
vercel env ls | grep VITE_SUPABASE_SCHEMA

# Test deployed app
curl -H "Accept-Profile: crm" \
  "https://atomic-crm-pink.vercel.app/api/contacts" # (if API route exists)
```

### Database:
```sql
-- Verify schema objects exist
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'crm';

-- Verify views exist
SELECT schemaname, viewname
FROM pg_views
WHERE schemaname IN ('crm', 'public')
  AND viewname LIKE '%summary';
```

---

## 📊 Monitoring

### Key Metrics:
- **Schema healthcheck pass rate**: Target 100%
- **API 404 errors**: Target 0% (indicates schema issues)
- **Build failures due to healthcheck**: Investigate immediately

### Alerts:
- 🚨 Healthcheck fails in CI → Slack/email notification
- 🚨 Production API errors → PagerDuty alert
- ⚠️ Schema environment variable missing → Build blocks

---

## 🆘 Emergency Procedures

### Schema Routing Broken:

1. **Immediate**: Revert to last known good deployment
   ```bash
   vercel rollback --prod
   ```

2. **Verify**: Check environment variables
   ```bash
   vercel env ls
   ```

3. **Fix**: Re-add correct schema
   ```bash
   vercel env rm VITE_SUPABASE_SCHEMA production
   vercel env add VITE_SUPABASE_SCHEMA production <<< "crm"
   ```

4. **Redeploy**:
   ```bash
   vercel --prod --yes
   ```

5. **Validate**: Run healthcheck
   ```bash
   npm run healthcheck
   ```

### View Missing:

```sql
-- Recreate crm schema views (example)
CREATE OR REPLACE VIEW crm.contacts_summary AS
SELECT /* ... existing view definition ... */;

-- Recreate public alias (safety net)
CREATE OR REPLACE VIEW public.contacts_summary AS
SELECT * FROM crm.contacts_summary;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
```

---

## 📚 Related Documentation

- `TASK_REMINDERS_SETUP.md` - Task reminder feature setup
- `AGENTS.md` - Architecture and development patterns
- `CLAUDE.md` - Project-specific orchestration rules

---

## 🔐 Change Control

**Last Schema Change**: 2026-01-03
**Current Schema**: `crm`
**Lock Status**: 🔒 ACTIVE
**Approved By**: Production deployment validation
**Next Review**: As needed (no scheduled change)

---

**Remember**: Schema changes are CRITICAL. Always test in staging first. Always have a rollback plan. Always run healthchecks before deployment.
