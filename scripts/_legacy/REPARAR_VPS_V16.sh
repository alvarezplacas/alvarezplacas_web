#!/bash
# 🛠️ Reparación de Directus VPS - Alvarez Placas (Unificación v16)
# Este script debe ejecutarse como ROOT en el VPS.

echo "--------------------------------------------------------"
echo "🛠️ DETENIENDO INSTANCIA OBSOLETA (v15)..."
echo "--------------------------------------------------------"
# Intentamos detener por nombre de contenedor (v15)
docker stop alvarez-backend-directus alvarez-db-pg15 2>/dev/null || true
docker rm alvarez-backend-directus alvarez-db-pg15 2>/dev/null || true

echo "--------------------------------------------------------"
echo "📂 BUSCANDO CONFIGURACIÓN DE CADDY..."
echo "--------------------------------------------------------"
# Buscamos el Caddyfile en rutas comunes
CADDY_PATHS=("/etc/caddy/Caddyfile" "/root/caddy/Caddyfile" "/home/ubuntu/caddy/Caddyfile" "/opt/caddy/Caddyfile")
CONFIG_FOUND=""

for path in "${CADDY_PATHS[@]}"; do
    if [ -f "$path" ]; then
        CONFIG_FOUND="$path"
        break
    fi
done

if [ -z "$CONFIG_FOUND" ]; then
    echo "❌ No se encontró el Caddyfile. Por favor, especifica la ruta si es personalizada."
    exit 1
fi

echo "✅ Caddyfile encontrado en: $CONFIG_FOUND"

echo "--------------------------------------------------------"
echo "🔄 ACTUALIZANDO PROXY A PUERTO 8055 (v16)..."
echo "--------------------------------------------------------"
# Reemplazamos el puerto 8056 (o cualquier otro) por 8055 para el dominio admin.
# Usamos sed para buscar la línea de reverse_proxy para ese dominio.
# NOTA: Esto asume una estructura estándar de Caddyfile.
sed -i 's/reverse_proxy localhost:8056/reverse_proxy localhost:8055/g' "$CONFIG_FOUND"
sed -i 's/reverse_proxy alvarez_directus:8055/reverse_proxy localhost:8055/g' "$CONFIG_FOUND"

# Reiniciamos Caddy
systemctl restart caddy || docker restart caddy || echo "⚠️ Reinicia Caddy manualmente para aplicar cambios."

echo "--------------------------------------------------------"
echo "🛡️ CORRIGIENDO PERMISOS DE SUBIDA (UPLOADS)..."
echo "--------------------------------------------------------"
UPLOADS_PATH="/home/ubuntu/prod/alvarezplacas_web/web01/uploads"
if [ -d "$UPLOADS_PATH" ]; then
    chown -R 1000:1000 "$UPLOADS_PATH"
    chmod -R 775 "$UPLOADS_PATH"
    echo "✅ Permisos corregidos en: $UPLOADS_PATH"
else
    echo "⚠️ No se encontró la carpeta uploads en $UPLOADS_PATH"
fi

echo "--------------------------------------------------------"
echo "🚀 PROCESO COMPLETADO"
echo "Verifica ahora en: https://admin.alvarezplacas.com.ar"
echo "--------------------------------------------------------"
