<#
.SYNOPSIS
    Starts the IMKA Knowledge Assistant backend (FastAPI) and frontend (React/Vite) dev servers.

.DESCRIPTION
    - Backend: activates backend/.venv and runs `uvicorn api.main:app --reload --port 8000`
    - Frontend: runs `npm run dev` in frontend/ (Vite, default port 5173)
    Each service is launched in its own PowerShell window so logs stay separate.

.PARAMETER SkipQdrant
    Skip starting the Qdrant container via docker compose.

.EXAMPLE
    .\start.ps1
    .\start.ps1 -SkipQdrant
#>

param(
    [switch]$SkipQdrant
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$venvActivate = Join-Path $backendDir ".venv\Scripts\Activate.ps1"

if (-not $SkipQdrant) {
    Write-Host "Starting Qdrant (docker compose)..." -ForegroundColor Cyan
    try {
        Push-Location $backendDir
        docker compose up -d
        Pop-Location
    } catch {
        Write-Warning "Could not start Qdrant via docker compose: $_"
    }
}

if (-not (Test-Path $venvActivate)) {
    Write-Warning "Backend virtual environment not found at $venvActivate. Create one with: python -m venv .venv"
}

Write-Host "Starting backend (FastAPI) on http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$backendDir'; if (Test-Path '$venvActivate') { . '$venvActivate' }; uvicorn api.main:app --reload --port 8000"
)

Write-Host "Starting frontend (Vite) on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$frontendDir'; npm run dev"
)

Write-Host "Both services are starting in separate windows." -ForegroundColor Green
Write-Host "Backend:  http://localhost:8000/docs"
Write-Host "Frontend: http://localhost:5173"
