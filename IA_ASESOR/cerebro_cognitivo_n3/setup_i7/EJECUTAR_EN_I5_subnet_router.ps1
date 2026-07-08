# ============================================================
# EJECUTAR EN EL SERVIDOR i5 (Nodo 2 - 192.168.1.87 / 100.94.20.127)
# Como Administrador en PowerShell
#
# Configura el i5 como Tailscale Subnet Router
# para que el i7 (Nodo 3) pueda acceder a toda la LAN 192.168.1.0/24
# incluidas las camaras Hikvision en 192.168.1.58 y 192.168.1.98
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   SUBNET ROUTER - Nodo 2 (i5) - Configuracion Tailscale" -ForegroundColor Cyan
Write-Host "   Objetivo: Exponer LAN 192.168.1.0/24 al i7 via Tailscale" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Tailscale esta instalado
$tailscale = Get-Command tailscale -ErrorAction SilentlyContinue
if (-not $tailscale) {
    Write-Host "ERROR: Tailscale no esta instalado. Instalar desde https://tailscale.com/download" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Tailscale instalado" -ForegroundColor Green

# Anunciar la subred LAN por Tailscale
# Esto permite que CUALQUIER nodo en la tailnet llegue a 192.168.1.x
Write-Host ""
Write-Host "[1] Anunciando subnet 192.168.1.0/24 por Tailscale..." -ForegroundColor Yellow
tailscale up --advertise-routes=192.168.1.0/24 --accept-routes

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Subnet anunciada correctamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANTE: Ahora debes aprobar la ruta en el panel de Tailscale:" -ForegroundColor Yellow
    Write-Host "  1. Ve a https://login.tailscale.com/admin/machines" -ForegroundColor White
    Write-Host "  2. Busca el nodo 'i5' o el nombre de esta maquina" -ForegroundColor White
    Write-Host "  3. Click en '...' -> 'Edit route settings'" -ForegroundColor White
    Write-Host "  4. Activa la ruta 192.168.1.0/24" -ForegroundColor White
} else {
    Write-Host "ERROR al anunciar la subnet. Verificar que Tailscale este conectado." -ForegroundColor Red
}

# Habilitar IP forwarding (necesario para subnet routing en Windows)
Write-Host ""
Write-Host "[2] Habilitando IP forwarding en Windows..." -ForegroundColor Yellow
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" -Name "IPEnableRouter" -Value 1
Write-Host "OK: IP forwarding habilitado (requiere reinicio para aplicar)" -ForegroundColor Green

# Verificar que el servicio de routing esta activo
Write-Host ""
Write-Host "[3] Verificando servicio de enrutamiento..." -ForegroundColor Yellow
$routingSvc = Get-Service -Name "RemoteAccess" -ErrorAction SilentlyContinue
if ($routingSvc) {
    if ($routingSvc.Status -ne "Running") {
        Set-Service -Name "RemoteAccess" -StartupType Automatic
        Start-Service -Name "RemoteAccess" -ErrorAction SilentlyContinue
    }
    Write-Host "OK: Servicio RemoteAccess -> $($routingSvc.Status)" -ForegroundColor Green
}

# Verificar estado final
Write-Host ""
Write-Host "[4] Estado Tailscale actual:" -ForegroundColor Yellow
tailscale status

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Configuracion completada en el i5." -ForegroundColor Cyan
Write-Host "   Dispositivos accesibles desde el i7 via Tailscale:" -ForegroundColor Cyan
Write-Host "   - DVR 1: 192.168.1.58  (DS-7216HGHI-K)" -ForegroundColor White
Write-Host "   - DVR 2: 192.168.1.98  (DS-7216HGHI-M)" -ForegroundColor White
Write-Host "   - Este servidor i5: 192.168.1.87" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
