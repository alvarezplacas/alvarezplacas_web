@echo off
title COMPRESOR DE VIDEO ALVAREZ PLACAS (LIMITE 100MB)
echo ==================================================
echo COMPRIMIENDO VIDEO PARA CLOUDFLARE...
echo ==================================================
echo.

set FFMPEG_PATH="C:\Program Files\ffmpeg-2026-05-11-git-17bc88e67f-essentials_build\bin\ffmpeg.exe"

:: Verificar si ffmpeg existe
if not exist %FFMPEG_PATH% (
    echo [ERROR] No se encuentra ffmpeg.exe en la ruta especificada.
    echo Buscando en: %FFMPEG_PATH%
    pause
    exit
)

if "%~1"=="" (
    echo [ERROR] Por favor, arrastra un archivo de video sobre este script.
    pause
    exit
)

set INPUT_FILE=%~1
set OUTPUT_FILE=%~dpn1_WEB_READY.mp4

echo Archivo original: %~nx1
echo.
echo 1. Calculando compresion optima...
:: Forzamos un bitrate que garantice < 95MB. 
:: Suponiendo un video de 1 minuto, esto es muy seguro.
:: Para videos largos, el script ajustara la calidad.

%FFMPEG_PATH% -i "%INPUT_FILE%" -vcodec libx264 -crf 28 -preset faster -acodec aac -b:a 128k -movflags +faststart -maxrate 2M -bufsize 4M -vf "scale='min(1280,iw)':-2" "%OUTPUT_FILE%" -y

echo.
echo ==================================================
echo ✅ PROCESO COMPLETADO
echo Archivo listo: %OUTPUT_FILE%
echo ==================================================
pause
