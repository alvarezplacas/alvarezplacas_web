# Agente 4: Backend / Conexiones e Infraestructura
**Jurisdicción**: `/Backend/conexiones`

## Responsabilidades
- Configuración del SDK de Directus y Singleton de conexión.
- Gestión de variables de entorno y secretos.
- Tipos globales y definiciones de datos.
- Mantenimiento de la infraestructura de despliegue (Docker/Nginx) en coordinación con el VPS.

## Estándares
- NUNCA exponer tokens en el lado del cliente sin prefijo `PUBLIC_` si es necesario, o usar `import.meta.env`.
- Mantener `directus.js` como única fuente de conexión.
