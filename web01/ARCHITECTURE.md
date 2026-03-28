# Proyecto: Alvarez Placas - Arquitectura Modular Escalable

Este documento sirve como guía para futuros desarrolladores y agentes de IA para entender cómo se gestiona la infraestructura de Alvarez Placas en el VPS compartido.

## 🏗️ Estrategia de Redes (Aislamiento)
Para evitar conflictos de DNS (`EAI_AGAIN`) y asegurar que cada sitio web sea independiente, utilizamos un sistema de **Doble Red**:

1.  **`alvarez_internal` (Privada)**: 
    - Una red de tipo `bridge` creada específicamente para este proyecto.
    - **Servicios**: `alvarezplacas_db` y `alvarezplacas_directus`.
    - **Propósito**: Comunicación segura y ultra-rápida entre la base de datos y el CMS. No es visible desde el exterior.

2.  **`javiermix_network` (Pública/Proxy)**:
    - Una red externa compartida por todo el VPS (donde vive Nginx Proxy Manager).
    - **Servicios**: `alvarezplacas_web` y `alvarezplacas_directus`.
    - **Propósito**: Permitir que el Proxy dirija el tráfico de `alvarezplacas.com.ar` y `admin.alvarezplacas.com.ar` a los contenedores correspondientes.

## 🛠️ Stack Tecnológico y Versiones
Es **CRÍTICO** mantener estas versiones para evitar roturas:

| Servicio | Imagen | Puerto Interno | Puerto Host | Notas |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `node:22-alpine` | 4321 | 4325 | Astro SSR con Node Adapter. |
| **CMS** | `directus/directus:latest` | 8055 | 8055 | Conectado a Postgres vía `alvarez_internal`. |
| **Base de Datos** | `postgres:15-alpine` | 5432 | 5433 | **IMPORTANTE**: No subir a v16 sin migración manual de datos. |
| **Archivos** | `filebrowser/filebrowser` | 80 | 4326 | Gestiona `/srv` para el catálogo. |

## 🚀 Despliegue y Mantenimiento
Para actualizar el sitio sin romper las redes, usar siempre:
```bash
git pull origin main
docker compose down
docker compose up -d --build --remove-orphans
```

## ⚠️ Reglas de Escalabilidad
1.  **Prefijos**: Todos los contenedores DEBEN empezar con `alvarezplacas_`.
2.  **Aislamiento**: Nunca conectes la base de datos a redes externas. Solo el Frontend y el CMS deben tocar la red del Proxy.
3.  **Logs**: Si ves un error 502, revisa primero `docker logs alvarezplacas_directus`. Casi siempre es un problema de conexión con la DB.
