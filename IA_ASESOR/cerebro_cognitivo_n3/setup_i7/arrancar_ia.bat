@echo off
:: ==================================================
:: SERVIDOR COGNITIVO IA - ALVAREZ PLACAS (NODO 3)
:: ==================================================
title SERVIDOR COGNITIVO IA - ALVAREZ PLACAS
cd /d "%~dp0\.."

echo [*] Verificando estado del host de Ollama...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue" > nul
if %errorlevel% neq 0 (
    echo [!] ADVERTENCIA: Ollama no parece estar en ejecucion en el puerto 11434.
    echo [*] Iniciando Ollama en segundo plano...
    start /min "" ollama serve
    timeout /t 5 > nul
)

echo [*] Iniciando API REST de Inferencia y RAG (FastAPI)...
echo [INFO] Servidor corriendo en puerto 8000 (accesible en la red Tailscale).
echo.
python main.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] No se pudo iniciar el servidor FastAPI.
    echo Asegurese de tener Python y las dependencias instaladas correctas.
    pause
)
