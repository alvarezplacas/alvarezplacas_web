@echo off
echo Conectando al VPS de Alvarez Placas...
ssh -i "%~dp0alvarez_vps.key" ubuntu@144.217.163.13
pause
