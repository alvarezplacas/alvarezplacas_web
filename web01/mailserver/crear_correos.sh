#!/bin/bash
# Script para crear cuentas de correo en Alvarez Placas VPS
# Uso: chmod +x crear_correos.sh && ./crear_correos.sh

# CONFIGURACIÓN
DOMAIN="alvarezplacas.com.ar"
PASSWORD="Tecno/315" # Contraseña solicitada por el usuario

ACCOUNTS=(
  "info"
  "proveedores"
  "facundo"
  "maru"
  "javier"
  "ariel"
  "braian"
  "franco"
  "fernando"
)

echo "--- Iniciando creación de cuentas para $DOMAIN ---"

for acc in "${ACCOUNTS[@]}"; do
  EMAIL="$acc@$DOMAIN"
  echo "Creando: $EMAIL..."
  docker exec mailserver setup email add "$EMAIL" "$PASSWORD"
done

echo "--- Cuentas creadas exitosamente ---"
echo "--- Generando configuración DKIM ---"
docker exec mailserver setup config dkim

echo "--- PROCESO FINALIZADO ---"
echo "RECUERDA: Cambia las contraseñas individuales en Roundcube o vía CLI."
echo "Los archivos DKIM se generaron en el volumen de configuración."
