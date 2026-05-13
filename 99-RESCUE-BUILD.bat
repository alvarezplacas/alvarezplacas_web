@echo off
title RESCATE PROFESIONAL - REPARAR ERROR 502
echo ==================================================
echo REPARANDO ESTADO DEL CONTENEDOR EN VPS
echo ==================================================
echo.

:: Configuracion
set KEY=d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\alvarez_vps.key
set BASE_LOCAL=d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\web01
set REMOTE_USER=root
set REMOTE_IP=144.217.163.13
set REMOTE_PATH=/opt/alvarez_v16/web01/site/web01

echo 1. Preparando paquete de rescate...
cd /d "%BASE_LOCAL%"
tar --exclude="node_modules" --exclude=".git" --exclude=".astro" --exclude="dist" -czf ..\rescue.tar.gz Frontend Backend src public package.json astro.config.mjs jsconfig.json

echo 2. Subiendo al VPS...
scp -i "%KEY%" -o StrictHostKeyChecking=no "%BASE_LOCAL%\..\rescue.tar.gz" %REMOTE_USER%@%REMOTE_IP%:%REMOTE_PATH%/

echo 3. Extrayendo archivos...
ssh -i "%KEY%" -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_IP% "cd %REMOTE_PATH% && rm -rf dist .astro && tar -xzf rescue.tar.gz && rm rescue.tar.gz"

echo 4. EJECUTANDO BUILD DE EMERGENCIA (Bypass Bucle Reinicio)...
:: Usamos docker run con los mismos volumenes para compilar sin depender del contenedor caido
ssh -i "%KEY%" -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_IP% "docker run --rm -v /opt/alvarez_v16/web01/site/web01:/app -w /app node:22-alpine sh -c 'npm install && npm run build'"

echo 5. Reiniciando servicio principal...
ssh -i "%KEY%" -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_IP% "cd /opt/alvarez_v16/web01 && docker compose -f docker-compose.vps.yml restart alvarezplacas_web"

echo.
echo ==================================================
echo ✅ SISTEMA RESCATADO
echo El error 502 deberia haber desaparecido.
echo ==================================================
del "%BASE_LOCAL%\..\rescue.tar.gz"
pause
