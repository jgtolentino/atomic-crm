#!/usr/bin/env bash
# Vercel Domain Setup Script
# Usage: ./setup-domains.sh <domain>
# Example: ./setup-domains.sh insightpulseai.com

set -euo pipefail

DOMAIN="${1:-}"

if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <domain>"
  echo "Example: $0 insightpulseai.com"
  exit 1
fi

echo "==> Setting up Vercel domains for: $DOMAIN"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "Error: vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
  echo "Error: Not logged in to Vercel. Run: vercel login"
  exit 1
fi

echo "==> Adding domains to Vercel project..."

# Add apex domain
echo "Adding $DOMAIN..."
vercel domains add "$DOMAIN" || echo "Domain may already exist"

# Add www subdomain
echo "Adding www.$DOMAIN..."
vercel domains add "www.$DOMAIN" || echo "Domain may already exist"

# Add app subdomain (Platform Kit UI)
echo "Adding app.$DOMAIN..."
vercel domains add "app.$DOMAIN" || echo "Domain may already exist"

echo ""
echo "==> Domain setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure DNS records pointing to Vercel:"
echo "   - $DOMAIN       -> CNAME cname.vercel-dns.com"
echo "   - www.$DOMAIN   -> CNAME cname.vercel-dns.com"
echo "   - app.$DOMAIN   -> CNAME cname.vercel-dns.com"
echo ""
echo "2. Verify domains in Vercel dashboard or run:"
echo "   vercel domains ls"
