@echo off
title JARVIS - Auditor de WhatsApp
cd /d "%~dp0"
echo.
echo   ====== HERUPU JARVIS - Auditor de WhatsApp ======
echo.
if not exist ".env" (
    echo   [!] Arquivo .env nao encontrado.
    echo       Copie o .env.example para .env e preencha AUDIT_TARGET.
    copy ".env.example" ".env" >nul 2>nul
    echo       Criei um .env pra voce a partir do exemplo. Edite-o e rode de novo.
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo   [1/2] Instalando dependencias (1-3 min)...
    call npm install --no-audit --no-fund
)
echo   [2/2] Iniciando auditor... (escaneie o QR na PRIMEIRA vez)
echo.
node auditor.js
pause
