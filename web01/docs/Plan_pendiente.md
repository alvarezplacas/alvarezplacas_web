# Plan Pendiente: Sistema de Banners Dinámicos y Resumen de Infraestructura

Este documento resume los hallazgos técnicos del día y el plan para la próxima sesión, diseñado para que cualquier instancia de IA (o "inteligencia") pueda retomar el trabajo exactamente donde quedó.

## 🧠 Conocimientos Adquiridos (Contexto Crítico)

### 1. Infraestructura VPS (Ubuntu 24.10 / Docker)
- **Directorio de Trabajo**: `/home/ubuntu/prod/alvarezplacas_web/web01`
- **Contenedores**:
  - `alvarezplacas_db`: Postgres 15 (**Versión Crítica**: Incompatible con v16 sin migración de datos).
  - `alvarezplacas_directus`: CMS accesible internamente en el puerto 8055.
  - `alvarezplacas_web`: Aplicación Astro que se auto-repara al iniciar con `npm install && npm run build`.
- **Redes**: Se utiliza `alvarez_prod_private_net` para aislar la comunicación DB <-> Directus. Solo el Proxy (Nginx/Traefik) tiene exposición externa.

### 2. Estructura de Aplicación (Astro Modular)
- **Conexión Directus**: `Backend/conexiones/directus.js` usa el SDK oficial y maneja URLs inteligentes (Internal/Public fallback).
- **Componente Hero**: `Frontend/shared/components/Hero.astro` gestiona el banner de estado (Abierto/Cerrado) mediante un script de cliente.

### 3. Problemas Resueltos Hoy
- **Sincronización VPS**: Se estableció el comando de auto-reparación en el `docker-compose.vps.yml`.
- **Compatibilidad Astro**: Se identificó que errores en los delimitadores `---` bloquean el build de producción.

---

## 🚀 Plan: Banner de Horarios Especiales (Feriados/Asuetos)

### Fase 1: Directus
Crear la colección `fechas_especiales`:
- Fields: `fecha` (ISO Date), `mensaje` (String), `activo` (Boolean).

### Fase 2: Frontend (`Hero.astro`)
1. **Fetch en Frontmatter** para detectar si hoy es una fecha especial.
2. **Prioridad**: El mensaje especial debe anular el estado "Abierto/Cerrado" estándar.

---

## ✅ Tareas Completadas Hoy
- [x] **Unificación v16**: El dominio `admin.alvarezplacas.com.ar` ya apunta al puerto 8055 de PostgreSQL 16.
- [x] **Reparación de Imágenes**: Subida de archivos operativa tras corregir permisos de volumen (`1000:1000`).
- [x] **Limpieza del VPS**: Instancia v15 detenida y removida para evitar conflictos.

*Documento actualizado el 07 de Abril de 2026.*
