# 🚨 STATUS DE SESIÓN — 24 de Abril 2026, 17:27 hs

## ✅ PROBLEMAS RESUELTOS

### 1. Sitio alvarezplacas.com.ar caído
- **Causa**: Contenedor `alvarezplacas_web` fue levantado manualmente con `npm run dev` (modo desarrollo) y puerto incorrecto (4325 en vez de 4321), NO desde el compose correcto.
- **Fix**: Se detuvo el contenedor incorrecto y se re-levantó desde `/opt/alvarez_v16/web01/docker-compose.vps.yml` con `docker compose up -d`.
- **Estado**: ✅ ONLINE — producción con `node dist/server/entry.mjs` en puerto 4321.

### 2. Caddy en loop infinito de certificados SSL
- **Causa**: El bloque `minio.alvarezplacas.com.ar` en Caddyfile no tenía registro DNS → Caddy intentaba infinitamente obtener certificado SSL.
- **Fix**: Se removió el bloque de MinIO del archivo `/etc/caddy/sites-enabled/alvarezplacas.com.ar.conf` y se recargó Caddy.
- **Estado**: ✅ Caddy estable. MinIO sigue funcionando internamente — solo se quitó el proxy público.
- **Para restaurar**: Crear registro DNS `minio.alvarezplacas.com.ar → 144.217.163.13` y re-agregar al Caddyfile.

### 3. Base de datos desconectada (datos "perdidos")
- **Causa**: Alguien levantó contenedores desde un compose diferente que usó un volumen nuevo (`site_postgres_data`) en vez del volumen correcto (`web01_alvarez_data_v16`).
- **Fix**: Se detuvieron los contenedores incorrectos (`alvarezplacas_db`, `alvarezplacas_directus`) y se re-levantaron desde el compose correcto.
- **Estado**: ✅ Volumen `web01_alvarez_data_v16` reconectado. Todos los datos previos intactos.

### 4. Login a Directus
- **Causa**: El usuario admin era `admin@example.com` (de la DB vacía temporal). Al reconectar el volumen correcto, `admin@alvarezplacas.com.ar` volvió.
- **Estado**: ✅ Login funciona con `admin@alvarezplacas.com.ar` / `JavierMix2026!`.

### 5. Token API estático
- **Fix**: Se creó/actualizó el token `alvarez-api-token-v16-2026` en la tabla `directus_users`.
- **Estado**: ✅ Funciona — verificado con `curl -H "Authorization: Bearer alvarez-api-token-v16-2026"`.

---

## ⏳ PROBLEMA EN PROGRESO: Flow "Auto Generate SKU"

### Estado actual
- **Flow ID**: `70ed1570-4e8b-4d01-baa6-6f67322f5c77`
- **Operación ID**: `584ce352-805f-4266-8763-b08d59276a7c`
- **Trigger**: Event Hook → Action → items.create → Productos ✅
- **Operación**: Run Script (exec) — tipo `exec` ✅
- **FLOWS_EXEC_ALLOWED_MODULES**: Agregado al compose ✅
- **El flow SE EJECUTA** (confirmado por activity log: `action: "run"`) ✅
- **PERO el SKU queda null** ❌

### Diagnóstico
El flow se triggerea y la operación exec se ejecuta, pero **el código JavaScript falla silenciosamente**. El problema más probable es la **estructura del objeto `data`** dentro del Run Script. Estamos usando:
```javascript
const trigger = data["$trigger"] || data;
const payload = trigger.payload || data.payload || {};
const itemKey = trigger.key || trigger.keys?.[0] || data.key;
```
Pero ninguna de estas rutas funciona porque no conocemos la estructura exacta de `data` en Directus 11.1.0 para una operación exec conectada a un action hook.

### Próximo paso EXACTO para mañana
1. **Agregar logging al script** para descubrir la estructura de `data`:
   ```bash
   curl -s -X PATCH -H "Authorization: Bearer alvarez-api-token-v16-2026" \
     -H "Content-Type: application/json" \
     http://localhost:8055/operations/584ce352-805f-4266-8763-b08d59276a7c \
     -d '{"options":{"code":"module.exports = async function(data) { const fs = require(\"fs\"); fs.writeFileSync(\"/tmp/flow_data.json\", JSON.stringify(data, null, 2)); };"}}' 
   ```
   Luego crear un producto y leer `/tmp/flow_data.json` para ver la estructura REAL.
   
   **NOTA**: Esto requiere `FLOWS_EXEC_ALLOWED_MODULES: "fs"` en el compose.

2. **Alternativa**: Cambiar el enfoque de "exec + services" a usar operaciones Read Data + un exec mínimo que solo calcule (sin usar services). Esto sería más como el PASO 3 del manual (múltiples operaciones encadenadas).

3. **Producto 988 como referencia**: El producto ID 988 tiene `sku: "M-10-0002"` y `descripcion: "Placa EGGER Test Flow Item 18mm MDF"`. Este fue generado por una configuración anterior del flow que SÍ funcionaba. Investigar qué operaciones tenía ese flow viejo.

---

## 📋 Productos de prueba creados (limpiar después)

| ID  | modelo              | sku        | status |
|-----|---------------------|------------|--------|
| 988 | Test Flow Item      | M-10-0002  | ✅ SKU generado (flow viejo) |
| 989 | Roble Vicenza TEST  | null       | ❌ Flow nuevo no funciona |
| 990 | Roble Vicenza TEST2 | null       | ❌ |
| 991 | Roble Vicenza TEST3 | null       | ❌ |
| 992 | TEST FINAL          | null       | ❌ |
| 993 | (desconocido)       | null       | ❌ |
| 994 | SIMPLE TEST         | null       | ❌ |
| 995 | EXEC TEST           | null       | ❌ |
| 996 | ENV TEST            | null       | ❌ |

---

## 🏗️ Infraestructura actual del VPS

### Contenedores Alvarez (desde compose correcto)
| Contenedor | Estado | Puerto |
|---|---|---|
| `alvarezplacas_web` | ✅ Up (producción) | 4321 |
| `alvarezplacas_directus_v16` | ✅ Up | 8055 |
| `alvarezplacas_db_v16` | ✅ Up | interno |
| `alvarezplacas_minio` | ✅ Up (healthy) | 9000 interno |
| `alvarezplacas_meili` | ✅ Up | 7700 interno |

### Caddy (proxy)
- `javiermix_caddy` — ✅ Up, puertos 80/443
- Config: `/etc/caddy/sites-enabled/alvarezplacas.com.ar.conf`
- **Nota**: El bloque `minio.alvarezplacas.com.ar` fue removido (sin DNS). Re-agregar cuando se cree el registro DNS.

### Archivos clave en VPS
| Archivo | Ruta |
|---|---|
| Compose | `/opt/alvarez_v16/web01/docker-compose.vps.yml` |
| Código Astro | `/opt/alvarez_v16/web01/site/web01/` |
| Caddyfile Alvarez | `/etc/caddy/sites-enabled/alvarezplacas.com.ar.conf` |

### Credenciales
| Servicio | Dato |
|---|---|
| Directus Admin | `admin@alvarezplacas.com.ar` / `JavierMix2026!` |
| API Token | `alvarez-api-token-v16-2026` |
| PostgreSQL | `alvarez_admin` / `AlvarezAdmin2026` |
| VPS SSH root | Llave: `alvarez_vps.key` / IP: `144.217.163.13` |

---

## 📝 Pendientes generales
- [ ] **URGENTE**: Arreglar el script del flow (descubrir estructura de `data`)
- [ ] Limpiar productos de prueba (IDs 989-996)
- [ ] Probar subida de imágenes AVIF/MP4 a Directus (MinIO storage)
- [ ] Crear registro DNS para `minio.alvarezplacas.com.ar` y restaurar en Caddy
- [ ] Importación masiva del Excel (~2000 productos)
- [ ] Verificar que `admin.alvarezplacas.com.ar` apunte al container correcto en Caddy (`alvarezplacas_directus_v16` vs `alvarezplacas_directus`)

---

*Generado al cierre de sesión del 24/04/2026 — 17:27 hs (Buenos Aires)*
