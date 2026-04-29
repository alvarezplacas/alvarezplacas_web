#!/bin/bash

# ==============================================================================
# 🔍 VPS DEEP SCAN SCRIPT (v2026.04.23)
# Propósito: Obtener el contexto real y actual del servidor para Antigravity AI.
# ==============================================================================

# Colores para legibilidad
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   🚀 INICIANDO ESCANEO PROFUNDO DEL VPS          ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. INFORMACIÓN DEL SISTEMA
echo -e "\n${YELLOW}[1] Información del Sistema${NC}"
hostnamectl | grep -E "Static hostname|Operating System|Kernel"
uptime -p
date

# 2. RECURSOS DE HARDWARE
echo -e "\n${YELLOW}[2] Uso de Recursos (Disco y RAM)${NC}"
df -h | grep -E '^/dev/|^Filesystem'
echo "---"
free -h

# 3. RED Y CONECTIVIDAD
echo -e "\n${YELLOW}[3] Interfaces de Red y VPN${NC}"
ip -4 addr show | grep -E 'inet|scope'
echo "---"
if command -v tailscale &> /dev/null; then
    echo "Tailscale: ACTIVO"
    tailscale status | head -n 5
else
    echo "Tailscale: NO INSTALADO"
fi
echo "---"
if command -v wg &> /dev/null; then
    echo "WireGuard: ACTIVO"
    wg show
else
    echo "WireGuard: NO ACTIVO"
fi

# 4. SERVICIOS Y PUERTOS
echo -e "\n${YELLOW}[4] Puertos en Escucha (TCP/UDP)${NC}"
ss -tulnp | grep LISTEN | awk '{print $5, $7}' | sort -u

# 5. DOCKER ECOSYSTEM (CRÍTICO)
echo -e "\n${YELLOW}[5] Estado de Docker${NC}"
if command -v docker &> /dev/null; then
    echo "Contenedores Activos:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo -e "\nRedes Docker:"
    docker network ls --format "table {{.Name}}\t{{.Driver}}"
    echo -e "\nUso de Disco Docker:"
    docker system df
else
    echo -e "${RED}Docker no está instalado o no se puede acceder.${NC}"
fi

# 6. ESTRUCTURA DE DIRECTORIOS (ESTRATEGIA V16/V17)
echo -e "\n${YELLOW}[6] Verificación de Rutas Críticas${NC}"
PATHS=(
    "/opt/alvarez_v16"
    "/opt/alvarez_v17"
    "/opt/javiermix"
    "/etc/caddy"
)

for path in "${PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo -e "${GREEN}[OK]${NC} $path existe."
        ls -F "$path" | head -n 5
    else
        echo -e "${RED}[MISSING]${NC} $path no encontrado."
    fi
done

# 7. LOGS RECIENTES (Últimas 5 líneas de Caddy si existe)
echo -e "\n${YELLOW}[7] Estado de Proxy (Caddy)${NC}"
if systemctl is-active --quiet caddy; then
    echo "Servicio Caddy: RUNNING"
    journalctl -u caddy -n 5 --no-pager
else
    echo "Servicio Caddy: NOT RUNNING or NOT INSTALLED"
fi

echo -e "\n${BLUE}====================================================${NC}"
echo -e "${BLUE}   ✅ ESCANEO COMPLETADO                          ${NC}"
echo -e "${BLUE}====================================================${NC}"
