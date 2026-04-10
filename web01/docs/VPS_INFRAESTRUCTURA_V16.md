# 🗺️ Infraestructura VPS v16 — Configuración Definitiva
**Último análisis completo:** 07 de Abril de 2026 — 20:50 hs UTC

**Actualizado:** 07 de Abril de 2026 — Post-restauración de emergencia.

---

## 📂 Rutas Definitivas en el VPS

| Recurso | Ruta en el Servidor |
|---|---|
| **Compose Principal** | `/opt/alvarez_v16/web01/docker-compose.vps.yml` |
| **Código Astro (clonado via Git)** | `/opt/alvarez_v16/web01/site/web01/` |
| **Build generado (`dist/`)** | `/opt/alvarez_v16/web01/site/web01/dist/` |
| **Imágenes de Productos (Placas)** | `/opt/alvarezplacas/placas/` |
| **Uploads de Directus** | `/opt/alvarez_v16/web01/uploads/` |
| **Datos PostgreSQL** | Volumen Docker: `web01_alvarez_data_v16` (⚠️ NUNCA borrar) |

> [!CAUTION]
> La carpeta `/opt/javiermix/` pertenece al sitio **javiermix.ar**. NO modificar nada ahí.

---

## 🐳 Contenedores Docker

| Contenedor | Imagen | Puerto | Red |
|---|---|---|---|
| `alvarezplacas_web` | `node:22-alpine` | `4321:4321` | `javiermix_network`, `alvarez_v16_net` |
| `alvarezplacas_directus_v16` | `directus/directus:11.1.0` | `8055:8055` | `javiermix_network`, `alvarez_v16_net` |
| `alvarezplacas_db_v16` | `postgres:16-alpine` | Interno | `alvarez_v16_net` |

### Redes Docker

- `javiermix_network` → **Externa** (compartida con el proxy Caddy del VPS)
- `alvarez_v16_net` → **Interna** (creada por el compose, aisla DB y Directus)

---

## 🔑 Variables de Entorno Clave

```env
# Web (Astro)
PUBLIC_DIRECTUS_URL=https://admin.alvarezplacas.com.ar
DIRECTUS_URL_INTERNAL=http://alvarezplacas_directus_v16:8055
HOST=0.0.0.0
PORT=4321
NODE_ENV=production

# Directus
KEY=alvarez-placas-secret-key-2026
SECRET=alvarez-placas-secret-token-2026
DB_CLIENT=pg
DB_HOST=alvarezplacas_db
DB_DATABASE=alvarezplacas
DB_USER=alvarez_admin
DB_PASSWORD=AlvarezAdmin2026
CORS_ENABLED=true
CORS_ORIGIN=https://alvarezplacas.com.ar,https://www.alvarezplacas.com.ar

# PostgreSQL
POSTGRES_USER=alvarez_admin
POSTGRES_PASSWORD=AlvarezAdmin2026
POSTGRES_DB=alvarezplacas
```

---

## 🔐 Credenciales de Acceso

| Servicio | Usuario | Contraseña |
|---|---|---|
| **Directus Admin** | `admin@alvarezplacas.com.ar` | `JavierMix2026!` |
| **PostgreSQL** | `alvarez_admin` | `AlvarezAdmin2026` |
| **VPS SSH** | `root` | (ver archivo `alvarez_vps.key`) |

---

## 🚀 Comandos de Operación Habitual

### Ver estado de los contenedores

```bash
docker compose -f /opt/alvarez_v16/web01/docker-compose.vps.yml ps
```

### Ver logs de la web

```bash
docker logs alvarezplacas_web --tail 50
```

### Re-deployar después de un `git pull`

```bash
# 1. Actualizar código
cd /opt/alvarez_v16/web01/site
git pull origin main

# 2. Recompilar
cd web01
docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "npm install && npm run build"

# 3. Reiniciar
cd /opt/alvarez_v16/web01
docker compose -f docker-compose.vps.yml restart alvarezplacas_web
```

### Reinicio completo (emergencia)

```bash
cd /opt/alvarez_v16/web01
docker compose -f docker-compose.vps.yml down
docker compose -f docker-compose.vps.yml up -d
```

---

## 📋 Organización de Proyectos en `/opt/`

```
/opt/
├── alvarez_v16/
│   └── web01/
│       ├── docker-compose.vps.yml  ← Compose principal
│       ├── site/
│       │   └── web01/              ← Código Astro (git clone)
│       │       ├── src/
│       │       ├── Frontend/
│       │       ├── Backend/
│       │       ├── dist/           ← Build generado (npm run build)
│       │       └── package.json
│       └── uploads/                ← Imágenes subidas por Directus
│
├── alvarezplacas/
│   └── placas/                     ← Fotos de productos (estáticas)
│
└── javiermix/                      ← ⛔ NO TOCAR (otro proyecto)
    └── web_0504/
```

---

## 🌐 Dominios y Proxy (Caddy)

| Dominio | Destino interno |
|---|---|
| `alvarezplacas.com.ar` | `alvarezplacas_web:4321` |
| `www.alvarezplacas.com.ar` | `alvarezplacas_web:4321` |
| `admin.alvarezplacas.com.ar` | `alvarezplacas_directus_v16:8055` |

El proxy Caddy está corriendo en la red `javiermix_network` y redirige el tráfico a los contenedores por nombre de contenedor.

---

## 🗄️ Base de Datos: Estado Actual

- **Motor**: PostgreSQL 16
- **Volumen**: `web01_alvarez_data_v16` (persistente, externo al compose)
- **Colecciones activas en Directus**: 69 materiales cargados en las colecciones:
  - `materiales` — Productos del catálogo
  - `marcas` — EGGER, FAPLAC, SADEPAN, etc.
  - `categorias` — Aglomerado, MDF, etc.
  - `espesores` — 9mm, 15mm, 18mm, etc.

---

*Documento generado automáticamente por Antigravity tras la restauración de emergencia del 07/04/2026.*
