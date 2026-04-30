# 🧠 Ayuda Memoria: Contexto Clave para Antigravity

**Actualizado:** 07 de Abril de 2026.

---

## 🏗️ Arquitectura "Web01"
- **Astro 6 (SSR)**: Rendimiento extremo, build obligatorio antes de desplegar.
- **Proxies de Ruta**: `src/pages/` solo importa de `Frontend/` o `Backend/`.
- **Aliasing** (ver `jsconfig.json`):
  - `@home` → `Frontend/home/`
  - `@frontend` → `Frontend/`
  - `@backend` → `Backend/`
  - `@conexiones` → `Backend/conexiones/`
  - `@catalogo` → `Frontend/catalogo/`
  - `@dashboard` → `Backend/dashboard/`
- **Directus CMS**: Motor de datos. Conexión central en `@conexiones/directus.js`.

---

## 🚀 Configuración VPS v16 (Estado Actual)

### Rutas definitivas
| Recurso | Ruta |
|---|---|
| **Compose** | `/opt/alvarez_v16/web01/docker-compose.vps.yml` |
| **Código Astro** | `/opt/alvarez_v16/web01/site/web01/` |
| **Build** | `/opt/alvarez_v16/web01/site/web01/dist/` |
| **BD Volumen** | `web01_alvarez_data_v16` (externo, ¡no tocar!) |

### Contenedores activos
- `alvarezplacas_web` → Puerto 4321
- `alvarezplacas_directus_v16` → Puerto 8055
- `alvarezplacas_db_v16` → Interno

### ⚠️ Regla de Oro de Rutas
- `/opt/javiermix/` → **NO TOCAR** (es javiermix.ar, otro proyecto distinto)
- Todos los proyectos van en `/opt/<proyecto>/`

---

## ✅ Cambios Realizados

### 1. Contacto y Ubicación
- **Dirección Principal**: Av. Vergara y Bradley, Villa Tesei.
- **Recepción Proveedores**: Av. Vergara 1605, Villa Tesei.
- **Google Maps**: Sincronizado con "Alvarez Placas SRL".

### 2. Restauración v16 (Abril 2026)
- **Git Clone**: El código Astro se clona desde `https://github.com/alvarezplacas/alvarezplacas_web.git` en `/opt/alvarez_v16/web01/site/`.
- **Build**: Se compila con `docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "npm install && npm run build"`.
- **DB Recuperada**: Volumen `web01_alvarez_data_v16` con productos intactos.
- **Nombre contenedor web**: Se cambió a `alvarezplacas_web` (sin `_v16`) para compatibilidad con el proxy Caddy.

### 3. Presupuestador (Budget Engine)
- **Marcas**:
  - EGGER: 2600 x 1830 mm
  - FAPLAC: 2750 x 1830 mm
  - SADEPAN: 2820 x 1830 mm
- **Cálculo de Sierra**: Se añaden 3mm perimetrales por pieza.
- **Refilado**: Descuento de 5mm perimetrales (10mm total por eje).
- **Estimaciones**: El sistema calcula placas necesarias y desperdicio. **Leptom** es la fuente oficial.

### 4. Modernización de Catálogo (8 de Abril 2026)
- **Buckets de Navegación**: Se dividió el catálogo en 5 grupos: Tableros, Herrajes, Herramientas, Química y Todo.
- **Ingestión Externa**: Integración de marcas **Einhell** (Herramientas) y **Kekol** (Química) con ingesta automatizada desde sitios oficiales.
- **Deep Sync (V2)**: Script `deep_sync_materials.mjs` que escanea la biblioteca de archivos de Directus y crea productos faltantes (total ~137).
- **Control de Imágenes**: 
  - Entrega vía **AVIF** (parámetro `?format=avif`) usando el motor **Sharp** de Directus.
  - Fallback automático al logo de Alvarez Placas si falla la carga o falta el activo.
- **UI/UX Refactoring**:
  - Filtros de marca dinámicos: Se renderizan botones únicos y se filtran por categoría para evitar duplicados.
  - Fix de Modal: Propiedad `imagen` sincronizada en la lógica del frontend para evitar desaparición de fotos.
- **Lógica de Placas**: El botón "Sugerir Combinación" (Smart Match) es exclusivo para la categoría Tableros.

### 5. Fix de Conectividad S3 y Almacenamiento (30 de Abril 2026)
- **Error Solucionado**: Error `SERVICE_UNAVAILABLE` en la gestión de archivos y fotos rotas en el catálogo.
- **Causa Técnica**: 
    1.  El endpoint de S3 en `docker-compose.vps.yml` usaba una IP interna (`172.19.0.6`) que cambió tras un reinicio.
    2.  MinIO rechaza peticiones si el hostname contiene guiones bajos (`_`), devolviendo `Invalid Request (invalid hostname)`.
- **Solución Aplicada**:
    - Se renombró el servicio y contenedor de MinIO de `alvarezplacas_minio` a `alvarezplacas-minio` (guion medio).
    - Se configuró `STORAGE_S3_ENDPOINT` usando el nombre del servicio: `http://alvarezplacas-minio:9000`.
    - Se activó `STORAGE_S3_FORCE_PATH_STYLE: "true"` para compatibilidad total con MinIO.
- **Sincronización de Imágenes**:
    - Se actualizó el script `scripts/sync_product_images.py` para realizar matching por el campo `Modelo` (insensible a mayúsculas y extensiones), vinculando exitosamente más de 100 imágenes nuevas al catálogo.

---

## 🚨 Reglas de Oro del Proyecto
- **No tocar Dashboards**: Se mantienen aislados en `Backend/dashboard`.
- **SEO & Performance**: Prioridad absoluta en el Frontend Público.
- **Modularidad**: Cada sector tiene sus propias instrucciones en su carpeta.
- **Subidas al VPS**: Siempre via `git pull` en la carpeta `/opt/alvarez_v16/web01/site/`, nunca manualmente.
- **DB**: Nunca borrar el volumen `web01_alvarez_data_v16`.

---

*Ver [`VPS_INFRAESTRUCTURA_V16.md`](./VPS_INFRAESTRUCTURA_V16.md) para el mapa completo del servidor.*
