#!/bin/bash
# 🚀 Alvarez Placas - VPS Deployer (Clean Install /opt/)
# Propietario: Agente Antigravity

set -e

echo "--------------------------------------------------------"
echo "🛠️ Preparando Instalación Limpia de Directus + PG15..."
echo "--------------------------------------------------------"

# 1. Crear estructura de carpetas
mkdir -p /opt/alvarezplacas/directus
mkdir -p /opt/alvarezplacas/database_data
mkdir -p /opt/alvarezplacas/uploads

# 2. Permisos
chmod -R 775 /opt/alvarezplacas
chown -R root:root /opt/alvarezplacas

# 3. Escribir el nuevo docker-compose.yml
cat <<EOF > /opt/alvarezplacas/directus/docker-compose.yml
services:
  alvarez_db:
    image: postgres:15-alpine
    container_name: alvarez-db-pg15
    restart: unless-stopped
    environment:
      POSTGRES_USER: alvarez_admin
      POSTGRES_PASSWORD: AlvarezAdmin2026
      POSTGRES_DB: alvarezplacas
    volumes:
      - /opt/alvarezplacas/database_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U alvarez_admin -d alvarezplacas"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - alvarez_internal

  alvarez_directus:
    image: directus/directus:11.1.0
    container_name: alvarez-backend-directus
    restart: unless-stopped
    ports:
      - "8056:8055"
    environment:
      KEY: "alvarez-placas-secret-key-2026"
      SECRET: "alvarez-placas-secret-token-2026"
      DB_CLIENT: "pg"
      DB_HOST: "alvarez_db"
      DB_PORT: "5432"
      DB_DATABASE: "alvarezplacas"
      DB_USER: "alvarez_admin"
      DB_PASSWORD: "AlvarezAdmin2026"
      ADMIN_EMAIL: "admin@alvarezplacas.com.ar"
      ADMIN_PASSWORD: "JavierMix2026!"
      CACHE_ENABLED: "true"
      CACHE_STORE: "memory"
      STORAGE_LOCATIONS: "local"
      STORAGE_LOCAL_ROOT: "/opt/alvarezplacas/uploads"
    depends_on:
      alvarez_db:
        condition: service_healthy
    networks:
      - alvarez_internal
      - javiermix_network

networks:
  alvarez_internal:
    driver: bridge
  javiermix_network:
    external: true
EOF

echo "✅ docker-compose.yml generado en /opt/alvarezplacas/directus/"

# 4. Levantar Servicios
cd /opt/alvarezplacas/directus
docker compose down || true
docker compose up -d

echo "--------------------------------------------------------"
echo "🚀 SISTEMA DESPLEGADO EN PUERTO 8056"
echo "--------------------------------------------------------"
echo "Paso Siguiente: Configura Nginx Proxy Manager para apuntar"
echo "admin.alvarezplacas.com.ar al puerto 8056."
echo "--------------------------------------------------------"
