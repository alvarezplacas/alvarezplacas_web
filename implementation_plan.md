# Plan de Restauración de Servicio - Alvarez Placas

El sitio `alvarezplacas.com.ar` está fuera de servicio (502). He identificado que el contenedor backend no está respondiendo, posiblemente debido a una falla en la última actualización que integró la base de datos en páginas estáticas.

## User Review Required

> [!IMPORTANT]
> **Acceso SSH:** No he podido ingresar al servidor mediante la llave pública. Necesito que verifiques si el servicio de Docker está corriendo o si puedes proporcionarme acceso temporal para ver los logs.

> [!WARNING]
> **Configuración de DB:** He detectado que la configuración de SSL en la base de datos podría estar causando que el sitio no construya correctamente en el servidor. Voy a simplificar esta conexión para asegurar la compatibilidad con el contenedor local de Postgres.

## Proposed Changes

### [Core / Database]

#### [MODIFY] [db.js](file:///h:/Alvarezplacas/src/lib/db.js)
Desactivar la exigencia de SSL en producción, ya que el contenedor de base de datos es local al VPS y no suele requerir SSL por defecto. Esto evitará posibles bloqueos durante la generación estática.

### [Pages / Fixes]

#### [MODIFY] [smart-match.astro](file:///h:/Alvarezplacas/src/pages/smart-match.astro)
Reescribir el encabezado (frontmatter) para asegurar que se reconozca correctamente, eliminando cualquier posible carácter invisible que haya causado el error de compilación reportado anteriormente.

### Gestión de Archivos (FileBrowser)

Se ha detectado un error 502 al acceder a `/files/`. Para solucionarlo:

#### [MODIFY] [docker-compose.yml](file:///h:/Alvarezplacas/docker-compose.yml)
- Asegurar que el nombre del servicio coincida con el upstream de Nginx.
- Verificar permisos del archivo de base de datos.
- [NEW] Añadir comando de cambio de permisos en el despliegue.

## Plan de Verificación Mañana

1. **Acceso a FileBrowser**: Verificar `https://alvarezplacas.com.ar/files/`.
2. **Logs**: Si sigue el 502, ejecutar `docker logs alvarezplacas_archivos`.
3. **Permisos**: Ejecutar `chown 1000:1000 filebrowser.db` en el servidor si falla por base de datos.

---

## Verification Plan

### Automated Tests
1. **Build Local:** Ejecutar `npm run build` para asegurar que las correcciones no rompan la compilación.
2. **Check Ports:** Usar el asistente de navegador para verificar si el puerto 4322 vuelve a responder después de que el usuario haga el push.

### Manual Verification
1. **Acceso Web:** Verificar `https://alvarezplacas.com.ar` en el navegador.
2. **Logs del VPS:** Si el usuario recupera el acceso, ejecutar `docker logs alvarezplacas_web` para confirmar que no haya errores de conexión a la base de datos.
