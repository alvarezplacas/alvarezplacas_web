# Manual de Buenas Prácticas y Estrategia Astro - Alvarez Placas

Este documento resume las mejores prácticas para el mantenimiento y evolución del sitio web, basándose en la documentación oficial de Astro y las necesidades específicas de Alvarez Placas.

## 1. Arquitectura y Rendimiento (Astro 6)

### Islas de Servidor (Server Islands)
Astro 6 permite diferir la carga de componentes pesados del lado del servidor.
- **Idea Aplicable**: Usar `server:defer` en el catálogo para que la página principal cargue instantáneamente y los productos aparezcan un segundo después. Esto elimina la sensación de "lentitud" al conectar con la base de datos.
- **Implementación**: `<CatalogGrid server:defer />`.

### Renderizado Híbrido (Hybrid Rendering)
Actualmente el sitio es 100% dinámico (`output: 'server'`).
- **Opciones**: 
    - **Estático por defecto**: Cambiar a `output: 'hybrid'`. Esto hace que todo sea estático (rápido) y solo el admin y el catálogo necesiten servidor.
    - **Prerenderizado selectivo**: En páginas de texto (`Quiéne Somos`, `Contacto`), añade `export const prerender = true;`.

## 2. Manejo de Datos y Base de Datos

### Resiliencia de Conexión
- **Práctica**: Hemos implementado una función `query` en `src/lib/db.js` que captura errores. 
- **Idea**: Si la base de datos no responde, el sitio muestra un catálogo vacío o un mensaje de "catálogo en mantenimiento" en lugar de un error 502.

### Caché de Datos
- **Opción**: Implementar un pequeño caché en memoria para las configuraciones (`maintenance_mode`, `show_prices`) para no consultar la base de datos en CADA visita.

## 3. Despliegue y Operaciones (VPS)

### Estandarización de Puertos
- **Configuración**: El puerto interno oficial es el **4321**. Hemos configurado NPM para apuntar a `alvarezplacas_web:4321`.
- **Salud**: Usa siempre `http://144.217.163.13:4325/api/health` para verificar el estado sin pasar por Cloudflare.

### Docker y Redes
- **Importante**: Hemos renombrado el servicio de base de datos a `alvarez_db` para evitar conflictos con otros sitios en tu servidor (`javiermix_network`).

## 4. Estrategia de Crecimiento (Roadmap)

1. **Optimización de Imágenes**: Astro optimiza imágenes automáticamente. Asegúrate de usar el componente `<Image />` para que las fotos del catálogo no pesen megabytes.
2. **SEO Dinámico**: Implementar un generador de `sitemap.xml` dinámico para que Google indexe los productos automáticamente al añadirlos.
3. **Panel de Vendedores**: Expandir la sección de `/admin/vendedores` para incluir estadísticas de clics en los enlaces de WhatsApp.

## 5. Guía de Resolución de Errores (Troubleshooting)

### Error 502 Bad Gateway
Si ves un 502, el Proxy (NPM) no puede hablar con la aplicación (Astro).
- **Causa 1**: El contenedor de la web está reiniciándose (Loop de crash). 
    - *Solución*: Verifica los logs en el VPS. Casi siempre es por un error de sintaxis en `docker-compose.yml` o una ruta mal escrita en el servidor.
- **Causa 2**: Conflicto de puertos.
    - *Solución*: Hemos fijado el puerto interno a **4321**. No lo cambies a menos que actualices NPM también.
- **Causa 3**: Falta de memoria en el VPS.
    - *Solución*: Si el servidor tiene poco RAM, Docker puede matar procesos. Intenta reiniciar el servicio con `docker compose down && docker compose up -d`.

### Certificados SSL
- **Main Site**: Usa el certificado de Cloudflare (Origin Certificate).
- **Subdominios (Archivos)**: Usa Let's Encrypt generado en NPM. Asegúrate de que el puerto 80 esté abierto para la validación automática.

---
*Este manual garantiza que Alvarez Placas use tecnología de punta (Astro 6) de forma eficiente y profesional.*
