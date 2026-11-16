# Sherwood College Admission Portal - Temporary Public Demo Guide

This guide describes how to share the Sherwood College Admission Portal with external users, stakeholders, and reviewers over a secure, temporary HTTPS tunnel using **ngrok** or **Cloudflare Tunnel**.

---

## Architecture: Single Origin (`1 Tunnel : 1 Port`)

```
+-------------------------------------------------------------+
| External Reviewer / Mobile Browser (Anywhere on Internet)   |
+-------------------------------------------------------------+
                             |
                   HTTPS (e.g. ngrok / Cloudflare)
                             v
+-------------------------------------------------------------+
| Port 4173: Vite Preview Server (serving production dist/)   |
|   - Serves static assets, HTML, PWA manifest, favicons      |
|   - Reverse proxies relative `/api/*` to 127.0.0.1:8000     |
+-------------------------------------------------------------+
                             |
                  Internal Local Loopback
                             v
+-------------------------------------------------------------+
| Port 8000: FastAPI Backend (Bound strictly to 127.0.0.1)    |
|   - DEMO_MODE: /docs, /redoc, /openapi.json disabled        |
|   - Database: Isolated copy (`backend/sheerwood.demo.db`)   |
|   - Rate Limiting: 20 req / 5 min per real client IP        |
+-------------------------------------------------------------+
```

### Why this design?
1. **Zero CORS Friction**: The browser only communicates with one origin (the tunnel URL). All API calls (`/api/...`) and Server-Sent Events (`/api/ai/chat/stream`) are same-origin.
2. **Production Hardening**: No Hot-Module Reloading (HMR) WebSockets, development error overlays, or source maps are exposed to reviewers.
3. **Review Mode Tree-Shaked**: Development persona switchers and review bypasses are fully stripped by Rollup during `npm run build`.

---

## Tunnel Comparison & Recommendation

| Feature | ngrok (Recommended) | Cloudflare Quick Tunnel (`trycloudflare.com`) |
| :--- | :--- | :--- |
| **SSE Chat Streaming** | **Native Support** (full real-time streaming) | **Buffered by default** (chat may pause or hang unless non-streaming fallback is used) |
| **Static Domain** | **1 Free Static Domain** (e.g. `*.ngrok-free.app`) | Ephemeral random subdomain on every run |
| **Cognito Setup** | One-time setup (fixed domain does not change) | Must re-add new URL in AWS Cognito on every run |
| **Access Protection** | Built-in HTTP Basic Auth (`--basic-auth`) | Cloudflare Access / OTP requires named tunnel |
| **Free Plan Limits** | 1 tunnel, 1 GB/mo bandwidth, 20k req/mo | 200 in-flight requests |

> **Recommendation**: Use **ngrok** with a free static domain. If using Cloudflare Quick Tunnel, set `VITE_CHAT_STREAMING=false` during build so the assistant falls back cleanly to synchronous POST `/api/ai/chat`.

---

## 1. Prerequisites

### Install Tunnel Tool on Your Machine (Windows)

#### Option A: ngrok (Recommended)
1. Sign up for a free account at [dashboard.ngrok.com](https://dashboard.ngrok.com/signup).
2. Grab your free static domain from the **Cloud Edge > Domains** tab (e.g., `sherwood-demo.ngrok-free.app`).
3. Install via winget or Chocolatey:
   ```powershell
   winget install ngrok.ngrok
   ```
4. Authenticate:
   ```powershell
   ngrok config add-authtoken <YOUR_NGROK_AUTHTOKEN>
   ```

#### Option B: Cloudflare Tunnel (`cloudflared`)
```powershell
winget install Cloudflare.cloudflared
```

---

## 2. One-Time Setup: AWS Cognito Allowed URLs

In the [AWS Cognito Console](https://console.aws.amazon.com/cognito):
1. Navigate to your **User Pool** > **App Integration** > **App client**.
2. Under **Hosted UI**, click **Edit**.
3. Add the following to **Allowed callback URLs**:
   - `https://<YOUR-TUNNEL-DOMAIN>/`
   - `https://<YOUR-TUNNEL-DOMAIN>/callback`
   - `https://<YOUR-TUNNEL-DOMAIN>/cognito-entry`
4. Add the following to **Allowed sign-out URLs**:
   - `https://<YOUR-TUNNEL-DOMAIN>/`
   - `https://<YOUR-TUNNEL-DOMAIN>/signed-out`
5. Save changes.

*(Keep your existing `http://localhost:5173/` URLs intact so local development continues to work).*

---

## 3. Step-by-Step Startup

### Automated Start (PowerShell)

From `sheerwood-admission-portal`:
```powershell
.\scripts\demo-start.ps1 -TunnelUrl "https://<YOUR-TUNNEL-DOMAIN>"
```

### Manual Start (In 3 Separate Terminal Windows)

#### Terminal 1: Backend (FastAPI with Proxy Headers & Demo Isolation)

```powershell
cd sheerwood-admission-portal\backend

# Ensure isolated database copy exists
if (-not (Test-Path sheerwood.demo.db)) {
    Copy-Item sheerwood.db sheerwood.demo.db
}

# Set demo environment variables
$env:DEMO_MODE = "true"
$env:DATABASE_PATH = "sheerwood.demo.db"
$env:ALLOWED_ORIGINS = "https://<YOUR-TUNNEL-DOMAIN>,http://localhost:4173,http://127.0.0.1:4173"
$env:AI_RATE_LIMIT_REQUESTS = "20"
$env:AI_RATE_LIMIT_WINDOW_SECONDS = "300"

# Start uvicorn strictly bound to 127.0.0.1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --proxy-headers --forwarded-allow-ips "127.0.0.1"
```

*Bash equivalent:*
```bash
cd sheerwood-admission-portal/backend
[[ -f sheerwood.demo.db ]] || cp sheerwood.db sheerwood.demo.db
export DEMO_MODE=true
export DATABASE_PATH=sheerwood.demo.db
export ALLOWED_ORIGINS="https://<YOUR-TUNNEL-DOMAIN>,http://localhost:4173,http://127.0.0.1:4173"
export AI_RATE_LIMIT_REQUESTS=20
export AI_RATE_LIMIT_WINDOW_SECONDS=300
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --proxy-headers --forwarded-allow-ips "127.0.0.1"
```

#### Terminal 2: Production Build & Local Preview Server

```powershell
cd sheerwood-admission-portal

# Configure environment for production bundle
$env:VITE_SITE_URL = "https://<YOUR-TUNNEL-DOMAIN>"
$env:VITE_COGNITO_REDIRECT_URI = "https://<YOUR-TUNNEL-DOMAIN>/"
$env:VITE_COGNITO_LOGOUT_URI = "https://<YOUR-TUNNEL-DOMAIN>/signed-out"
$env:VITE_CHAT_STREAMING = "true"  # Set "false" if using Cloudflare Quick Tunnel
$env:VITE_REVIEW_MODE = "false"

# Build production bundle
npm run build

# Start preview proxy server on port 4173
npm run preview -- --port 4173 --host 127.0.0.1
```

*Bash equivalent:*
```bash
cd sheerwood-admission-portal
export VITE_SITE_URL="https://<YOUR-TUNNEL-DOMAIN>"
export VITE_COGNITO_REDIRECT_URI="https://<YOUR-TUNNEL-DOMAIN>/"
export VITE_COGNITO_LOGOUT_URI="https://<YOUR-TUNNEL-DOMAIN>/signed-out"
export VITE_CHAT_STREAMING="true"
export VITE_REVIEW_MODE="false"
npm run build
npm run preview -- --port 4173 --host 127.0.0.1
```

#### Terminal 3: Public Tunnel with Access Protection

**Option A: ngrok (Recommended)**
```powershell
# Includes HTTP Basic Auth password protection so only invited reviewers can access
ngrok http 4173 --domain=<YOUR-STATIC-DOMAIN> --basic-auth="sherwood:Admission2027"
```

**Option B: Cloudflare Quick Tunnel**
```powershell
cloudflared tunnel --url http://127.0.0.1:4173
```

---

## 4. Demo Safety Checklist

- [x] **Review Mode Stripped**: `VITE_REVIEW_MODE=false` causes Rollup to tree-shake `ReviewPersonaPicker` out of the client bundle.
- [x] **Database Isolation**: The server runs against `backend/sheerwood.demo.db`. Real student/parent records in `sheerwood.db` are untouched.
- [x] **API Docs Protected**: FastAPI `/docs`, `/redoc`, and `/openapi.json` return 404 when `DEMO_MODE=true`.
- [x] **Real IP Forwarding**: Uvicorn runs with `--proxy-headers --forwarded-allow-ips "127.0.0.1"` so rate limits apply per external visitor IP.
- [x] **AI Quota Guard**: Chat requests are rate limited to 20 requests per 5 minutes per IP (`AI_RATE_LIMIT_REQUESTS=20`).
- [x] **Access Protection**: ngrok `--basic-auth` protects the demo from automated web scrapers.
- [x] **Payment Gateway**: Easebuzz runs in `test` environment only.

---

## 5. Mobile Data & Media Optimization Notes

The portal features rich visual assets on the homepage:
- **Hero Video**: ~10.4 MB (`public/videos/hero-drone.mp4`)
- **Campus Gallery Images**: 2 - 3 MB each (`public/images/`)

### Performance Guidance for Reviewers on 4G/5G
1. **Poster Images**: Video tag includes a lightweight poster image (`poster="/images/hero-poster.jpg"`) to ensure immediate paint before video stream buffers.
2. **Video Preload**: Video has `preload="metadata"` to prevent forcing a full 10 MB download on cellular devices until playback triggers.
3. **Estimated First-Load Time**:
   - 5G / Broadband: ~1.2s - 2.5s
   - 4G LTE: ~3.5s - 6.0s
   - Static assets are aggressively cached with `Cache-Control` headers by Vite preview.

---

## 6. Teardown & Clean-up Checklist

When the demonstration is completed:
1. **Stop Tunnel & Servers**:
   - In Terminal 3: Press `Ctrl+C` to close the ngrok/cloudflared tunnel.
   - In Terminal 2: Press `Ctrl+C` to stop Vite preview.
   - In Terminal 1: Press `Ctrl+C` to stop the Uvicorn backend.
2. **Revert Cognito App Client**:
   - Remove `https://<YOUR-TUNNEL-DOMAIN>/` and `https://<YOUR-TUNNEL-DOMAIN>/signed-out` from the Cognito Allowed URLs in AWS Console.
3. **Clean Up Demo Database**:
   ```powershell
   Remove-Item backend\sheerwood.demo.db -Force
   # Original backup remains available in backend\sheerwood.db.demo_backup
   ```
4. **Clean Up Environment Variables / Files**:
   - Delete any temporary `.env.demo` or `.env.local` files containing demo tunnel hosts.

