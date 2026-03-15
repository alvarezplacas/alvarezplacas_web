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

---
*Este manual garantiza que Alvarez Placas use tecnología de punta (Astro 6) de forma eficiente y profesional.*
