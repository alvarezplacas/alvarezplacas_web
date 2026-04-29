@echo off
setlocal
echo ==========================================
echo CONECTANDO AL VPS DE ALVAREZ PLACAS (ROOT)
echo ==========================================
echo.
echo IP: 144.217.163.13
echo Usuario: root
echo.
echo Nota: Si te pide contraseña es: JavierMix2026!
echo.

:: Intentamos conectar usando la llave SSH para que sea automatico
ssh -i "%~dp0alvarez_vps.key" root@144.217.163.13

if %errorlevel% neq 0 (
    echo.
    echo [!] Hubo un problema con la llave SSH. 
    echo Intentando conexion estandar...
    ssh root@144.217.163.13
)

pause
