@echo off
title DESPLIEGUE FORZADO (V5.1) - ALVAREZ PLACAS
echo ==================================================
echo SUBIENDO CAMBIOS Y LIMPIANDO CACHE EN VPS
echo ==================================================
echo.

:: Configuracion de Rutas
set KEY=d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\alvarez_vps.key
set BASE_LOCAL=d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\web01
set REMOTE_USER=root
set REMOTE_IP=144.217.163.13
set REMOTE_PATH=/opt/alvarez_v16/web01/site/web01

echo 1. Preparando paquete local (V5.1)...
cd /d "%BASE_LOCAL%"
tar --exclude="*.zip" --exclude="*.pdf" --exclude="*.md" --exclude="*.log" --exclude="node_modules" --exclude=".git" --exclude=".astro" --exclude="dist" --exclude=".DS_Store" -czf ..\site_update.tar.gz Frontend Backend src public docs _INSTRUCCIONES package.json astro.config.mjs

echo 2. Subiendo paquete al VPS...
scp -i "%KEY%" -o StrictHostKeyChecking=no "%BASE_LOCAL%\..\site_update.tar.gz" %REMOTE_USER%@%REMOTE_IP%:%REMOTE_PATH%/

echo 3. Limpieza profunda y extraccion en VPS...
:: Borramos dist y .astro para forzar una compilacion desde cero
ssh -i "%KEY%" -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_IP% "cd %REMOTE_PATH% && rm -rf dist .astro && tar -xzf site_update.tar.gz && rm site_update.tar.gz"

echo 4. Compilando aplicacion en contenedor (Build Limpio)...
ssh -i "%KEY%" -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_IP% "docker run --rm -v /opt/alvarez_v16/web01/site/web01:/app -w /app node:22-alpine sh -c 'npm install && npm run build'"

echo 5. Reiniciando contenedor...
ssh -i "%KEY%" -o StrictHostKeyChecking=no %REMOTE_USER%@%REMOTE_IP% "cd /opt/alvarez_v16/web01 && docker compose -f docker-compose.vps.yml restart alvarezplacas_web"

:: Limpieza local
del "%BASE_LOCAL%\..\site_update.tar.gz"

echo.
echo ==================================================
echo ✅ DESPLIEGUE FORZADO V5.1 COMPLETADO
echo Por favor, pulsa CTRL + F5 en tu navegador.
echo URLs de Acceso:
echo - Vendedor: https://alvarezplacas.com.ar/vendedor
echo - Cliente:  https://alvarezplacas.com.ar/cliente
echo ==================================================
echo ==================================================
