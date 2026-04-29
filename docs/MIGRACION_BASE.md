# DIRECTIVA SUPREMA: MIGRACIÓN Y REFACTORIZACIÓN (v16)

**Objetivo:** Migrar y evolucionar el sitio de Alvarez Placas en una arquitectura modular v16 (PostgreSQL 16 + Directus 11).

## LÓGICA DE TRABAJO v16 (Abril 2026):

1. **PROHIBIDO EL SCRAPING EN VIVO:** Usa únicamente los fragmentos de código fuente proporcionados. Para lógica de negocio, consulta el esquema de Directus v11 (puerto 8055).
2. **MODULARIZACIÓN EXTREMA:** Divide cada componente en micro-unidades funcionales antes de reescribirlos para Astro v6.
3. **MANTENIMIENTO DEL ESQUEMA:** Si detectas discrepancias en los campos, re-aplica el `directus_snapshot.json` ubicado en `web01/database/`. No intentes adivinar el esquema físico de PostgreSQL 16.
4. **ACTUALIZACIÓN TECNOLÓGICA:** Los componentes nuevos deben aprovechar **Astro Islands** y el motor **LightningCSS** para máxima performance.

---

## 🏗️ Nueva Ruta Maestra (Jurisdicción v16)

Desde Abril 2026, la zona de trabajo aislada en el VPS es:

**/opt/alvarez_v16/web01**
  /Backend
          /conexiones
          /dashboard
  /Frontend
          /catalogo
          /herramientas
          /home
  /database
          /migrations
          /directus_snapshot.json ( डीएनए del sistema )

---

*Documento validado para la posteridad por Antigravity tras la migración exitosa.*