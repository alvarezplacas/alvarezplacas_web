# 🚀 Alvarez Placas - Proyecto Modular Astro

Este repositorio contiene el ecosistema digital de Alvarez Placas, diseñado bajo una arquitectura modular y sectorizada para máxima eficiencia operativa.

## 🧠 Reporte de Infraestructura Inteligente (Actualización Abril 2026 - v16)

Tras la migración exitosa a PostgreSQL 16 y Directus 11, este es el estado del sistema:

### 🌍 Hosting y Red Aislada (v16)

- **Host**: **OVH Cloud** (IP: `144.217.163.13`).
- **Directorio Maestro**: `/opt/alvarez_v16/web01` (Entorno de producción aislado).
- **Aislamiento**: El proyecto corre en una red interna dedicada `alvarez_v16_internal` para evitar conflictos con el proyecto hermano (*Javiermix*).
- **Orquestador**: **Caddy v2** gestionando SSL y redirecciones.

### 🛠️ El Stack (Core)

- **Framework**: **Astro v6.0.8** (SSR modo `node` standalone).
- **Base de Datos**: **PostgreSQL 16** (Contenedor `alvarezplacas_db_v16`).
- **CMS**: **Directus 11.1.0** (Contenedor `alvarezplacas_directus_v16`).
- **Volumen Persistente**: `alvarez_data_v16`.

---

## 🏗️ Protocolo de Rescate de Esquema (Snapshot)

> [!IMPORTANT]
> Si tras una migración o reinicio ves un error **[FORBIDDEN]** en el panel de Directus, es porque el "Metadato de Campos" se ha desincronizado del motor de base de datos.

### Pasos para restaurar en 30 segundos:
1. Asegurarse de que el archivo `database/directus_snapshot.json` esté actualizado.
2. Acceder al panel de Admin -> Settings -> Schema Snapshot.
3. Importar el archivo JSON o usar la API `POST /schema/apply` con el contenido del snapshot.
4. Reiniciar el contenedor de Directus si es necesario: `docker restart alvarezplacas_directus_v16`.

---

## 🚢 Guía de Operaciones y Acceso

### 1. Despliegue de Código
Todo cambio en `main` se sincroniza con el servidor. En el VPS, los archivos se alojan en:
`/opt/alvarez_v16/web01`

### 2. Acceso a Base de Datos
- **Usuario**: `alvarez_admin`
- **Pass**: **`AlvarezAdmin2026`**
- **Puerto**: Red interna 5432 (Sin exposición externa por seguridad).

### 3. Panel Directus v11
- **Email**: `admin@alvarezplacas.com.ar`
- **Pass**: **`JavierMix2026!`**
- **URL**: `http://144.217.163.13:8055` (Gestionado por Caddy).

---

## 🏗️ Estructura del Proyecto
- **/src/pages**: Wrappers de entrada.
- **/Backend**: Inteligencia (DB, Directus, Dashboards).
- **/Frontend**: Experiencia de usuario (Catálogo, Presupuestador).
- **/database/migrations**: Scripts SQL para reconstrucción de tablas físicas.
- **/database/directus_snapshot.json**: **ADN del sistema** (Metadatos de campos y relaciones).

*Documento actualizado y validado el 07/04/2026 tras la migración exitosa a PostgreSQL 16.*
