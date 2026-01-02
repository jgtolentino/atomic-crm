#!/bin/bash
# Schema healthcheck - fails fast if crm schema routing is broken
# Usage: ./scripts/healthcheck-schema.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get environment variables
if [ -f .env.vercel ]; then
  export $(grep -v '^#' .env.vercel | xargs)
elif [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Required env vars
REQUIRED_VARS=(
  "VITE_SUPABASE_ANON_KEY"
  "VITE_SUPABASE_SCHEMA"
)

# Check required env vars
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}✗ Missing required environment variable: $var${NC}"
    exit 1
  fi
done

# Verify VITE_SUPABASE_SCHEMA is set to 'crm'
if [ "$VITE_SUPABASE_SCHEMA" != "crm" ]; then
  echo -e "${RED}✗ CRITICAL: VITE_SUPABASE_SCHEMA is not 'crm' (found: '$VITE_SUPABASE_SCHEMA')${NC}"
  echo -e "${RED}  This will cause schema routing failures!${NC}"
  exit 1
fi

# Determine Supabase URL (correct project: spdtwktxdalcfigzeqrz)
SUPABASE_URL="https://spdtwktxdalcfigzeqrz.supabase.co"

# Use NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback
if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    VITE_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
  elif [ -n "$SUPABASE_ANON_KEY" ]; then
    VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
  fi
fi

echo -e "${YELLOW}🔍 Running schema healthcheck...${NC}"
echo ""
echo "  Schema: $VITE_SUPABASE_SCHEMA"
echo "  URL: $SUPABASE_URL"
echo ""

# Test 1: Verify crm schema routing works
echo -e "${YELLOW}[1/3] Testing crm schema routing...${NC}"
RESPONSE=$(curl -fsS \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Accept-Profile: crm" \
  "$SUPABASE_URL/rest/v1/contacts_summary?select=id&limit=1" 2>&1) || {
  echo -e "${RED}✗ crm schema routing FAILED${NC}"
  echo -e "${RED}  Response: $RESPONSE${NC}"
  exit 1
}

if [[ "$RESPONSE" == "[]" ]] || [[ "$RESPONSE" == "["* ]]; then
  echo -e "${GREEN}✓ crm schema routing works${NC}"
else
  echo -e "${RED}✗ Unexpected response: $RESPONSE${NC}"
  exit 1
fi

# Test 2: Verify essential views exist
echo -e "${YELLOW}[2/3] Testing essential views...${NC}"
VIEWS=("contacts_summary" "companies_summary" "deals_summary" "tasks_summary")

for view in "${VIEWS[@]}"; do
  RESPONSE=$(curl -fsS \
    -H "apikey: $VITE_SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
    -H "Accept-Profile: crm" \
    "$SUPABASE_URL/rest/v1/${view}?select=id&limit=0" 2>&1) || {
    echo -e "${RED}✗ View '$view' not accessible${NC}"
    exit 1
  }
  echo -e "${GREEN}  ✓ crm.${view}${NC}"
done

# Test 3: Verify public alias fallback exists (safety net)
echo -e "${YELLOW}[3/3] Testing public schema fallback...${NC}"
RESPONSE=$(curl -fsS \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Accept-Profile: public" \
  "$SUPABASE_URL/rest/v1/contacts_summary?select=id&limit=1" 2>&1) || {
  echo -e "${YELLOW}⚠ public schema fallback not available (non-critical)${NC}"
  # Don't exit - this is just a safety net
}

if [[ "$RESPONSE" == "[]" ]] || [[ "$RESPONSE" == "["* ]]; then
  echo -e "${GREEN}  ✓ public schema fallback works${NC}"
fi

echo ""
echo -e "${GREEN}✓ All schema healthchecks passed${NC}"
echo ""
exit 0
