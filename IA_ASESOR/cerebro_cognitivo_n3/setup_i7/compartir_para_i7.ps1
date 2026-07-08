# ============================================================
# compartir_para_i7.ps1
# Ejecutar en esta PC (Nodo 4 / MarketingPost) como Administrador
# Comparte D:\Alvarezplacas_2026 para que el i7 pueda accederla
# vía Tailscale (red privada, sin abrir puertos al exterior)
# ============================================================

$ErrorActionPreference = "Continue"
$FOLDER_PATH = "D:\Alvarezplacas_2026"
$SHARE_NAME  = "Alvarezplacas_2026"
$SHARE_DESC  = "Codigo Alvarez Placas - Acceso Nodo 3 i7 (Tailscale)"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Configurando carpeta compartida para Nodo 3 (i7)" -ForegroundColor Cyan
Write-Host "   Esta PC: Nodo 4 / MarketingPost (100.106.57.3)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------
# Verificar que la carpeta existe
# ----------------------------------------------------------
if (-not (Test-Path $FOLDER_PATH)) {
    Write-Host "❌ ERROR: No existe $FOLDER_PATH" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Carpeta encontrada: $FOLDER_PATH" -ForegroundColor Green

# ----------------------------------------------------------
# Verificar si ya está compartida
# ----------------------------------------------------------
$existing = Get-SmbShare -Name $SHARE_NAME -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "ℹ️  La carpeta '$SHARE_NAME' ya está compartida. Actualizando permisos..." -ForegroundColor Yellow
    Remove-SmbShare -Name $SHARE_NAME -Force
}

# ----------------------------------------------------------
# Crear el recurso compartido SMB
# ----------------------------------------------------------
Write-Host ""
Write-Host "Creando recurso compartido SMB '$SHARE_NAME'..." -ForegroundColor Yellow
New-SmbShare -Name $SHARE_NAME `
             -Path $FOLDER_PATH `
             -Description $SHARE_DESC `
             -FullAccess "Everyone" `
             -ErrorAction Stop

Write-Host "✅ Recurso compartido creado: \\$(hostname)\$SHARE_NAME" -ForegroundColor Green

# ----------------------------------------------------------
# Verificar que el Firewall NO bloquea SMB en la interfaz Tailscale
# Tailscale usa interfaz de red llamada "Tailscale" (perfil Private)
# SMB usa puerto 445
# ----------------------------------------------------------
Write-Host ""
Write-Host "Configurando Firewall para SMB en red Tailscale..." -ForegroundColor Yellow

# Habilitar regla de Firewall para File and Printer Sharing en redes privadas
netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=yes profile=private | Out-Null
Write-Host "✅ Regla de Firewall 'File and Printer Sharing' habilitada (perfil Private)" -ForegroundColor Green

# Verificar que la interfaz Tailscale esté configurada como Private (no Public)
$tailscaleAdapter = Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -like "*Tailscale*" }
if ($tailscaleAdapter) {
    if ($tailscaleAdapter.NetworkCategory -ne "Private") {
        Set-NetConnectionProfile -InterfaceAlias $tailscaleAdapter.InterfaceAlias -NetworkCategory Private
        Write-Host "✅ Interfaz Tailscale configurada como red Privada (necesario para SMB)" -ForegroundColor Green
    } else {
        Write-Host "✅ Interfaz Tailscale ya es red Privada. OK." -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No se encontró interfaz Tailscale activa. Verificar que Tailscale esté corriendo." -ForegroundColor Yellow
}

# ----------------------------------------------------------
# Mostrar IP Tailscale de esta PC para configurar en el i7
# ----------------------------------------------------------
Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "   Datos para configurar en el i7:" -ForegroundColor DarkCyan
Write-Host "------------------------------------------------------------" -ForegroundColor DarkCyan

$tailscaleIP = (Get-NetIPAddress | Where-Object { $_.IPAddress -like "100.*" -and $_.AddressFamily -eq "IPv4" } | Select-Object -First 1).IPAddress
Write-Host "   IP Tailscale de esta PC (Nodo 4): $tailscaleIP" -ForegroundColor White
Write-Host "   Ruta UNC para el i7:  \\$tailscaleIP\$SHARE_NAME" -ForegroundColor White
Write-Host "   Mapear en el i7 con:" -ForegroundColor White
Write-Host "   net use A: \\$tailscaleIP\$SHARE_NAME /persistent:yes" -ForegroundColor Gray
Write-Host ""

# ----------------------------------------------------------
# Verificar que el servicio SMB está activo
# ----------------------------------------------------------
$smbSvc = Get-Service -Name "LanmanServer" -ErrorAction SilentlyContinue
if ($smbSvc.Status -ne "Running") {
    Start-Service -Name "LanmanServer"
    Write-Host "✅ Servicio SMB (LanmanServer) iniciado" -ForegroundColor Green
} else {
    Write-Host "✅ Servicio SMB (LanmanServer) activo" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   ✅ LISTO. La carpeta está compartida por Tailscale." -ForegroundColor Cyan
Write-Host "   Ahora ejecutar setup_i7_completo.ps1 en la PC i7." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
