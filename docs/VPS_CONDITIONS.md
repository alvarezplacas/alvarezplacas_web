# 🛠️ Condiciones Técnicas del VPS (Ubuntu — v16)

**Actualizado:** 23 de Abril de 2026 — Estado post-reparación de Directus.

---

## 1. Configuración de Astro v6
La aplicación corre en modo **SSR Standalone** (Puerto 4321).
- **Contenedor**: `alvarezplacas_web`
- **Puerto**: `4321` expuesto.

## 2. Orquestación Docker (v16)
El archivo compose activo en el servidor es: `/opt/alvarez_v16/web01/docker-compose.vps.yml`

| Servicio | Contenedor | Puerto |
|---|---|---|
| `web` | `alvarezplacas_web` | `4321` |
| `directus` | `alvarezplacas_directus_v16` | `8055` |
| `db` | `alvarezplacas_db_v16` | Interno (5432) |

## 3. Seguridad y Accesos
- **Directus Admin**: `admin@alvarezplacas.com.ar` / `JavierMix2026!`
- **Postgres DB**: `alvarez_admin` / `AlvarezAdmin2026`
- **Redes**: `javiermix_network` (externa para proxy) + `alvarez_v16_net` (interna)

## 4. Rutas Críticas en el Servidor

| Recurso | Ruta |
|---|---|
| Compose | `/opt/alvarez_v16/web01/docker-compose.vps.yml` |
| Código Astro | `/opt/alvarez_v16/web01/site/web01/` |
| Build (`dist`) | `/opt/alvarez_v16/web01/site/web01/dist/` |
| Placas (fotos) | `/opt/alvarezplacas/placas/` |
| BD (volumen Docker) | `web01_alvarez_data_v16` (Externo) |

> [!CAUTION]
> La carpeta `/opt/javiermix/` pertenece a **javiermix.ar**. **PROHIBIDO MODIFICAR**.
> Los contenedores de `VPN` y `Nextcloud` son críticos para la infraestructura y deben ser respetados.

---

*Documento actualizado tras el rescate de Directus del 23/04/2026.*

