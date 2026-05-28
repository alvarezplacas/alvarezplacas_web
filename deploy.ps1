$KEY = "d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\alvarez_vps.key"
$BASE_LOCAL = "d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\web01"
$REMOTE_USER = "root"
$REMOTE_IP = "144.217.163.13"
$REMOTE_PATH = "/opt/alvarez_v16/web01/site/web01"

Write-Host "1. Preparando paquete de rescate..."
Set-Location -Path $BASE_LOCAL
tar --exclude="node_modules" --exclude=".git" --exclude=".astro" --exclude="dist" -czf ..\rescue.tar.gz Frontend Backend src public package.json astro.config.mjs jsconfig.json

Write-Host "2. Subiendo al VPS..."
scp -i "$KEY" -o StrictHostKeyChecking=no "$BASE_LOCAL\..\rescue.tar.gz" "${REMOTE_USER}@${REMOTE_IP}:${REMOTE_PATH}/"

Write-Host "3. Extrayendo archivos..."
ssh -i "$KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_IP" "cd $REMOTE_PATH && rm -rf dist .astro && tar -xzf rescue.tar.gz && rm rescue.tar.gz"

Write-Host "4. EJECUTANDO BUILD DE EMERGENCIA..."
ssh -i "$KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_IP" "docker run --rm -v /opt/alvarez_v16/web01/site/web01:/app -w /app node:22-alpine sh -c 'npm install && npm run build'"

Write-Host "5. Reiniciando servicio principal..."
ssh -i "$KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_IP" "cd /opt/alvarez_v16/web01 && docker compose -f docker-compose.vps.yml restart alvarezplacas_web"

Write-Host "SISTEMA RESCATADO"
Remove-Item -Path "$BASE_LOCAL\..\rescue.tar.gz" -ErrorAction SilentlyContinue
