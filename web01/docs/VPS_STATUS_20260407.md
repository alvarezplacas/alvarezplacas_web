# 📊 Estado del VPS — Sesión del 07/04/2026

Análisis completo ejecutado al final de la sesión de recuperación de emergencia.

---

## ✅ Aplicaciones Activas y Funcionando

### 🟢 Alvarez Placas (alvarezplacas.com.ar)

| Componente | Contenedor | Estado | Observaciones |
|---|---|---|---|
| **Web (Astro 6)** | `alvarezplacas_web` | ✅ Activo | Puerto 4321, sin 502 |
| **CMS (Directus v11)** | `alvarezplacas_directus_v16` | ✅ Activo | Puerto 8055, Productos normalizados |
| **Base de Datos** | `alvarezplacas_db_v16` | ✅ Activo | PostgreSQL 16, datos recuperados |

**URLs:**
- Web: https://alvarezplacas.com.ar ✅
- Admin CMS: https://admin.alvarezplacas.com.ar ✅
- Catálogo: https://alvarezplacas.com.ar/catalogo ⚠️ (web carga, productos pendientes de verificar)

---

### 🟢 Javiermix.ar

| Componente | Contenedor | Estado |
|---|---|---|
| **Web** | `javiermix_web` | ✅ Activo (7h) |
| **Base de Datos** | `javiermix_db` | ✅ Activo (7h) |
| **Redis** | `javiermix_redis` | ✅ Activo (7h) |
| **Estadísticas** | `javiermix_stats` | ✅ Activo (44h) |
| **Archivos** | `javiermix_files` | ✅ Activo (2 días) |

---

### 🟢 Infraestructura Compartida

| Componente | Contenedor | Estado |
|---|---|---|
| **Proxy (Caddy)** | `javiermix-caddy` | ✅ Activo, puertos 80 y 443 |
| **Servidor de Mail** | `mailserver` | ✅ Activo (2 días) |
| **Webmail (SnappyMail)** | `snappymail` | ✅ Activo (2 días) |

---

## ⚠️ Problemas Detectados

### 🔴 Crítico
| Problema | Contenedor | Acción Requerida |
|---|---|---|
| **Directus de Javiermix en crash loop** | `javiermix_directus` | `docker logs javiermix_directus --tail 50` para diagnosticar |

> [!WARNING]
> El `javiermix_directus` lleva un tiempo en crash loop (`Restarting (1)`). Esto puede estar afectando funcionalidad de javiermix.ar que dependa del CMS. Hay que revisarlo en la próxima sesión.

---

### 🟡 Pendiente de Verificar
| Problema | Estado |
|---|---|
| **Catálogo de productos** | Web carga sin 502, pero los productos aún no se ven. Token de API creado y configurado. Falta verificar en el browser. |

---

## 🛠️ Lo Que Hicimos Hoy

### 1. Recuperación de Base de Datos
- ✅ Reconectamos el volumen `web01_alvarez_data_v16` al contenedor de Directus
- ✅ Los productos del catálogo están intactos
- ✅ Directus v16 arranca correctamente con la base de datos recuperada

### 2. Despliegue del Frontend
- ✅ Identificamos que el código Astro estaba en GitHub: `https://github.com/alvarezplacas/alvarezplacas_web.git`
- ✅ Clonamos en `/opt/alvarez_v16/web01/site/`
- ✅ Build exitoso con `npm run build` vía Docker
- ✅ Contenedor web arrancando correctamente en puerto 4321

### 3. Fix del Token de API
- ✅ Token estático creado en Directus v16: `alvarez-api-token-v16-2026`
- ✅ Token inyectado en el contenedor web vía variable de entorno `DIRECTUS_TOKEN`
- ✅ Contenedor web relanzado con el nuevo token

### 4. Documentación
- ✅ Creado `VPS_INFRAESTRUCTURA_V16.md` con toda la configuración
- ✅ Creado `VPS_STATUS_20260407.md` con estado de aplicaciones
- ✅ Actualizados `VPS_CONDITIONS.md`, `AYUDA_MEMORIA_ANTIGRAVITY.md`, `Plan_pendiente.md`

---

## 📋 Tareas Pendientes (Próxima Sesión)

### Alta Prioridad
- [ ] **Verificar catálogo**: Abrir https://alvarezplacas.com.ar/catalogo y confirmar que los 69 productos aparecen
- [ ] **Diagnosticar `javiermix_directus`**: Revisar por qué está en crash loop y arreglarlo
  ```bash
  docker logs javiermix_directus --tail 50
  ```

### Media Prioridad
- [ ] **Permisos públicos Directus**: Verificar que el rol "Público" tiene acceso de lectura a `Productos`, `marcas`, `categorias`, `espesores`
  - Script disponible: `scripts/fix_public_permissions_es.mjs`
- [ ] **Limpiar volúmenes huérfanos**: Hay ~60 volúmenes sin nombre (hashes) que pueden ser basura
  ```bash
  docker volume prune
  ```
- [ ] **Deploy workflow**: Actualizar `scripts/upload_to_vps.bat` para que el git push + pull + rebuild sea automático

### Baja Prioridad
- [ ] **Banner de fechas especiales**: Crear colección `fechas_especiales` en Directus para mensajes de feriados
- [ ] **Limpiar red `web01_alvarez_prod_private_net`**: Parece ser una red obsoleta de la v15, puede borrarse

---

## 🔑 Credenciales Clave (Para la Próxima Sesión)

| Servicio | Dato |
|---|---|
| Directus Admin | `admin@alvarezplacas.com.ar` / `JavierMix2026!` |
| PostgreSQL | `alvarez_admin` / `AlvarezAdmin2026` |
| API Token estático | `alvarez-api-token-v16-2026` |
| Compose principal | `/opt/alvarez_v16/web01/docker-compose.vps.yml` |
| Código Astro | `/opt/alvarez_v16/web01/site/web01/` |
| Actualizar código | `cd /opt/alvarez_v16/web01/site && git pull origin main` |

---

*Generado automáticamente al cierre de la sesión del 07/04/2026.*
