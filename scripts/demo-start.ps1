# ==============================================================================
# Sherwood College Portal - Demo Tunnel Startup Script (PowerShell)
# ==============================================================================
# Usage:
#   .\scripts\demo-start.ps1 -TunnelUrl "https://sherwood-demo.ngrok-free.app"
# Or run without parameters to read from .env.demo or prompt interactively.
# ==============================================================================

param (
    [string]$TunnelUrl = "",
    [string]$ChatStreaming = "true",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Sherwood College Admission Portal - Demo Tunnel Setup   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$PortalRoot = (Resolve-Path "$PSScriptRoot\..").Path
$BackendDir = Join-Path $PortalRoot "backend"
$EnvDemoPath = Join-Path $PortalRoot ".env.demo"

# 1. Resolve Tunnel URL
if ([string]::IsNullOrWhiteSpace($TunnelUrl)) {
    if (Test-Path $EnvDemoPath) {
        Get-Content $EnvDemoPath | ForEach-Object {
            $line = $_.Trim()
            if ($line -match "^VITE_SITE_URL=(.+)$") {
                $TunnelUrl = $matches[1].Trim()
            }
        }
    }
}

if ([string]::IsNullOrWhiteSpace($TunnelUrl)) {
    $TunnelUrl = Read-Host "Enter your public HTTPS tunnel URL (e.g., https://sherwood-demo.ngrok-free.app)"
}

$TunnelUrl = $TunnelUrl.TrimEnd('/')
if (-not $TunnelUrl.StartsWith("https://")) {
    Write-Warning "Tunnel URL should use HTTPS for secure Cognito redirects and cookies. Given: $TunnelUrl"
}

Write-Host "`n[+] Configured Tunnel URL: $TunnelUrl" -ForegroundColor Green
Write-Host "[+] Chat Streaming:        $ChatStreaming" -ForegroundColor Green

# 2. Database Isolation
$ProdDb = Join-Path $BackendDir "sheerwood.db"
$DemoDb = Join-Path $BackendDir "sheerwood.demo.db"
$BackupDb = Join-Path $BackendDir "sheerwood.db.demo_backup"

if (-not (Test-Path $DemoDb)) {
    Write-Host "`n[+] Creating isolated demo database (sheerwood.demo.db)..." -ForegroundColor Yellow
    if (Test-Path $ProdDb) {
        Copy-Item -Path $ProdDb -Destination $BackupDb -Force
        Copy-Item -Path $ProdDb -Destination $DemoDb -Force
        Write-Host "    Backup saved to: backend/sheerwood.db.demo_backup" -ForegroundColor DarkGray
        Write-Host "    Demo DB created: backend/sheerwood.demo.db" -ForegroundColor DarkGray
    } else {
        Write-Warning "Primary database sheerwood.db not found; backend will initialize sheerwood.demo.db."
    }
} else {
    Write-Host "[+] Isolated demo database ready: backend/sheerwood.demo.db" -ForegroundColor Green
}

# 3. Environment Variables for Frontend Build
$env:VITE_SITE_URL = $TunnelUrl
$env:VITE_COGNITO_REDIRECT_URI = "$TunnelUrl/"
$env:VITE_COGNITO_LOGOUT_URI = "$TunnelUrl/signed-out"
$env:VITE_CHAT_STREAMING = $ChatStreaming
$env:VITE_REVIEW_MODE = "false"

# 4. Build Frontend Bundle (if not skipped)
Set-Location $PortalRoot
if (-not $SkipBuild) {
    Write-Host "`n[+] Building production frontend bundle (npm run build)..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Production build failed. Resolve lint/type errors and try again."
        exit 1
    }
    Write-Host "[+] Production build completed in dist/" -ForegroundColor Green
} else {
    Write-Host "`n[!] Skipping frontend build (--SkipBuild specified)." -ForegroundColor DarkGray
}

# 5. Environment Variables for Backend
$env:DEMO_MODE = "true"
$env:DATABASE_PATH = "sheerwood.demo.db"
$env:ALLOWED_ORIGINS = "$TunnelUrl,http://localhost:4173,http://127.0.0.1:4173"
$env:AI_RATE_LIMIT_REQUESTS = "20"
$env:AI_RATE_LIMIT_WINDOW_SECONDS = "300"

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "              DEMO START INSTRUCTIONS                     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "`nStep 1: Start Backend (FastAPI with real IP forwarding):" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------"
Write-Host "cd backend" -ForegroundColor White
Write-Host "`$env:DEMO_MODE='true'; `$env:DATABASE_PATH='sheerwood.demo.db'; `$env:ALLOWED_ORIGINS='$TunnelUrl,http://localhost:4173,http://127.0.0.1:4173'" -ForegroundColor DarkGray
Write-Host "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --proxy-headers --forwarded-allow-ips `"127.0.0.1`"" -ForegroundColor Cyan

Write-Host "`nStep 2: Start Frontend Preview (Single Origin with /api proxy):" -ForegroundColor Yellow
Write-Host "---------------------------------------------------------------"
Write-Host "cd $PortalRoot" -ForegroundColor White
Write-Host "npm run preview -- --port 4173 --host 127.0.0.1" -ForegroundColor Cyan

Write-Host "`nStep 3: Launch Tunnel (Expose port 4173 only):" -ForegroundColor Yellow
Write-Host "----------------------------------------------"
Write-Host "# Option A (Recommended: ngrok with SSE streaming support & basic auth):" -ForegroundColor White
$DomainArg = if ($TunnelUrl -match "https://([^/]+)") { " --domain=" + $matches[1] } else { "" }
Write-Host "ngrok http 4173$DomainArg --basic-auth=`"sherwood:Admission2027`"" -ForegroundColor Cyan
Write-Host "`n# Option B (Cloudflare Tunnel alternative):" -ForegroundColor White
Write-Host "cloudflared tunnel --url http://127.0.0.1:4173" -ForegroundColor DarkCyan

Write-Host "`nCognito App Client Allowed URLs to ensure in AWS Console:" -ForegroundColor Yellow
Write-Host "  Allowed Callback URL: $TunnelUrl/" -ForegroundColor White
Write-Host "  Allowed Sign-out URL: $TunnelUrl/signed-out" -ForegroundColor White
Write-Host "==========================================================`n" -ForegroundColor Cyan

