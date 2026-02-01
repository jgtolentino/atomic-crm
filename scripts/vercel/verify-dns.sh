#!/usr/bin/env bash
# DNS Verification Script
# Verifies that DNS records are correctly configured for the control plane
#
# Usage: ./verify-dns.sh <domain>

set -euo pipefail

DOMAIN="${1:-}"

if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <domain>"
  echo "Example: $0 insightpulseai.com"
  exit 1
fi

echo "==> Verifying DNS configuration for: $DOMAIN"
echo ""

# Check if dig is available
if ! command -v dig &> /dev/null; then
  echo "Error: dig command not found. Install dnsutils/bind-utils."
  exit 1
fi

check_record() {
  local name="$1"
  local type="$2"
  local expected="$3"

  echo -n "Checking $name.$DOMAIN ($type)... "

  result=$(dig +short "$name.$DOMAIN" "$type" 2>/dev/null | head -1)

  if [[ -z "$result" ]]; then
    echo "NOT FOUND"
    return 1
  elif [[ "$result" == *"$expected"* ]]; then
    echo "OK ($result)"
    return 0
  else
    echo "MISMATCH (got: $result, expected: *$expected*)"
    return 1
  fi
}

ERRORS=0

# Vercel CNAMEs
echo "--- Vercel Frontend ---"
check_record "www" "CNAME" "vercel" || ((ERRORS++))
check_record "app" "CNAME" "vercel" || ((ERRORS++))

echo ""
echo "--- DigitalOcean Droplets ---"
check_record "plane" "A" "68.183.179.64" || ((ERRORS++))
check_record "erp" "A" "178.128.112.214" || ((ERRORS++))

echo ""
echo "--- HTTPS Reachability ---"

check_https() {
  local url="$1"
  echo -n "Checking $url... "

  status=$(curl -sI -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null || echo "FAIL")

  if [[ "$status" =~ ^(200|301|302|307|308)$ ]]; then
    echo "OK (HTTP $status)"
    return 0
  else
    echo "FAILED (HTTP $status)"
    return 1
  fi
}

check_https "https://www.$DOMAIN" || ((ERRORS++))
check_https "https://app.$DOMAIN" || ((ERRORS++))
check_https "https://plane.$DOMAIN" || ((ERRORS++))
check_https "https://erp.$DOMAIN" || ((ERRORS++))

echo ""
if [[ $ERRORS -eq 0 ]]; then
  echo "==> All checks passed!"
  exit 0
else
  echo "==> $ERRORS check(s) failed"
  exit 1
fi
