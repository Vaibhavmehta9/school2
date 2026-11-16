#!/usr/bin/env bash
# ==============================================================================
# Sherwood College Portal - Demo Tunnel Startup Script (Bash / macOS / Linux)
# ==============================================================================
set -euo pipefail

echo -e "\033[0;36m=========================================================="
echo -e "   Sherwood College Admission Portal - Demo Tunnel Setup   "
echo -e "==========================================================\033[0m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORTAL_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PORTAL_ROOT/backend"
ENV_DEMO_PATH="$PORTAL_ROOT/.env.demo"

TUNNEL_URL="${1:-}"
CHAT_STREAMING="${2:-true}"

if [[ -z "$TUNNEL_URL" && -f "$ENV_DEMO_PATH" ]]; then
    TUNNEL_URL="$(grep -E '^VITE_SITE_URL=' "$ENV_DEMO_PATH" | cut -d '=' -f2- | tr -d ' ' || true)"
fi

if [[ -z "$TUNNEL_URL" ]]; then
    read -rp "Enter your public HTTPS tunnel URL (e.g. https://sherwood-demo.ngrok-free.app): " TUNNEL_URL
fi

TUNNEL_URL="${TUNNEL_URL%/}"

echo -e "\n\033[0;32m[+] Configured Tunnel URL: $TUNNEL_URL\033[0m"
echo -e "\033[0;32m[+] Chat Streaming:        $CHAT_STREAMING\033[0m"

# Database copy
PROD_DB="$BACKEND_DIR/sheerwood.db"
DEMO_DB="$BACKEND_DIR/sheerwood.demo.db"
BACKUP_DB="$BACKEND_DIR/sheerwood.db.demo_backup"

if [[ ! -f "$DEMO_DB" ]]; then
    echo -e "\n\033[0;33m[+] Creating isolated demo database (sheerwood.demo.db)...\033[0m"
    if [[ -f "$PROD_DB" ]]; then
        cp "$PROD_DB" "$BACKUP_DB"
        cp "$PROD_DB" "$DEMO_DB"
        echo "    Backup saved to: backend/sheerwood.db.demo_backup"
        echo "    Demo DB created: backend/sheerwood.demo.db"
    fi
fi

# Frontend build
export VITE_SITE_URL="$TUNNEL_URL"
export VITE_COGNITO_REDIRECT_URI="$TUNNEL_URL/"
export VITE_COGNITO_LOGOUT_URI="$TUNNEL_URL/signed-out"
export VITE_CHAT_STREAMING="$CHAT_STREAMING"
export VITE_REVIEW_MODE="false"

cd "$PORTAL_ROOT"
echo -e "\n\033[0;33m[+] Building production frontend bundle (npm run build)...\033[0m"
npm run build

echo -e "\n\033[0;36m=========================================================="
echo -e "              DEMO START INSTRUCTIONS                     "
echo -e "==========================================================\033[0m"

echo -e "\n\033[0;33mStep 1: Start Backend (FastAPI with real IP forwarding):\033[0m"
echo "--------------------------------------------------------"
echo "cd backend"
echo "DEMO_MODE=true DATABASE_PATH=sheerwood.demo.db ALLOWED_ORIGINS=\"$TUNNEL_URL,http://localhost:4173,http://127.0.0.1:4173\" \\"
echo "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --proxy-headers --forwarded-allow-ips \"127.0.0.1\""

echo -e "\n\033[0;33mStep 2: Start Frontend Preview (Single Origin with /api proxy):\033[0m"
echo "---------------------------------------------------------------"
echo "cd $PORTAL_ROOT"
echo "npm run preview -- --port 4173 --host 127.0.0.1"

echo -e "\n\033[0;33mStep 3: Launch Tunnel (Expose port 4173 only):\033[0m"
echo "----------------------------------------------"
DOMAIN_PART="${TUNNEL_URL#https://}"
echo "# Option A (Recommended: ngrok with SSE streaming support & basic auth):"
echo "ngrok http 4173 --domain=\"$DOMAIN_PART\" --basic-auth=\"sherwood:Admission2027\""
echo ""
echo "# Option B (Cloudflare Tunnel alternative):"
echo "cloudflared tunnel --url http://127.0.0.1:4173"

echo -e "\n\033[0;33mCognito App Client Allowed URLs in AWS Console:\033[0m"
echo "  Allowed Callback URL: $TUNNEL_URL/"
echo "  Allowed Sign-out URL: $TUNNEL_URL/signed-out"
echo -e "\033[0;36m==========================================================\n\033[0m"

