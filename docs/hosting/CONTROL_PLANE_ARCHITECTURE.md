# Control Plane Architecture

## Overview

This document describes the "single control-plane" architecture for consolidating DNS, frontend deployments, and backend workloads while maintaining reliability and clean separation of concerns.

**Key principle:** You cannot realistically collapse DNS + website + email + Plane + Odoo + DB + auth into a single server without losing reliability. The right consolidation is **single DNS authority + single deployment surface**, not single compute box.

## Architecture Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DNS Authority (Cloudflare)                       │
│                                                                       │
│  www.domain.com  ──► CNAME ──► Vercel                                │
│  app.domain.com  ──► CNAME ──► Vercel                                │
│  plane.domain.com ──► A ────► DO droplet (68.183.179.64)             │
│  erp.domain.com   ──► A ────► DO droplet (178.128.112.214)           │
│  mg.insightpulseai.net ──► DO DNS (Mailgun records)                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    Vercel     │         │   DO Droplets   │         │  DO Managed DB  │
│               │         │                 │         │                 │
│ - Website     │         │ - Plane CE      │         │ - PostgreSQL 16 │
│ - Platform UI │         │ - Odoo ERP      │         │ - odoo-db-sgp1  │
│ - Edge Funcs  │         │ - n8n (future)  │         │ - 2GB/30GiB     │
└───────────────┘         └─────────────────┘         └─────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
                                    ▼
                        ┌─────────────────────┐
                        │   Supabase Cloud    │
                        │                     │
                        │ - Auth              │
                        │ - Storage           │
                        │ - Realtime          │
                        │ - Edge Functions    │
                        └─────────────────────┘
```

## Component Breakdown

### DNS Authority: Cloudflare (recommended)

- Single authoritative DNS for the `.com` domain
- Exception: `mg.insightpulseai.net` stays on DigitalOcean DNS for Mailgun

**DNS Records:**

| Subdomain | Type  | Target                  | Notes                        |
|-----------|-------|-------------------------|------------------------------|
| `@`       | CNAME | cname.vercel-dns.com    | Apex redirect                |
| `www`     | CNAME | cname.vercel-dns.com    | Main website                 |
| `app`     | CNAME | cname.vercel-dns.com    | Platform Kit UI              |
| `plane`   | A     | 68.183.179.64           | Plane CE (SGP1)              |
| `erp`     | A     | 178.128.112.214         | Odoo ERP (SGP1)              |

### Frontend: Vercel

- **Projects:** `www`, `app` (Platform Kit UI)
- **Framework:** Next.js
- **Node version:** 24.x
- **Build machine:** Standard (avoid Turbo unless proven necessary)

### Workloads: DigitalOcean Droplets

| Droplet        | IP              | Region | Purpose              |
|----------------|-----------------|--------|----------------------|
| plane-ce-prod  | 68.183.179.64   | SGP1   | Plane project mgmt   |
| odoo-erp-prod  | 178.128.112.214 | SGP1   | Odoo ERP             |

### Database: DigitalOcean Managed Postgres

- **Name:** odoo-db-sgp1
- **Region:** SGP1
- **Version:** PostgreSQL 16
- **Size:** 2GB RAM / 30GiB storage
- **Mode:** Primary only (no replica yet)

### Auth & Storage: Supabase

- **Auth:** Supabase Auth (SSO, magic links, OAuth)
- **Storage:** Supabase Storage (S3-compatible)
- **Realtime:** Supabase Realtime (WebSocket)

## Vercel Integration Security

### Permission Model

Vercel integrations have explicit permission scopes and are tied to the **installing user**. If that user loses access:

1. Integration becomes **disabled**
2. Auto-removed after **30 days**
3. Environment variables created by the integration are also removed

### Best Practices

1. **Use a dedicated bot owner for integrations**
   - Create `vercel-bot@yourdomain.com` with Owner role
   - Re-install critical integrations under that identity
   - Prevents surprise disablement when team members leave

2. **Prefer CLI-managed env vars**
   - Use `vercel env add` instead of integration-owned vars
   - Mirror secrets in repo SSOT (encrypted with SOPS/age)
   - Re-apply via CLI if integration vars disappear

3. **Audit integrations regularly**
   ```bash
   # List installed integrations
   vercel integrations ls
   ```

## Infrastructure as Code

### DNS (Terraform)

Location: `infra/dns/cloudflare/`

```bash
cd infra/dns/cloudflare

# Initialize
terraform init

# Plan changes
terraform plan

# Apply
terraform apply

# Rollback = re-apply last-known-good state
```

### Vercel (CLI Scripts)

Location: `scripts/vercel/`

| Script            | Purpose                              |
|-------------------|--------------------------------------|
| setup-domains.sh  | Add domains to Vercel project        |
| manage-env.sh     | Manage environment variables         |
| verify-dns.sh     | Verify DNS configuration             |

## Deployment Workflow

### Deploy to Production (Vercel)

```bash
# From repo root
vercel --prod
```

### Rollback (Vercel)

```bash
# List recent deployments
vercel ls

# Promote a specific deployment to production
vercel promote https://<deployment-url>
```

### DNS Changes (Terraform)

```bash
cd infra/dns/cloudflare
terraform plan    # Review changes
terraform apply   # Apply changes
```

## Verification Checklist

```bash
# Run DNS verification
./scripts/vercel/verify-dns.sh yourdomain.com

# Expected output:
# Checking www.domain.com (CNAME)... OK (cname.vercel-dns.com)
# Checking app.domain.com (CNAME)... OK (cname.vercel-dns.com)
# Checking plane.domain.com (A)... OK (68.183.179.64)
# Checking erp.domain.com (A)... OK (178.128.112.214)
```

## Migration Notes

### Current State (Pre-Migration)

- DNS: Mixed (Wix/Squarespace nameservers observed)
- Mailgun: `mg.insightpulseai.net` on DO DNS (working)

### Migration Steps

1. Export current DO DNS records (backup)
2. Create Cloudflare zone for `.com` domain
3. Apply Terraform DNS configuration
4. Update domain registrar nameservers to Cloudflare
5. Verify propagation (24-48 hours)
6. Configure Vercel domains

### Mailgun Exception

Keep `mg.insightpulseai.net` on DigitalOcean DNS. Required records:

- MX: `mxa.mailgun.org`, `mxb.mailgun.org`
- TXT (SPF): `v=spf1 include:mailgun.org ~all`
- TXT (DMARC): `v=DMARC1; p=none; pct=100; fo=1; ri=3600`
- TXT (DKIM): `pic._domainkey.mg.insightpulseai.net`

## References

- [Vercel Integration Permissions](https://vercel.com/docs/integrations/install-an-integration/manage-integrations-reference)
- [Cloudflare Terraform Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [DigitalOcean DNS Management](https://docs.digitalocean.com/products/networking/dns/)
