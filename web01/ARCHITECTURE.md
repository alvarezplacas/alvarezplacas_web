# Proyecto: Alvarez Placas - Arquitectura Modular Escalable

Este documento sirve como guía para futuros desarrolladores y agentes de IA para entender cómo se gestiona la infraestructura de Alvarez Placas en el VPS compartido.

## 🏗️ Estrategia de Redes (Aislamiento)
Para evitar conflictos de DNS (`EAI_AGAIN`) y asegurar que cada sitio web sea independiente, utilizamos un sistema de **Doble Red**:

1.  **`alvarez_internal` (Privada)**: 
    - Una red de tipo `bridge` creada específicamente para este proyecto.
    - **Servicios**: `alvarezplacas_db` y `alvarezplacas_directus`.
    - **Propósito**: Comunicación segura y ultra-rápida entre la base de datos y el CMS. **No es visible desde el exterior.**

2.  **`javiermix_network` (Pública/Proxy)**:
    - Una red externa compartida por todo el VPS (donde vive Nginx Proxy Manager).
    - **Servicios**: `alvarezplacas_web` y `alvarezplacas_directus`.
    - **Propósito**: Permitir que el Proxy dirija el tráfico de `alvarezplacas.com.ar` y `admin.alvarezplacas.com.ar` a los contenedores.

## 🛠️ Stack Tecnológico y Versiones
Es **CRÍTICO** mantener estas versiones fijas para evitar roturas por actualizaciones automáticas:

| Servicio | Imagen | Puerto Interno | Puerto Host | Notas / Credenciales |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `node:22-alpine` | 4321 | 4325 | Astro SSR con Node Adapter. |
| **CMS** | `directus/directus:11.1.0` | 8055 | 8055 | **Admin**: `admin@alvarezplacas.com.ar` |
| **Base de Datos** | `postgres:15-alpine` | 5432 | 5433 | **Pass**: `AlvarezAdmin2026` |
| **Archivos** | `filebrowser/filebrowser` | 80 | 4326 | Gestiona `/srv` para el catálogo. |

## 🚀 Optimización de Imágenes (AVIF)
El sitio está optimizado para usar **AVIF** (mejor que WebP). 
- El Frontend solicita transformaciones automáticas a Directus usando `?format=avif&width=600&quality=80`.
- Las imágenes subidas por el usuario ya están en formato AVIF para máximo rendimiento.

## ⚠️ Recuperación y Mantenimiento
Si el sitio muestra un error **502 Bad Gateway**, sigue estos pasos en orden:

1.  **Verificar Redes**: Asegúrate de que `javiermix_network` existe (`docker network ls`).
2.  **Logs de Directus**: `docker logs alvarezplacas_directus --tail 50`.
    - Si ves "Access denied for user alvarez_admin", la contraseña en `docker-compose.yml` no coincide con la de la DB persistente en el volumen.
3.  **Reset Limpio**:
    ```bash
    git pull origin main
    docker compose down
    docker compose up -d --build --remove-orphans
    ```

## 🧠 Reglas de Oro para Agentes de IA
1.  **Prefijos**: Todos los contenedores DEBEN empezar con `alvarezplacas_`.
2.  **Aislamiento**: Nunca conectes el contenedor de la base de datos a redes externas. Solo el CMS tiene acceso a ella vía `alvarez_internal`.
3.  **Healthchecks**: El `docker-compose.yml` incluye chequeos de salud (`pg_isready`). **No los elimines**, ya que aseguran que Directus no falle al arrancar si la DB es lenta.
