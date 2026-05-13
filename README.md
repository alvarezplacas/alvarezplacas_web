# 🚀 Alvarez Placas - Proyecto Modular v16 (Mayo 2026)

Este repositorio contiene el ecosistema digital de Alvarez Placas, diseñado bajo una arquitectura modular y sectorizada para máxima eficiencia operativa.

**Estado del Sistema:** ✅ Producción Estable | 📦 Catálogo Sincronizado | 👔 Workspace Vendedores Activo

---

## 🧠 Referencia Técnica Maestro (v16.5)

### 🛠️ El Stack (Core)
- **Framework**: **Astro v6.0.8** (SSR modo `node` standalone).
- **Base de Datos**: **PostgreSQL 16** (Contenedor `alvarezplacas_db_v16`).
- **CMS**: **Directus 11.1.0** (Contenedor `alvarezplacas_directus_v16`).
- **Búsqueda**: **MeiliSearch v1.12** (Búsqueda instantánea de productos).
- **Almacenamiento**: **MinIO (S3)** para activos AVIF y videos optimizados.

### 🌍 Infraestructura VPS
- **Host**: **OVH Cloud** (IP: `144.217.163.13`).
- **Directorios**: 
  - Producción: `/opt/alvarez_v16/web01/site/web01`
  - Docker Compose: `/opt/alvarez_v16/web01/docker-compose.vps.yml`
- **SSL/Proxy**: Gestionado por **Caddy v2** en la red `javiermix_network`.

---

## 🚨 REGLAS CRÍTICAS DE DESARROLLO (LEER OBLIGATORIO)

### 1. Despliegue y Build
Astro **NO compila solo** al reiniciar el contenedor. Para aplicar cambios de código:
1. Subir archivos (vía `git` o `scp`).
2. **Build**: `docker exec alvarezplacas_web npm run build`
3. **Restart**: `docker compose restart alvarezplacas_web`

### 2. Middleware y Seguridad (`src/middleware.ts`)
**NO MODIFICAR** sin autorización. El middleware actual resuelve loops de redirección críticos y gestiona tres carriles de acceso:
- **Superadmin**: `admin@alvarezplacas.com.ar` (Hardcodeado en API).
- **Vendedores**: Redirección automática para dominio `@alvarezplacas.com.ar`.
- **Clientes**: Sesión persistente de 30 días.

### 3. Configuración de Red
`security.checkOrigin` debe ser `false` en `astro.config.mjs` para permitir logins a través del proxy Caddy.

---

## 👔 Módulos Implementados (Mayo 2026)

### 📧 Mensajería y Prioridades
- Canal directo Cliente ↔ Vendedor.
- Notificaciones de prioridad alta (activan parpadeo visual en el dashboard del vendedor).
- Tracking de lectura integrado (`visto: boolean`).

### 🔧 SmartCut PRO v5.6.5
- Motor de optimización industrial con márgenes de sierra (3mm) y refilado (5mm).
- **Login Wall**: Requiere sesión para descargar planos o guardar presupuestos.
- **Integración Directus**: Los presupuestos se guardan automáticamente en la colección `pedidos`.

### 👨‍💼 Workspace de Vendedores (`/vendedor`)
- Gestión de notas rápidas (**QuickNotes**) persistentes.
- Listado de clientes con ruteo inteligente.
- Acceso preferencial corporativo para empleados.

---

## 🚢 Acceso y Credenciales

| Servicio | URL | Usuario | Pass |
|---|---|---|---|
| **Directus Admin** | `https://admin.alvarezplacas.com.ar` | `admin@alvarezplacas.com.ar` | `JavierMix2026!` |
| **PostgreSQL** | `localhost:5433` (vía VPS) | `alvarez_admin` | `AlvarezAdmin2026` |
| **Webmail** | `https://mail.alvarezplacas.com.ar` | — | — |

**Token API Directus**: `alvarez-api-token-v16-2026`

---

## 🏗️ Estructura del Proyecto
- **/src/pages**: Puntos de entrada y API (Astro).
- **/Backend**: Lógica de negocio, dashboards y conexión central Directus.
- **/Frontend**: Experiencia de usuario, catálogo y herramientas.
- **/docs**: Documentación técnica profunda (Ver `AGENTES_IA_REFERENCIA.md`).

---
*Ultima actualización: 13 de Mayo de 2026 por Antigravity (Google Deepmind).*
