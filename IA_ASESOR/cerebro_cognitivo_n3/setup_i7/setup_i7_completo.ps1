# ============================================================
# setup_i7_completo.ps1
# Script de configuración completo para el Nodo 3 (PC i7)
# Alvarez Placas - Cerebro Cognitivo
# 
# EJECUTAR como Administrador en la PC i7
# Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
# .\setup_i7_completo.ps1
# ============================================================

$ErrorActionPreference = "Continue"
$PROJECT_DIR = "D:\IA_AlvarezPlacas\cerebro_cognitivo_n3"
$NODO4_IP    = "100.106.57.3"   # IP Tailscale de MarketingPost (esta PC)
$SHARE_NAME  = "Alvarezplacas_2026"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   NODO 3 - CEREBRO COGNITIVO (i7) - Setup Completo" -ForegroundColor Cyan
Write-Host "   Alvarez Placas Ecosistema de IA" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------
# PASO 1: Verificar y crear estructura de directorios en D:\
# ----------------------------------------------------------
Write-Host "[1/7] Verificando directorios en D:\" -ForegroundColor Yellow
if (-not (Test-Path $PROJECT_DIR)) {
    New-Item -ItemType Directory -Path $PROJECT_DIR -Force | Out-Null
    Write-Host "      Creado: $PROJECT_DIR" -ForegroundColor Green
} else {
    Write-Host "      OK: $PROJECT_DIR ya existe" -ForegroundColor Green
}

# Carpeta para ChromaDB en D: (no usar C: para datos)
$CHROMA_DIR = "D:\IA_AlvarezPlacas\chroma_db"
if (-not (Test-Path $CHROMA_DIR)) {
    New-Item -ItemType Directory -Path $CHROMA_DIR -Force | Out-Null
    Write-Host "      Creado directorio ChromaDB: $CHROMA_DIR" -ForegroundColor Green
}

# ----------------------------------------------------------
# PASO 2: Verificar conectividad Tailscale con Nodo 4
# ----------------------------------------------------------
Write-Host ""
Write-Host "[2/7] Verificando conectividad Tailscale con MarketingPost ($NODO4_IP)..." -ForegroundColor Yellow
$ping = Test-Connection -ComputerName $NODO4_IP -Count 1 -Quiet
if ($ping) {
    Write-Host "      ✅ Nodo 4 (MarketingPost) alcanzable por Tailscale" -ForegroundColor Green
} else {
    Write-Host "      ⚠️  Nodo 4 no responde. Verificar que Tailscale esté activo en ambas máquinas." -ForegroundColor Red
}

# ----------------------------------------------------------
# PASO 3: Mapear carpeta compartida de Alvarezplacas (SMB)
# ----------------------------------------------------------
Write-Host ""
Write-Host "[3/7] Mapeando carpeta de código Alvarezplacas desde Nodo 4..." -ForegroundColor Yellow
$UNC = "\\$NODO4_IP\$SHARE_NAME"

# Verificar si ya está mapeada
$existingDrive = Get-PSDrive -Name "A" -ErrorAction SilentlyContinue
if ($existingDrive) {
    Write-Host "      OK: Unidad A: ya mapeada a $($existingDrive.DisplayRoot)" -ForegroundColor Green
} else {
    try {
        # Intentar mapear sin credenciales (mismo usuario de red)
        New-PSDrive -Name "A" -PSProvider FileSystem -Root $UNC -Persist -ErrorAction Stop | Out-Null
        Write-Host "      ✅ Unidad A: mapeada a $UNC" -ForegroundColor Green
    } catch {
        Write-Host "      ⚠️  No se pudo mapear automáticamente." -ForegroundColor Red
        Write-Host "      Intentá manualmente: net use A: $UNC /persistent:yes" -ForegroundColor Yellow
        Write-Host "      Si pide credenciales, usar el usuario Windows del Nodo 4." -ForegroundColor Yellow
    }
}

# ----------------------------------------------------------
# PASO 4: Copiar código actualizado al directorio de proyecto
# ----------------------------------------------------------
Write-Host ""
Write-Host "[4/7] Copiando código actualizado del Nodo 4 al proyecto local..." -ForegroundColor Yellow
$SOURCE = "\\$NODO4_IP\$SHARE_NAME\WEB-alvarezplacas_astro\Alvarezplacas\IA_ASESOR\cerebro_cognitivo_n3"

if (Test-Path $SOURCE) {
    Copy-Item -Path "$SOURCE\main.py"       -Destination "$PROJECT_DIR\main.py"       -Force
    Copy-Item -Path "$SOURCE\rag_engine.py" -Destination "$PROJECT_DIR\rag_engine.py" -Force
    Copy-Item -Path "$SOURCE\requirements.txt" -Destination "$PROJECT_DIR\requirements.txt" -Force
    Write-Host "      ✅ Archivos copiados: main.py, rag_engine.py, requirements.txt" -ForegroundColor Green
} else {
    Write-Host "      ⚠️  No se pudo acceder a $SOURCE" -ForegroundColor Red
    Write-Host "         Si tenés el pendrive conectado, copiá manualmente desde E:\MiniIA_I7\cerebro_cognitivo_n3\" -ForegroundColor Yellow
}

# ----------------------------------------------------------
# PASO 5: Configurar variables de entorno para el proyecto
# ----------------------------------------------------------
Write-Host ""
Write-Host "[5/7] Configurando variables de entorno del sistema..." -ForegroundColor Yellow

# CHROMA_PATH: usar disco D (no C)
[System.Environment]::SetEnvironmentVariable("CHROMA_PATH", "D:\IA_AlvarezPlacas\chroma_db", "Machine")
Write-Host "      CHROMA_PATH = D:\IA_AlvarezPlacas\chroma_db" -ForegroundColor Green

# OLLAMA_HOST: escuchar en todas las interfaces (requerido para Tailscale)
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "Machine")
Write-Host "      OLLAMA_HOST = 0.0.0.0:11434 (accesible por Tailscale)" -ForegroundColor Green

# OLLAMA_MODEL: usar llama3.1 si está disponible, sino llama3
[System.Environment]::SetEnvironmentVariable("OLLAMA_MODEL", "llama3.1", "Machine")
Write-Host "      OLLAMA_MODEL = llama3.1" -ForegroundColor Green

# OLLAMA_EMBED_MODEL
[System.Environment]::SetEnvironmentVariable("OLLAMA_EMBED_MODEL", "nomic-embed-text", "Machine")
Write-Host "      OLLAMA_EMBED_MODEL = nomic-embed-text" -ForegroundColor Green

Write-Host "      ✅ Variables de entorno configuradas (requieren reinicio de sesión para aplicar)" -ForegroundColor Green

# ----------------------------------------------------------
# PASO 6: Instalar dependencias Python
# ----------------------------------------------------------
Write-Host ""
Write-Host "[6/7] Instalando dependencias Python..." -ForegroundColor Yellow
$reqFile = "$PROJECT_DIR\requirements.txt"
if (Test-Path $reqFile) {
    pip install -r $reqFile --quiet
    Write-Host "      ✅ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "      Instalando dependencias base manualmente..." -ForegroundColor Yellow
    pip install fastapi uvicorn chromadb ollama pdfplumber requests pydantic --quiet
    Write-Host "      ✅ Dependencias base instaladas" -ForegroundColor Green
}

# ----------------------------------------------------------
# PASO 7: Verificar acceso a cámaras Hikvision (LAN local)
# ----------------------------------------------------------
Write-Host ""
Write-Host "[7/7] Verificando acceso a cámaras Hikvision (LAN)..." -ForegroundColor Yellow

# IPs comunes de cámaras Hikvision - ajustar según tu red
$camIPs = @("192.168.1.64", "192.168.1.65", "192.168.1.66", "192.168.1.100", "192.168.1.200")
$found = 0
foreach ($ip in $camIPs) {
    $tc = Test-NetConnection -ComputerName $ip -Port 80 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($tc) {
        Write-Host "      📷 Cámara detectada en $ip`:80 (HTTP/ONVIF)" -ForegroundColor Green
        $found++
    }
    $rtsp = Test-NetConnection -ComputerName $ip -Port 554 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($rtsp) {
        Write-Host "      📷 Stream RTSP detectado en $ip`:554" -ForegroundColor Green
    }
}
# También escanear el NVR en el i5
$nvr = Test-NetConnection -ComputerName "192.168.1.87" -Port 8000 -WarningAction SilentlyContinue -InformationLevel Quiet
if ($nvr) {
    Write-Host "      📹 Visor NVR/Nodo 2 (i5) alcanzable en 192.168.1.87:8000" -ForegroundColor Green
}

if ($found -eq 0) {
    Write-Host "      ⚠️  No se encontraron cámaras en el rango 192.168.1.x" -ForegroundColor Yellow
    Write-Host "         Verificar IPs correctas con: arp -a | findstr 'c0-56' (MAC Hikvision)" -ForegroundColor Yellow
}

# ----------------------------------------------------------
# RESUMEN FINAL
# ----------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   SETUP COMPLETADO - Próximos pasos manuales:" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Iniciar Ollama:" -ForegroundColor White
Write-Host "   ollama serve" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Descargar modelos (si no están):" -ForegroundColor White
Write-Host "   ollama pull llama3.1" -ForegroundColor Gray
Write-Host "   ollama pull nomic-embed-text" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Iniciar la API FastAPI:" -ForegroundColor White
Write-Host "   cd $PROJECT_DIR" -ForegroundColor Gray
Write-Host "   uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Verificar estado:" -ForegroundColor White
Write-Host "   http://localhost:8000/api/chat/status" -ForegroundColor Gray
Write-Host ""
Write-Host "5. (Opcional) Configurar inicio automático con PM2:" -ForegroundColor White
Write-Host "   npm install -g pm2 pm2-windows-startup" -ForegroundColor Gray
Write-Host "   pm2-startup install" -ForegroundColor Gray
Write-Host "   pm2 start `"uvicorn main:app --host 0.0.0.0 --port 8000`" --name AlvarezIA --cwd $PROJECT_DIR" -ForegroundColor Gray
Write-Host "   pm2 save" -ForegroundColor Gray
Write-Host ""
