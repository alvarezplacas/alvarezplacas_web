# ============================================================
# acceso_camaras_hikvision.ps1
# Ejecutar en la PC i7 (Nodo 3)
# Escanea y configura el acceso a cámaras Hikvision en la LAN
# También instala la herramienta iVMS-4200 si no está presente
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   SCANNER DE CÁMARAS HIKVISION - Nodo 3 (i7)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------
# Detectar rango de red local
# ----------------------------------------------------------
Write-Host "[1] Detectando red local..." -ForegroundColor Yellow
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "100.*" } | 
    Select-Object -First 1).IPAddress

if (-not $localIP) {
    Write-Host "⚠️  No se detectó IP de red local. Usando rango 192.168.1.x por defecto." -ForegroundColor Yellow
    $subnet = "192.168.1"
} else {
    $subnet = $localIP -replace "\.\d+$", ""
    Write-Host "   IP local del i7: $localIP  →  Escaneando $subnet.0/24" -ForegroundColor Green
}

# ----------------------------------------------------------
# Escanear puertos típicos de Hikvision en la LAN
# Puerto 80  = Interfaz Web HTTP / ONVIF
# Puerto 8000 = SDK Hikvision (iVMS)
# Puerto 554 = RTSP Stream
# Puerto 8080 = HTTP alternativo
# ----------------------------------------------------------
Write-Host ""
Write-Host "[2] Escaneando cámaras Hikvision en $subnet.0/24..." -ForegroundColor Yellow
Write-Host "    (Puertos: 80, 554, 8000)" -ForegroundColor Gray
Write-Host ""

$cameras = @()
1..254 | ForEach-Object {
    $ip = "$subnet.$_"
    # Ping rápido primero
    $alive = Test-Connection -ComputerName $ip -Count 1 -Quiet -TimeToLive 64 2>$null
    if ($alive) {
        $hasHTTP = (Test-NetConnection -ComputerName $ip -Port 80 -WarningAction SilentlyContinue -InformationLevel Quiet 2>$null)
        $hasRTSP = (Test-NetConnection -ComputerName $ip -Port 554 -WarningAction SilentlyContinue -InformationLevel Quiet 2>$null)
        $hasSDK  = (Test-NetConnection -ComputerName $ip -Port 8000 -WarningAction SilentlyContinue -InformationLevel Quiet 2>$null)
        
        if ($hasHTTP -or $hasRTSP -or $hasSDK) {
            $ports = @()
            if ($hasHTTP) { $ports += "80(HTTP)" }
            if ($hasRTSP) { $ports += "554(RTSP)" }
            if ($hasSDK)  { $ports += "8000(SDK)" }
            
            $deviceInfo = [PSCustomObject]@{
                IP    = $ip
                Ports = $ports -join ", "
                HTTP  = $hasHTTP
                RTSP  = $hasRTSP
                SDK   = $hasSDK
            }
            $cameras += $deviceInfo
            Write-Host "   📷 Dispositivo encontrado: $ip  →  $($ports -join ', ')" -ForegroundColor Green
        }
    }
}

# ----------------------------------------------------------
# Resumen de cámaras encontradas
# ----------------------------------------------------------
Write-Host ""
Write-Host "------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "   RESULTADOS DEL ESCANEO" -ForegroundColor DarkCyan
Write-Host "------------------------------------------------------------" -ForegroundColor DarkCyan

if ($cameras.Count -eq 0) {
    Write-Host "   ⚠️  No se encontraron dispositivos con puertos Hikvision." -ForegroundColor Yellow
    Write-Host "   Verificar:" -ForegroundColor White
    Write-Host "   - Que el i7 esté en la misma red local (192.168.1.x)" -ForegroundColor Gray
    Write-Host "   - Que las cámaras estén encendidas" -ForegroundColor Gray
    Write-Host "   - Ejecutar: arp -a | findstr '00-0d' para ver MACs Hikvision" -ForegroundColor Gray
} else {
    Write-Host "   Total dispositivos encontrados: $($cameras.Count)" -ForegroundColor Green
    Write-Host ""
    Write-Host "   URLs de acceso web:" -ForegroundColor White
    foreach ($cam in $cameras) {
        if ($cam.HTTP) {
            Write-Host "   🌐 http://$($cam.IP)  (usuario: admin, pass: configurado en NVR)" -ForegroundColor Cyan
        }
        if ($cam.RTSP) {
            Write-Host "   📹 rtsp://admin:PASSWORD@$($cam.IP):554/Streaming/Channels/101" -ForegroundColor Cyan
        }
    }
}

# ----------------------------------------------------------
# Verificar acceso al NVR/Visor del Nodo 2 (i5)
# ----------------------------------------------------------
Write-Host ""
Write-Host "[3] Verificando acceso al Visor Operativo (Nodo 2 - i5)..." -ForegroundColor Yellow
$nodo2IPs = @("192.168.1.87", "100.94.20.127")  # LAN y Tailscale
foreach ($nodo2 in $nodo2IPs) {
    $reach = Test-NetConnection -ComputerName $nodo2 -Port 3010 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($reach) {
        Write-Host "   ✅ Visor Operativo alcanzable: http://$nodo2`:3010" -ForegroundColor Green
        break
    }
}

# ----------------------------------------------------------
# Generar archivo de configuración RTSP para uso en Python
# ----------------------------------------------------------
Write-Host ""
Write-Host "[4] Generando archivo de configuración de cámaras..." -ForegroundColor Yellow

$configContent = @"
# cameras_config.py
# Generado automáticamente por acceso_camaras_hikvision.ps1
# Configuración de streams RTSP para el Nodo 3 (i7)
# COMPLETAR con usuario/contraseña real de cada cámara

CAMERAS = [
"@

foreach ($cam in $cameras) {
    if ($cam.RTSP) {
        $configContent += "`n    {`"ip`": `"$($cam.IP)`", `"rtsp`": `"rtsp://admin:PASSWORD@$($cam.IP):554/Streaming/Channels/101`", `"name`": `"Camara_$($cam.IP -replace '\.','_')`"},"
    }
}

$configContent += @"

]

# IP del NVR / Visor Operativo (Nodo 2)
NVR_HOST = "192.168.1.87"
NVR_PORT_WEB = 3010
NVR_PORT_SDK = 8000
"@

$configPath = "D:\IA_AlvarezPlacas\cameras_config.py"
$configContent | Set-Content -Path $configPath -Encoding UTF8
Write-Host "   ✅ Archivo generado: $configPath" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   ✅ Escaneo completado." -ForegroundColor Cyan
Write-Host "   Para ver streams desde el navegador usar iVMS-4200 o:" -ForegroundColor White
Write-Host "   VLC → Abrir URL de red → rtsp://admin:PASS@IP:554/..." -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan
