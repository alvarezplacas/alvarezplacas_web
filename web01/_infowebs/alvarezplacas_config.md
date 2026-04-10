# 🏗️ Configuración Maestra: Alvarez Placas v16

Este archivo describe la estructura técnica de **Alvarez Placas** para su correcta convivencia en el VPS.

## 🛠️ Stack Tecnológico
- **Frontend**: Astro 6 (SSR) - Puerto `4321`.
- **Backend/CMS**: Directus 11 (Node.js) - Puerto `8055`.
- **Base de Datos**: PostgreSQL 16.
- **Búsqueda**: Meilisearch v1.12.
- **Almacenamiento**: MinIO (S3 Compatible).

## 📂 Ubicación de Componentes y Datos
- **Código y Configuración**: `/opt/alvarez_v16/web01/`
- **Volúmenes de Datos (Críticos)**:
    - `web01_alvarez_data_v2`: Base de Datos Postgres.
    - `web01_alvarez_meili_data`: Índices de búsqueda.
    - `web01_alvarez_minio_data`: Todos los Assets (Fotos/Videos).
- **Subdominios asociados**:
    - `alvarezplacas.com.ar`
    - `admin.alvarezplacas.com.ar`
    - `minio.alvarezplacas.com.ar`

## 🕸️ Cableado de Red
- Red Externa Proxy: `javiermix_network` (Conectado a Caddy).
- Red Privada Interna: `alvarez_prod_private_net` (Aisla DB y storage).

---
*Si eres un agente IA y estás configurando OTRO sitio web, por favor lee `SECURITY_PROMPT_FOR_AI_AGENTS.md` antes de continuar.*
