# 🔓 Auditoría Técnica Profunda: VPS Alvarez Placas (v16)

**Fecha de Auditoría**: 23 de Abril, 2026
**Analista**: Antigravity (AI Coding Assistant)
**Estado General**: 🟡 OPERATIVO (FASE DE REPARACIÓN)

---

## 1. Localización y Hardware (Capa Física)

- **Proveedor**: **OVH Cloud** (vps-2fde14de).
- **Sistema Operativo**: Ubuntu 24.04.4 LTS (Kernel 6.8.0).
- **Recursos**: 72GB Disco (44% uso), 8GB RAM (48% uso).
- **Directorio de Producción**: `/opt/alvarez_v16/web01`.

---

## 2. Orquestación y Red (Capa de Tráfico)

### 🛡️ Aislamiento de Proyectos
- **Alvarez Placas**: Corre en red `alvarez_v16_net`.
- **Javiermix**: Corre en red `javiermix_network`.
- **Interconectividad**: El contenedor `alvarezplacas_web` y `alvarezplacas_directus_v16` están unidos a `javiermix_network` para ser servidos por el Proxy Caddy global.

### 🔀 Reverse Proxy: Caddy
- Gestionado por el stack de Javiermix (Contenedor `javiermix_caddy`).
- Provee SSL y balanceo para `alvarezplacas.com.ar`.

---

## 3. Composición del Stack (v16 - Reparado)

Estado de los contenedores al 23/04/2026:

| Servicio | Contenedor | Estado | Función |
| :--- | :--- | :--- | :--- |
| **Web** | `alvarezplacas_web` | 🟢 Up | Frontend Astro v6. |
| **API/CMS** | `alvarezplacas_directus_v16` | 🟢 Up (Healthy) | Directus v11.1.0 (Puerto 8055). |
| **Database** | `alvarezplacas_db_v16` | 🟢 Up | PostgreSQL 16. |

### ⚠️ Contenedores Huérfanos (Orphans)
Estos contenedores existen pero no están en el archivo compose actual de `/opt/alvarez_v16/web01`:
- `alvarezplacas_minio` (Almacenamiento S3)
- `alvarezplacas_meili` (Búsqueda)
- `alvarezplacas_files` (Explorador de archivos)

---

## 4. Análisis de la Situación Actual

1. **Reparación Exitosa**: Directus ha sido restaurado exitosamente tras problemas con los metadatos.
2. **Sincronización Pendiente**: El código local (`docker-compose.vps.yml`) tiene servicios extra que el servidor no tiene en su archivo activo.
3. **Seguridad**: Se mantiene el aislamiento total de los sitios `javiermix.ar` y la infraestructura de `VPN`.

---

## 5. Recomendaciones de Inteligencia

> [!IMPORTANT]
> **Consolidación**: Es imperativo reintegrar `minio` y `meili` al archivo compose o eliminarlos para liberar recursos. Actualmente están consumiendo RAM sin ser controlados por la orquestación principal.
>
> **Persistencia**: El volumen `web01_alvarez_data_v16` es externo y está siendo utilizado correctamente por el contenedor de base de datos.

---

*Informe actualizado y validado el 23/04/2026 tras el escaneo de emergencia.*

