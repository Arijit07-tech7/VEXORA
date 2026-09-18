@echo off
title VEXORA
cd /d "%~dp0"
echo.
echo ========================================
echo          VEXORA - FIRST RUN
echo ========================================
echo.
if not exist node_modules (
  echo [1/3] Installing backend dependencies...
  call npm install
  if errorlevel 1 goto :error
) else (
  echo [1/3] Dependencies already installed.
)
echo [2/3] Building frontend...
call npm run build
if errorlevel 1 goto :error
echo [3/3] Starting VEXORA...
echo Open http://localhost:5000 in your browser.
echo Press Ctrl+C to stop the server.
echo.
call npm start
goto :end
:error
echo.
echo VEXORA could not start. Check the error above.
pause
:end
