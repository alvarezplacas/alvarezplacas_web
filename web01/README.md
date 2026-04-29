# 🚀 🚨 INFRAESTRUCTURA CRÍTICA: SERVIDOR DE CORREO (ALVAREZ PLACAS)

> **MANDATO PRINCIPAL:** Los servicios de correo deben estar **SIEMPRE EN LÍNEA**. El servidor de correo es independiente del desarrollo del sitio web y Directus. **NO TOCAR NI MODIFICAR** esta carpeta sin protocolos de respaldo previos.

## 🛡️ Protocolo de Supervivencia del Correo
1. **Aislamiento:** El correo vive en `/opt/alvarez_v16/web01/site/mailserver/`. Sus contenedores no dependen de la actualización de la web.
2. **Testeos Obligatorios:** Se debe verificar el funcionamiento de envío y recepción en `https://mail.alvarezplacas.com.ar` de forma periódica.
3. **Persistencia Extrema:** Los volúmenes `docker-data` y `snappymail-data` contienen los años de trabajo de los empleados. Son intocables.

---

# 🚀 Alvarez Placas — Web Modular (web01)

> Sitio web oficial de Alvarez Placas | Stack: Astro v6 + Directus v11 + PostgreSQL 16  
> Última actualización: Abril 2026 — v16 Estable

---

## 🗺️ MAPA ESTRUCTURA VPS (Verificado v16)

Para evitar errores de despliegue, esta es la ubicación exacta de los archivos en el servidor `144.217.163.13`:

*   **Raíz del Proyecto**: `/opt/alvarez_v16/web01/`
*   **Docker Compose**: `/opt/alvarez_v16/web01/docker-compose.vps.yml`
*   **Repositorio Git (Astro)**: `/opt/alvarez_v16/web01/site/web01/` ⬅️ *Hacer git pull aquí*
*   **Datos PostgreSQL**: `/opt/alvarez_v16/web01/pgdata/`
*   **Archivos Multimedia (Fotos)**: `/opt/alvarezplacas/placas/`
*   **Configuración Directus**: `/opt/alvarezplacas/config/`

---

## 🚀 Guía de Despliegue Rápido
Si hay conflictos de Git en el VPS, ejecutar:
```bash
cd /opt/alvarez_v16/web01/site/web01
git fetch origin
git reset --hard origin/main
cd /opt/alvarez_v16/web01
docker compose -f docker-compose.vps.yml restart alvarezplacas_web
```

---

## 🌐 Arquitectura de Red y Conexiones (CRÍTICO)

Esta sección documenta cómo están conectados todos los servicios. **Leer antes de hacer cualquier cambio.**

### Diagrama de Red

```
INTERNET
   │
   ▼
[Caddy v2] ← proxy SSL en javiermix_network
   │
   ├── admin.alvarezplacas.com.ar → [alvarezplacas_directus:8055]
   └── alvarezplacas.com.ar       → [alvarezplacas_web:4321]
          │
          │ (Solicita datos SSR en cada petición)
          ▼
   [alvarezplacas_directus:8055]  ← CMS / API REST
          │
          ▼
   [alvarezplacas_db:5432]        ← PostgreSQL 16
```

### Redes Docker

| Red | Tipo | Quién está | Propósito |
|---|---|---|---|
| `javiermix_network` | Externa (compartida) | Caddy, alvarezplacas_web, alvarezplacas_directus | Tráfico público via proxy SSL |
| `alvarez_prod_private_net` | Bridge interna | alvarezplacas_db, alvarezplacas_directus, alvarezplacas_meili, alvarezplacas_minio | Comunicación privada entre servicios. No expuesta al exterior |

> [!IMPORTANT]
> El contenedor `alvarezplacas_web` está en **AMBAS** redes: necesita la pública para servir el sitio web y la privada para llamar directamente a Directus sin pasar por internet.

---

## 🔌 Cómo se Conecta el Frontend con Directus

### URL de Conexión (Dual)

El frontend Astro usa **dos URLs** según el contexto:

| Variable | Valor | Cuándo se usa |
|---|---|---|
| `DIRECTUS_URL_INTERNAL` | `http://alvarezplacas_directus:8055` | **Producción VPS** — SSR dentro de Docker (más rápido, sin SSL) |
| `PUBLIC_DIRECTUS_URL` | `https://admin.alvarezplacas.com.ar` | Fallback y uso público desde el browser |

### Lógica de Selección (Backend/conexiones/directus.js)
```js
// Prioridad: interna Docker → variable de entorno → URL pública
const DIRECTUS_URL = process.env.DIRECTUS_URL_INTERNAL 
                  || env.DIRECTUS_URL 
                  || 'https://admin.alvarezplacas.com.ar';
```

### Token de Autenticación
- **Token activo**: `U_49a1I4EcNofowltd95z0MwlUdJ8VgW`
- **Usuario**: Frontend User (Rol "Rol Frontend" en Directus)
- **Permisos**: Lectura en `Productos`, `marcas`, `categorias`, `espesores`, `vendedores`, `sucursales`, `site_settings`

> [!WARNING]
> Si el token cambia en Directus, hay que actualizarlo en dos lugares:
> 1. `Backend/conexiones/directus.js` (línea con `DIRECTUS_TOKEN`)
> 2. En el VPS: `sed -i "s/TOKEN_VIEJO/TOKEN_NUEVO/g" /opt/alvarez_v16/web01/site/web01/Backend/conexiones/directus.js`
> 3. Luego reiniciar: `docker compose -f docker-compose.vps.yml restart alvarezplacas_web`

---

## 🗄️ Base de Datos PostgreSQL 16

| Parámetro | Valor |
|---|---|
| Host (interno) | `alvarezplacas_db` |
| Puerto interno | `5432` |
| Puerto host VPS | `5433` |
| Base de datos | `alvarezplacas` |
| Usuario | `alvarez_admin` |
| Contraseña | `AlvarezAdmin2026` |
| Volumen persistente | `web01_alvarez_data_v16` |

> [!CAUTION]
> El volumen `web01_alvarez_data_v16` contiene TODOS los datos. **Nunca hacer `docker volume rm`** sin backup previo.

---

## 🛡️ Credenciales y Accesos

| Servicio | URL | Usuario | Contraseña |
|---|---|---|---|
| Panel Directus | `https://admin.alvarezplacas.com.ar` | `admin@alvarezplacas.com.ar` | `JavierMix2026!` |
| PostgreSQL (desde VPS) | `localhost:5433` | `alvarez_admin` | `AlvarezAdmin2026` |
| VPS SSH | `root@144.217.163.13` | `root` | `Tecno/121212` |
| MinIO (Storage S3) | `https://minio.alvarezplacas.com.ar` | `AlvarezMinioUser2026` | `AlvarezMinioSecret2026!` |

---

## 🛠️ Stack de Tecnologías

- **Framework**: Astro v6 (modo SSR con `@astrojs/node`)
- **CMS/API**: Directus 11.1.0
- **Base de Datos**: PostgreSQL 16 (Alpine)
- **Proxy SSL**: Caddy v2
- **Búsqueda**: Meilisearch v1.12
- **Storage**: MinIO (S3 compatible)
- **Orquestación**: Docker Compose (`docker-compose.vps.yml`)

---

## 📁 Estructura del Proyecto

```
web01/
├── src/pages/          ← Proxies de ruta (mantener ligeros)
├── Frontend/           ← UI, catálogo, componentes visuales
│   └── catalogo/
│       └── CatalogGrid.astro  ← Grilla principal del catálogo
├── Backend/            ← Lógica de negocio y conexiones
│   └── conexiones/
│       └── directus.js        ← Cliente Directus (token + URL)
├── database/           ← CSVs de ingesta de productos
│   ├── catalogo_01.csv        ← Fuente activa (69 productos)
│   ├── grupo_1_tableros.csv   ← Nuevo criterio (v2, en prueba)
│   └── ...
├── scripts/
│   └── ingest_full_catalog_v16.mjs  ← Script de ingesta
├── docs/
│   └── CRITERIO_CODIGOS_EN_DESARROLLO.md  ← Nuevo sistema de códigos
└── docker-compose.vps.yml     ← Configuración de producción
```

---

## 🚢 Operaciones en el VPS

### Directorio de trabajo en VPS
```
/opt/alvarez_v16/web01/site/web01/
```

### Comandos más usados

```bash
# Ver estado de todos los contenedores
docker compose -f docker-compose.vps.yml ps

# Ver logs del frontend (últimas 50 líneas)
docker logs alvarezplacas_web --tail 50

# Ver logs de Directus
docker logs alvarezplacas_directus --tail 50

# Reiniciar solo el frontend (cuando se cambia código)
docker compose -f docker-compose.vps.yml restart alvarezplacas_web

# Reconstruir el frontend completo (cuando cambia código fuente)
docker compose -f docker-compose.vps.yml up -d --build alvarezplacas_web

# Forzar rebuild manual (ver logs de compilación)
docker exec -it alvarezplacas_web npm run build

# Ingestar productos desde CSV
docker exec -it alvarezplacas_web node scripts/ingest_full_catalog_v16.mjs

# Limpiar caché de Directus
curl -X POST http://localhost:8055/utils/cache/clear
```

### Sincronizar archivo modificado desde PC al VPS

```powershell
# Desde PowerShell en el PC local (carpeta web01)
scp -i ..\alvarez_vps.key Backend\conexiones\directus.js root@144.217.163.13:/opt/alvarez_v16/web01/site/web01/Backend/conexiones/directus.js

# O con contraseña (sin key):
scp Backend\conexiones\directus.js root@144.217.163.13:/opt/alvarez_v16/web01/site/web01/Backend/conexiones/directus.js
# Contraseña: Tecno/121212
```

---

## 🔧 Solución de Problemas Comunes

### ❌ Error 401 — Invalid user credentials
**Causa**: El token del frontend expiró o fue eliminado en Directus.  
**Solución**:
1. Ir a `admin.alvarezplacas.com.ar` → Settings → Users → Frontend User
2. Regenerar token y copiarlo
3. En VPS: `sed -i "s/TOKEN_VIEJO/TOKEN_NUEVO/g" /opt/.../Backend/conexiones/directus.js`
4. `docker compose -f docker-compose.vps.yml restart alvarezplacas_web`

### ❌ Error 403 — Forbidden
**Causa**: El rol "Rol Frontend" no tiene permiso de lectura en alguna colección.  
**Solución**:
1. `admin.alvarezplacas.com.ar` → Settings → Reglas de Acceso → Frontend Regla
2. Agregar la colección faltante con acción **Leer**

### ❌ Catálogo vacío (0 productos)
**Causa**: Falla silenciosa en la conexión SSR.  
**Diagnóstico**:
```bash
docker logs alvarezplacas_web --tail 30 | grep -E "401|403|Error|Fetched"
```

### ❌ Directus no arranca (unhealthy)
**Causa**: PostgreSQL tarda en iniciar.  
**Solución**:
```bash
docker compose -f docker-compose.vps.yml restart alvarezplacas_directus
```

### ❌ Error al hacer `scp` desde Windows
**Causa**: La llave SSH no se encuentra o tiene permisos incorrectos.  
**Alternativa**: Usar directamente la contraseña `Tecno/121212` cuando pida autenticación.

### ❌ No se pueden subir archivos/imágenes a Directus
**Error**: `[SERVICE_UNAVAILABLE] Service "files" is unavailable. Couldn't save file...`  
**Causa**: El bucket `alvarez-assets` no existe en MinIO. Ocurre cuando el contenedor MinIO se reinicia desde cero o en un deploy nuevo.  
**Solución** (ejecutar una sola vez por ambiente):
```bash
docker exec alvarezplacas_minio sh -c "
  mc alias set local http://localhost:9000 AlvarezMinioUser2026 AlvarezMinioSecret2026! &&
  mc mb --ignore-existing local/alvarez-assets &&
  mc anonymous set download local/alvarez-assets &&
  echo 'Bucket listo'
"
docker compose -f docker-compose.vps.yml restart alvarezplacas_directus
```
> [!IMPORTANT]
> Este comando es **idempotente** (`--ignore-existing`): si el bucket ya existe, no lo borra. Es seguro correrlo en cualquier momento.

---

## 📦 Ingesta de Datos

### Sistema actual (activo en producción)
- **Fuente**: `web01/database/Catalogo_de_productos.xlsx`
- **Script**: `scripts/import_catalog.py`
- **Colección Directus**: `Productos`

### Sistema nuevo (en desarrollo, NO en producción)
- Ver: `docs/CRITERIO_CODIGOS_EN_DESARROLLO.md`
- Archivos: `database/grupo_1_tableros.csv` al `grupo_5_herramientas.csv`

---

> [!NOTE]
> **Para el agente IA**: El token de Directus para el frontend es `U_49a1I4EcNofowltd95z0MwlUdJ8VgW`. 
> Si los productos no aparecen en el catálogo, el primer diagnóstico es siempre revisar los logs del contenedor `alvarezplacas_web` buscando errores 401 o 403.

---

*Documentación actualizada: Abril 2026 — Alvarez Placas v16 Estable*
