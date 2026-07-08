@echo off
:: ============================================================
:: EJECUTAR EN LA PC i7 (Nodo 3) como Administrador
:: Configura el acceso a Alvarezplacas y arranca la IA
:: ============================================================

title Nodo 3 i7 - Setup AlvarezPlacas IA

echo.
echo ============================================================
echo    NODO 3 - CEREBRO COGNITIVO (i7)
echo    Alvarez Placas - Setup Completo
echo ============================================================
echo.

:: --- PASO 1: Crear directorios en D: ---
echo [1/6] Creando estructura de directorios en D:\...
if not exist "D:\IA_AlvarezPlacas\cerebro_cognitivo_n3" mkdir "D:\IA_AlvarezPlacas\cerebro_cognitivo_n3"
if not exist "D:\IA_AlvarezPlacas\chroma_db" mkdir "D:\IA_AlvarezPlacas\chroma_db"
echo       OK: Directorios creados en D:\IA_AlvarezPlacas\
echo.

:: --- PASO 2: Mapear carpeta de codigo del Nodo 4 (MarketingPost) ---
echo [2/6] Conectando a carpeta de codigo de MarketingPost (100.106.57.3)...
net use A: \\100.106.57.3\Alvarezplacas_2026 /persistent:yes 2>nul
if %errorlevel%==0 (
    echo       OK: Unidad A: mapeada a \\100.106.57.3\Alvarezplacas_2026
) else (
    echo       ADVERTENCIA: No se pudo mapear automaticamente.
    echo       Ejecutar manualmente: net use A: \\100.106.57.3\Alvarezplacas_2026
    echo       Si pide usuario/clave, usar el usuario Windows de MarketingPost.
)
echo.

:: --- PASO 3: Copiar codigo actualizado ---
echo [3/6] Copiando codigo actualizado al proyecto local...
if exist "A:\WEB-alvarezplacas_astro\Alvarezplacas\IA_ASESOR\cerebro_cognitivo_n3\main.py" (
    copy /Y "A:\WEB-alvarezplacas_astro\Alvarezplacas\IA_ASESOR\cerebro_cognitivo_n3\main.py" "D:\IA_AlvarezPlacas\cerebro_cognitivo_n3\main.py"
    copy /Y "A:\WEB-alvarezplacas_astro\Alvarezplacas\IA_ASESOR\cerebro_cognitivo_n3\rag_engine.py" "D:\IA_AlvarezPlacas\cerebro_cognitivo_n3\rag_engine.py"
    copy /Y "A:\WEB-alvarezplacas_astro\Alvarezplacas\IA_ASESOR\cerebro_cognitivo_n3\requirements.txt" "D:\IA_AlvarezPlacas\cerebro_cognitivo_n3\requirements.txt"
    echo       OK: main.py, rag_engine.py, requirements.txt copiados
) else (
    echo       INFO: No se pudo acceder via red. Usando archivos locales si existen.
)
echo.

:: --- PASO 4: Instalar dependencias Python ---
echo [4/6] Instalando dependencias Python...
pip install fastapi uvicorn chromadb ollama pdfplumber requests pydantic --quiet
echo       OK: Dependencias instaladas
echo.

:: --- PASO 5: Configurar variables de entorno ---
echo [5/6] Configurando variables de entorno...
setx CHROMA_PATH "D:\IA_AlvarezPlacas\chroma_db" /M
setx OLLAMA_HOST "0.0.0.0:11434" /M
setx OLLAMA_MODEL "llama3.1" /M
setx OLLAMA_EMBED_MODEL "nomic-embed-text" /M
echo       OK: Variables de entorno configuradas
echo.

:: --- PASO 6: Iniciar Ollama y descargar modelos ---
echo [6/6] Iniciando Ollama y descargando modelos...
start /B ollama serve
timeout /t 5 /nobreak > nul
echo       Descargando llama3.1 (puede tardar varios minutos la primera vez)...
ollama pull llama3.1
echo       Descargando nomic-embed-text...
ollama pull nomic-embed-text
echo       OK: Modelos listos
echo.

:: --- ARRANCAR LA API ---
echo ============================================================
echo    Iniciando servidor FastAPI en puerto 8000...
echo    Acceso desde la red: http://100.x.x.I7:8000
echo    Acceso local:        http://localhost:8000
echo    Docs:                http://localhost:8000/docs
echo ============================================================
echo.
cd /d "D:\IA_AlvarezPlacas\cerebro_cognitivo_n3"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
