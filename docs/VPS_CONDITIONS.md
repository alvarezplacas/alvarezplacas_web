# 🛠️ Condiciones Técnicas del VPS (Ubuntu)

Este documento resume las dependencias e infraestructura críticas del servidor para evitar errores 502 Bad Gateway u otros fallos de despliegue.

## 1. Configuración de Astro
El servidor ejecuta la aplicación en modo desarrollo (`npm run dev`) dentro de Docker para permitir actualizaciones en caliente (Hot Reload) vía File Browser.

- **Fase de Red**: Vite bloquea cualquier host que no esté explícitamente autorizado.
- **Solución**: `astro.config.mjs` -> `server.allowedHosts: ['alvarezplacas.com.ar']`.

## 2. Orquestación Docker
El VPS utiliza `docker-compose.vps.yml` para gestionar los servicios:
- **web**: Contenedor con Node 22 Alpine.
- **filebrowser**: Puerto 8081, mapeado a `/home/ubuntu/alvarezplacas_web`.
- **directus**: Gestión de contenidos.
- **alvarezplacas_db**: Base de datos PostgreSQL (Puerto 5433 externo, 5432 interno).

## 3. Seguridad y Accesos
- Se requiere `alvarez_vps.key` para acceso SSH root en casos de emergencia.
- Las contraseñas por defecto en `Backend/conexiones/lib/db.js` y `docker-compose.yml` deben coincidir si no hay un archivo `.env` cargado.

## 4. Rutas en el Servidor
- **Código Vivo**: `/home/ubuntu/alvarezplacas_web/`
- **Volúmenes de Datos**: `/opt/alvarezplacas/`
