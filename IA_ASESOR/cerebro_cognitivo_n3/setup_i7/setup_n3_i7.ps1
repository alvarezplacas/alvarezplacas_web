# setup_n3_i7.ps1
# Script de preparación automatizada para el Servidor de Inteligencia i7 (Nodo 3)

# 1. Verificar privilegios de Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (!$isAdmin) {
    Write-Warning "Este script requiere ejecutarse con privilegios de Administrador."
    Write-Warning "Por favor, abra PowerShell como Administrador e inténtelo de nuevo."
    Exit
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " INICIANDO CONFIGURACIÓN DE IA - NODO 3 (i7)              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 2. Verificar Instalación de Python
Write-Host "[*] Verificando entorno Python..." -ForegroundColor Yellow
$pythonCheck = Get-Command python -ErrorAction SilentlyContinue
if (!$pythonCheck) {
    Write-Error "Python no está instalado o no se encuentra en el PATH del sistema."
    Write-Error "Por favor, instale Python (versión 3.9 a 3.12 recomendada) marcando la casilla 'Add Python to PATH' en el instalador."
    Exit
}
Write-Host "[OK] Python detectado: $((python --version 2>&1))" -ForegroundColor Green

# 3. Instalar Dependencias de Python
Write-Host "[*] Instalando dependencias de Python (FastAPI, ChromaDB, Ollama SDK)..." -ForegroundColor Yellow
python -m pip install --upgrade pip
python -m pip install fastapi uvicorn ollama chromadb pydantic requests psycopg2-binary

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Ocurrió un inconveniente al instalar dependencias de Python."
} else {
    Write-Host "[OK] Dependencias de Python instaladas con éxito." -ForegroundColor Green
}

# 4. Descargar e Instalar Ollama de forma silenciosa
$ollamaCheck = Get-Command ollama -ErrorAction SilentlyContinue
if (!$ollamaCheck) {
    Write-Host "[*] Ollama no detectado. Iniciando descarga del instalador..." -ForegroundColor Yellow
    $url = "https://ollama.com/download/OllamaSetup.exe"
    $tempDir = "C:\IA_AlvarezPlacas\tmp"
    if (!(Test-Path $tempDir)) {
        New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    }
    $outFile = Join-Path $tempDir "OllamaSetup.exe"
    
    Write-Host "[*] Descargando OllamaSetup.exe desde $url..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $url -OutFile $outFile
    
    Write-Host "[*] Ejecutando instalador de Ollama en segundo plano (silencioso)..." -ForegroundColor Yellow
    $proc = Start-Process -FilePath $outFile -ArgumentList "/SILENT" -PassThru -Wait
    Write-Host "[OK] Ollama instalado correctamente." -ForegroundColor Green
} else {
    Write-Host "[OK] Ollama ya se encuentra instalado en el sistema." -ForegroundColor Green
}

# 5. Asegurar que Ollama esté en ejecución
Write-Host "[*] Verificando servicio de Ollama..." -ForegroundColor Yellow
$portCheck = Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue
if (!$portCheck) {
    Write-Host "[*] Levantando el host de Ollama..." -ForegroundColor Yellow
    # Lanzar Ollama en segundo plano sin ventana
    Start-Process -FilePath "ollama" -ArgumentList "serve" -NoNewWindow
    # Esperar a que el puerto responda
    $maxAttempts = 12
    $attempt = 1
    while ($attempt -le $maxAttempts) {
        Start-Sleep -Seconds 2
        $portCheck = Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue
        if ($portCheck) {
            Write-Host "[OK] Host de Ollama activo en puerto 11434." -ForegroundColor Green
            break
        }
        Write-Host "  [-] Esperando a Ollama (Intento $attempt de $maxAttempts)..."
        $attempt++
    }
    if (!$portCheck) {
        Write-Error "No se pudo iniciar el host de Ollama de forma automática. Intente ejecutarlo manualmente escribiendo 'ollama serve'."
        Exit
    }
} else {
    Write-Host "[OK] El host de Ollama ya se encuentra en ejecución." -ForegroundColor Green
}

# 6. Descargar Modelos Requeridos
Write-Host "[*] Descargando modelo de inferencia 'llama3' (esto puede tomar varios minutos)..." -ForegroundColor Yellow
ollama pull llama3

Write-Host "[*] Descargando modelo de embeddings 'nomic-embed-text'..." -ForegroundColor Yellow
ollama pull nomic-embed-text

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "¡INSTALACIÓN COMPLETADA CON ÉXITO EN EL NODO 3 (i7)!" -ForegroundColor Green
Write-Host "----------------------------------------------------------" -ForegroundColor Green
Write-Host "Para arrancar la API REST del Cerebro Cognitivo ejecute:" -ForegroundColor White
Write-Host "  python ..\main.py" -ForegroundColor White
Write-Host "O ejecute el archivo 'arrancar_ia.bat' incluido." -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
