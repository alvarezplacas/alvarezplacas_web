# 🚀 Alvarez Placas - Proyecto Modular Astro

Este repositorio contiene el sitio web de Alvarez Placas, migrado a una estructura modular sectorizada para facilitar el trabajo en paralelo de múltiples agentes.

## 🏗️ Estructura del Proyecto

- **/src/pages**: Contenedores (wrappers) de Astro que importan las páginas reales de los sectores.
- **/Backend**: Lógica de administración, conexiones a base de datos y dashboards.
- **/Frontend**: Landing pages, catálogo, herramientas y componentes de usuario.
- **/docs**: Guías técnicas y manuales de consulta.
- **/_basura**: Depósito temporal de archivos legacy, scripts de migración y logs (CUIDADO: no borrar hasta estabilidad total).

### Arquitectura Modular (V2)
El sitio ahora utiliza una estructura modular para escalar mejor:
- `/Backend`: Lógica de servidor, conexiones a DB y Directus.
- `/Frontend`: Vistas y componentes de usuario.
- `/Frontend/shared/components`: Componentes comunes (Header, Footer, Nav) con alias `@components`.
- `/docs`: Documentación técnica y condiciones del VPS.

#### Aliases de Ruta
Para mantener el código limpio, se deben usar estos aliases:
- `@backend`: `path.resolve('./Backend')`
- `@frontend`: `path.resolve('./Frontend')`
- `@conexiones`: `path.resolve('./Backend/conexiones')`
- `@components`: `path.resolve('./Frontend/shared/components')`

### Despliegue en VPS
El despliegue se realiza mediante `git pull` en la carpeta `/home/ubuntu/alvarezplacas_web` del servidor, seguido de un reinicio de contenedores usando `docker-compose.vps.yml`.

## 🌍 Condiciones del VPS (CRÍTICO)

Para que el sitio funcione correctamente en el servidor de producción:
1. **Allowed Hosts**: `astro.config.mjs` DEBE tener `server.allowedHosts: ['alvarezplacas.com.ar']`.
2. **Docker Sync**: El VPS utiliza volúmenes locales. Todo cambio en el código se refleja automáticamente en el contenedor si se hace via Git o File Browser.
3. **Casing**: Linux es sensible a mayúsculas. Respetar siempre la estructura `Backend/` y `Frontend/`.

Para más detalles, consultar [VPS_CONDITIONS.md](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/docs/VPS_CONDITIONS.md).

## 🚢 Despliegue

Cada `git push origin main` activa una actualización automática en el servidor.
Consulte [INSTRUCCIONES_DESPLIEGUE.md](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/docs/INSTRUCCIONES_DESPLIEGUE.md) para más detalles.
