@echo off
REM Starts the IMKA Knowledge Assistant backend (FastAPI) and frontend (React/Vite) dev servers.
REM Each service runs in its own window so logs stay separate.
REM Usage: start.bat [skipqdrant]

setlocal
set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "VENV_ACTIVATE=%BACKEND_DIR%\.venv\Scripts\activate.bat"

if /I "%~1"=="skipqdrant" goto :skipqdrant

echo Starting Qdrant (docker compose)...
pushd "%BACKEND_DIR%"
docker compose up -d
popd

:skipqdrant

if not exist "%VENV_ACTIVATE%" (
    echo WARNING: Backend virtual environment not found at %VENV_ACTIVATE%
    echo Create one with: python -m venv .venv
)

echo Starting backend (FastAPI) on http://localhost:8000 ...
start "Backend - FastAPI" cmd /k "cd /d "%BACKEND_DIR%" && if exist "%VENV_ACTIVATE%" call "%VENV_ACTIVATE%" && uvicorn api.main:app --reload --port 8000"

echo Starting frontend (Vite) on http://localhost:5173 ...
start "Frontend - Vite" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo Both services are starting in separate windows.
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:5173

endlocal
