@echo off
:: ============================================================
:: EJECUTAR EN LA PC i7 (Nodo 3) como Administrador
:: Conecta el i7 al servidor iVMS-4200 que corre en MarketingPost
:: y acepta las rutas Tailscale para ver las camaras
::
:: PREREQUISITO: Ejecutar EJECUTAR_EN_I5_subnet_router.ps1 en el i5
::               y aprobar la ruta en https://login.tailscale.com/admin
:: ============================================================

title i7 - Acceso Camaras Hikvision via Tailscale

echo.
echo ============================================================
echo    CONFIGURACION DE CAMARAS - PC i7 (Nodo 3)
echo    DVR 1: 192.168.1.58  ^(DS-7216HGHI-K, 16ch^)
echo    DVR 2: 192.168.1.98  ^(DS-7216HGHI-M, 16ch^)
echo    Acceso via: Tailscale Subnet Router ^(Nodo 2 i5^)
echo ============================================================
echo.

:: --- PASO 1: Aceptar rutas de subnet por Tailscale ---
echo [1/4] Aceptando rutas de subnet por Tailscale...
tailscale up --accept-routes
if %errorlevel%==0 (
    echo       OK: Rutas de subnet aceptadas
) else (
    echo       ERROR: Verificar que Tailscale este instalado y conectado
    echo       Instalar: https://tailscale.com/download/windows
    pause
    exit /b 1
)
echo.

:: --- PASO 2: Verificar acceso a los DVRs via subnet route ---
echo [2/4] Verificando acceso a los DVRs...
echo.
echo Probando DVR 1 (192.168.1.58)...
ping -n 2 192.168.1.58
echo.
echo Probando DVR 2 (192.168.1.98)...
ping -n 2 192.168.1.98
echo.

:: --- PASO 3: Instalar iVMS-4200 Site en el i7 y conectar al servidor existente ---
echo [3/4] Informacion para conectar iVMS-4200 al servidor de MarketingPost:
echo.
echo    El servidor iVMS-4200 ya corre en MarketingPost (Nodo 4):
echo    IP Tailscale de MarketingPost: 100.106.57.3
echo    Puerto del servidor iVMS:      80 (HTTP) o el puerto configurado
echo.
echo    Para conectar el cliente iVMS-4200 del i7:
echo    - Abrir iVMS-4200 Client en el i7
echo    - En "Servidor" -> Agregar servidor remoto
echo    - IP: 100.106.57.3
echo    - Puerto: 80
echo    - Usuario: admin (el del servidor iVMS de esta PC)
echo.

:: --- PASO 4: Configurar acceso directo a los DVRs (alternativa sin iVMS) ---
echo [4/4] Configurando acceso directo RTSP a los DVRs...
echo.
echo    Una vez aceptada la ruta subnet, los DVRs son accesibles con:
echo.
echo    DVR 1 - Interface web:
echo    http://192.168.1.58  (usuario y clave del DVR fisico)
echo.
echo    DVR 2 - Interface web:
echo    http://192.168.1.98  (usuario y clave del DVR fisico)
echo.
echo    Streams RTSP (para VLC o la IA):
echo    rtsp://admin:PASSWORD@192.168.1.58:554/Streaming/Channels/101  (camara 1 del DVR1)
echo    rtsp://admin:PASSWORD@192.168.1.58:554/Streaming/Channels/201  (camara 2 del DVR1)
echo    rtsp://admin:PASSWORD@192.168.1.98:554/Streaming/Channels/101  (camara 1 del DVR2)
echo    [continuar para los 16 canales con ChannelNo x100+1]
echo.

:: --- Generar archivo de configuracion para la IA ---
echo Generando cameras_config.py para la IA...
(
echo # cameras_config.py - Configuracion de camaras Hikvision
echo # Generado automaticamente para el Nodo 3 ^(i7^)
echo # Acceso via Tailscale Subnet Router ^(Nodo 2 i5^)
echo.
echo # IPs accesibles porque el i5 ^(192.168.1.87^) es Subnet Router
echo DVR1_IP = "192.168.1.58"   # DS-7216HGHI-K ^(16 canales^)
echo DVR2_IP = "192.168.1.98"   # DS-7216HGHI-M ^(16 canales^)
echo DVR_USER = "admin"          # CAMBIAR si es diferente
echo DVR_PASS = "COMPLETAR"      # Obtener del DVR fisico o del admin de red
echo.
echo # Servidor iVMS-4200 en MarketingPost
echo IVMS_SERVER_IP = "100.106.57.3"
echo IVMS_SERVER_PORT = 80
echo.
echo # Streams RTSP - Formato: /Streaming/Channels/^(canal*100+1^)
echo # Canal 1 del DVR1: rtsp://admin:PASS@192.168.1.58:554/Streaming/Channels/101
echo # Canal 2 del DVR1: rtsp://admin:PASS@192.168.1.58:554/Streaming/Channels/201
echo CAMERAS = [
echo     {"name": "DVR1-CH1",  "dvr": DVR1_IP, "channel": 101, "rtsp": f"rtsp://{DVR_USER}:{DVR_PASS}@{DVR1_IP}:554/Streaming/Channels/101"},
echo     {"name": "DVR1-CH2",  "dvr": DVR1_IP, "channel": 201, "rtsp": f"rtsp://{DVR_USER}:{DVR_PASS}@{DVR1_IP}:554/Streaming/Channels/201"},
echo     {"name": "DVR1-CH3",  "dvr": DVR1_IP, "channel": 301, "rtsp": f"rtsp://{DVR_USER}:{DVR_PASS}@{DVR1_IP}:554/Streaming/Channels/301"},
echo     {"name": "DVR2-CH1",  "dvr": DVR2_IP, "channel": 101, "rtsp": f"rtsp://{DVR_USER}:{DVR_PASS}@{DVR2_IP}:554/Streaming/Channels/101"},
echo     {"name": "DVR2-CH2",  "dvr": DVR2_IP, "channel": 201, "rtsp": f"rtsp://{DVR_USER}:{DVR_PASS}@{DVR2_IP}:554/Streaming/Channels/201"},
echo ]
) > "D:\IA_AlvarezPlacas\cameras_config.py"

echo       OK: D:\IA_AlvarezPlacas\cameras_config.py generado
echo.
echo ============================================================
echo    COMPLETADO. Para ver las camaras:
echo    1. Abrir http://192.168.1.58 en el navegador del i7
echo    2. Ingresar usuario y clave del DVR
echo    3. Completar DVR_PASS en D:\IA_AlvarezPlacas\cameras_config.py
echo ============================================================
pause
