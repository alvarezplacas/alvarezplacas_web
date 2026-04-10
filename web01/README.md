# 🚀 Alvarez Placas - Web Modular (web01)

Sito web oficial de1.  **`alvarez_prod_private_net` (Privada)**: 
    - Una red de tipo `bridge` interna del proyecto.
    - **Servicios**: `alvarezplacas_db`, `alvarezplacas_meili`, `alvarezplacas_minio`.
    - **Propósito**: Comunicación segura y ultra-rápida entre el backend y el CMS. **No es visible desde el exterior.**
squeleto modular, el sistema de proxies y la lógica de conexiones con Directus v16, consulta la guía maestra:
👉 [**Guía Arquitectónica Web01**](./docs/ARQUITECTURA_WEB01_PEDAGOGICA.md)

---

## 🛠️ Tecnologías y Módulos
- **Astro (SSR)** en modo `web01`.
- **Tailwind CSS** para un diseño premium y reactivo.
- **Directus 11.1.0** con **PostgreSQL 16.2** (API-First).
- **NanoStores** para gestión de estado en herramientas interactivas.

## 📁 Estructura del Proyecto
- `/src/pages/`: Proxies de ruta (mantener ligeros).
- `/Frontend/`: Todo el UI y lógica visual.
- `/Backend/`: Conexiones, Dashboards y lógica de negocio pesada.

## 👨‍💻 Desarrollo Local
Para correr este proyecto en tu máquina y que funcione con la data real de Alvarez Placas:

1. **Clona| Servicio | Imagen | Puerto Interno | Puerto Host | Notas / Credenciales |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `node:22-alpine` | 4321 | 4321 | Astro SSR con Node Adapter. |
| **CMS** | `directus/directus:11.1.0` | 8055 | 8055 | **Admin**: `admin@alvarezplacas.com.ar` |
| **Base de Datos** | `postgres:16-alpine` | 5432 | 5433 | **Pass**: `AlvarezAdmin2026` |
| **Búsqueda** | `meilisearch:v1.12` | 7700 | 7700 | Motor de búsqueda ultra-rápido. |
| **Storage (S3)** | `minio/minio` | 9000/9001 | 9000/9001 | Almacenamiento de assets. |
st:4321).

## 🚢 Despliegue en VPS (v16 - PRODUCCIÓN)
El despliegue se realiza mediante Docker en el aislamiento `/opt/alvarez_v16/`. 
> [!IMPORTANT]
> **LA VERSIÓN 15 HA SIDO ELIMINADA**. No intentes levantar servicios con imágenes de Postgres 15 ni volúmenes v2.

1. `git pull origin main`
2. `docker compose -f docker-compose.vps.yml down`
3. `docker compose -f docker-compose.vps.yml up -d`
4. Ingesta (si es necesario): `docker exec -it alvarezplacas_web node scripts/ingest_full_catalog_v16.mjs`

---
*Mantenido por el Agente Antigravity - Versión Final v16 - Abril 2026*
