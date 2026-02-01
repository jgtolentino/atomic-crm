#!/usr/bin/env bash
# Vercel Environment Variable Management
# Prefer CLI-managed env vars over integration-owned vars for SSOT control
#
# Usage:
#   ./manage-env.sh list                     # List all env vars
#   ./manage-env.sh add <key> <env>          # Add var (prompts for value)
#   ./manage-env.sh pull                     # Pull env vars to .env.local

set -euo pipefail

ACTION="${1:-help}"

# Check vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "Error: vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

case "$ACTION" in
  list)
    echo "==> Listing environment variables..."
    vercel env ls
    ;;

  add)
    KEY="${2:-}"
    ENV="${3:-production}"

    if [[ -z "$KEY" ]]; then
      echo "Usage: $0 add <key> [environment]"
      echo "Environments: development, preview, production (default: production)"
      exit 1
    fi

    echo "==> Adding environment variable: $KEY to $ENV"
    echo "Enter the value (will be hidden):"
    read -rs VALUE

    printf "%s" "$VALUE" | vercel env add "$KEY" "$ENV"
    echo "==> Done: $KEY added to $ENV"
    ;;

  pull)
    echo "==> Pulling environment variables to .env.local..."
    vercel env pull .env.local
    echo "==> Done: Environment variables saved to .env.local"
    echo "WARNING: Do not commit .env.local to version control!"
    ;;

  help|*)
    echo "Vercel Environment Variable Manager"
    echo ""
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  list              List all environment variables"
    echo "  add <key> [env]   Add a new environment variable"
    echo "  pull              Pull env vars to .env.local"
    echo ""
    echo "Best Practices:"
    echo "  - Use CLI-managed env vars over integration-owned vars"
    echo "  - Keep SSOT in encrypted repo secrets (e.g., SOPS, age)"
    echo "  - Integration-owned vars can disappear if owner loses access"
    ;;
esac
