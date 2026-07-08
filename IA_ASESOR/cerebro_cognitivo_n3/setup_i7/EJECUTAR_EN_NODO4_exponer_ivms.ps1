# ============================================================
# EJECUTAR EN ESTA PC (MarketingPost - Nodo 4) como Administrador
# Expone el servidor iVMS-4200 hacia la red Tailscale
# para que el i7 pueda conectarse como cliente adicional
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Exponiendo iVMS-4200 Server al i7 via Tailscale" -ForegroundColor Cyan
Write-Host "   Puerto 8090 (Nginx/Web) -> accesible en 100.106.57.3:8090" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$TAILSCALE_IP = "100.106.57.3"  # IP Tailscale de esta PC (MarketingPost)

# ----------------------------------------------------------
# El servidor iVMS-4200 escucha SOLO en localhost:8090
# Necesitamos que escuche tambien en la IP de Tailscale
# para que el i7 (100.x.x.x) pueda conectarse
# ----------------------------------------------------------

# Opcion 1: Modificar el nginx.conf para que escuche en la IP Tailscale
$nginxConf = "C:\Program Files (x86)\iVMS-4200 Site\Nginx\conf\nginx.conf"

if (Test-Path $nginxConf) {
    Write-Host "[1] Modificando nginx.conf para escuchar en IP Tailscale..." -ForegroundColor Yellow
    
    # Hacer backup
    Copy-Item $nginxConf "$nginxConf.bak" -Force
    Write-Host "    Backup creado: $nginxConf.bak" -ForegroundColor Gray
    
    # Leer config actual
    $content = Get-Content $nginxConf -Raw
    
    # Agregar listen en la IP Tailscale si no existe
    if ($content -notmatch "100\.106\.57\.3:8090") {
        $content = $content -replace "listen\s+localhost:8090;", "listen       localhost:8090;`n        listen       100.106.57.3:8090;"
        Set-Content -Path $nginxConf -Value $content -Encoding UTF8
        Write-Host "    OK: nginx.conf actualizado con listen 100.106.57.3:8090" -ForegroundColor Green
    } else {
        Write-Host "    OK: Ya estaba configurado para Tailscale" -ForegroundColor Green
    }
}

# ----------------------------------------------------------
# Opcion 2: Port proxy con netsh (alternativa mas simple y robusta)
# Redirige 100.106.57.3:8090 -> 127.0.0.1:8090
# Esto funciona sin tocar el nginx.conf
# ----------------------------------------------------------
Write-Host ""
Write-Host "[2] Configurando port proxy con netsh..." -ForegroundColor Yellow

# Eliminar regla anterior si existe
netsh interface portproxy delete v4tov4 listenaddress=$TAILSCALE_IP listenport=8090 2>$null

# Crear nueva regla de forwarding
netsh interface portproxy add v4tov4 `
    listenaddress=$TAILSCALE_IP `
    listenport=8090 `
    connectaddress=127.0.0.1 `
    connectport=8090

Write-Host "    OK: Port proxy creado: $TAILSCALE_IP`:8090 -> 127.0.0.1:8090" -ForegroundColor Green

# Tambien exponer puerto 7800 (DeviceManagement SDK) si es necesario
netsh interface portproxy delete v4tov4 listenaddress=$TAILSCALE_IP listenport=7800 2>$null
netsh interface portproxy add v4tov4 `
    listenaddress=$TAILSCALE_IP `
    listenport=7800 `
    connectaddress=192.168.1.35 `
    connectport=7800

Write-Host "    OK: Port proxy SDK: $TAILSCALE_IP`:7800 -> 192.168.1.35:7800" -ForegroundColor Green

# ----------------------------------------------------------
# Firewall: permitir conexiones entrantes en los puertos via Tailscale
# ----------------------------------------------------------
Write-Host ""
Write-Host "[3] Configurando Firewall para acceso desde i7..." -ForegroundColor Yellow

# Eliminar reglas viejas si existen
netsh advfirewall firewall delete rule name="iVMS-4200 Tailscale i7" 2>$null

# Crear regla que permite TCP 8090 y 7800 solo desde la red Tailscale (100.x.x.x)
netsh advfirewall firewall add rule `
    name="iVMS-4200 Tailscale i7" `
    dir=in `
    action=allow `
    protocol=TCP `
    localport=8090,7800 `
    remoteip=100.0.0.0/8 `
    profile=private

Write-Host "    OK: Firewall configurado - TCP 8090,7800 abierto para red Tailscale (100.x.x.x)" -ForegroundColor Green

# ----------------------------------------------------------
# Verificar que todo funciona
# ----------------------------------------------------------
Write-Host ""
Write-Host "[4] Verificando configuracion..." -ForegroundColor Yellow
netsh interface portproxy show all
Write-Host ""

# Obtener usuario del servidor iVMS
Write-Host "[5] Credenciales del servidor iVMS-4200:" -ForegroundColor Yellow
$userDB = "C:\Program Files (x86)\iVMS-4200 Site\iVMS-4200 Client\Server\maintain\System.benchmark"
if (Test-Path $userDB) {
    $tmp = "$env:TEMP\sys_check.db"
    Copy-Item $userDB $tmp -Force
    $result = python -c "
import sqlite3
conn=sqlite3.connect(r'$tmp')
cur=conn.cursor()
try:
    cur.execute(\"SELECT * FROM User\")
    rows=cur.fetchall()
    cols=[d[0] for d in cur.description]
    for r in rows: print(dict(zip(cols,r)))
except Exception as e: print('Error:', e)
conn.close()
"
    Write-Host "$result" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   LISTO. El i7 puede conectarse al servidor iVMS-4200:" -ForegroundColor Cyan
Write-Host "   URL:    http://100.106.57.3:8090" -ForegroundColor White
Write-Host "   Puerto SDK: 100.106.57.3:7800" -ForegroundColor White
Write-Host ""
Write-Host "   En el i7, abrir iVMS-4200 Client y agregar servidor:" -ForegroundColor White
Write-Host "   Tipo: CMS Server" -ForegroundColor Gray
Write-Host "   IP:   100.106.57.3" -ForegroundColor Gray
Write-Host "   Puerto: 8090 (o 7800 para SDK)" -ForegroundColor Gray
Write-Host "   Usuario/Clave: los del servidor iVMS de esta PC" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
