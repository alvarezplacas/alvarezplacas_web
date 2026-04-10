# 🖼️ Guía de Infraestructura: Meilisearch & MinIO

Este documento explica la integración de las dos nuevas tecnologías que potencian el catálogo de Alvarez Placas: **Meilisearch** (Búsqueda) y **MinIO** (Almacenamiento).

---

## 🔍 Meilisearch: El Motor de Búsqueda Instantánea

### ¿Para qué sirve?
Meilisearch es un motor de búsqueda de código abierto diseñado para ofrecer una experiencia de búsqueda instantánea y relevante. A diferencia de las búsquedas tradicionales en bases de datos (SQL), Meilisearch está optimizado para:
- **Velocidad**: Resultados en milisegundos mientras el usuario escribe.
- **Tolerancia a errores**: Encuentra "Einhell" aunque el usuario escriba "Einnel".
- **Relevancia**: Clasifica mejor los productos basándose en prefijos y coincidencias exactas.

### ¿Cómo está configurado?
- **Contenedor**: `alvarezplacas_meili` (imagen `getmeili/meilisearch:v1.12`).
- **Integración con Directus**: Directus actúa como el "indexador". Cada vez que añades o editas un producto en Directus, este avisa a Meilisearch para que actualice su índice.
- **Credenciales**: Utiliza una `MASTER_KEY` segura (`AlvarezMeili2026!`) para proteger el acceso a los datos de búsqueda.

---

## 📦 MinIO: Almacenamiento S3 de Alto Rendimiento

### ¿Para qué sirve?
MinIO es un servidor de almacenamiento de objetos compatible con Amazon S3. Es la opción estándar para manejar grandes volúmenes de fotos y videos (MP4) de forma profesional.
- **Rendimiento**: Está optimizado para servir archivos binarios pesados mucho más rápido que un sistema de archivos tradicional.
- **Escalabilidad**: Separa el código de las imágenes. Si el servidor se queda sin espacio, MinIO facilita expandir el almacenamiento sin tocar la web.
- **Consola Visual**: Permite gestionar archivos desde una interfaz web moderna.

### ¿Cómo está configurado?
- **Dominio de Consola**: [https://minio.alvarezplacas.com.ar](https://minio.alvarezplacas.com.ar) (puerto 9001).
- **Driver en Directus**: Se ha configurado `STORAGE_LOCATIONS: "s3"`.
- **Estructura de Red**: Directus se comunica con MinIO por la red interna de Docker (`alvarez_prod_private_net`) para máxima velocidad y seguridad.
- **Borrón y Cuenta Nueva**: Se ha configurado para que todas las nuevas cargas de imágenes del catálogo se almacenen aquí, permitiendo limpiar el disco local del VPS.

---

## 🔄 El Ecosistema Unificado

La arquitectura ahora fluye así:
1. **Directus v16**: El cerebro que gestiona los datos.
2. **PostgreSQL 16**: El corazón que guarda la estructura.
3. **Meilisearch**: Los ojos que encuentran productos al instante.
4. **MinIO**: El almacén que sirve las imágenes y videos a toda velocidad.
5. **Astro 6**: La cara pública que consume todo esto de forma optimizada.

> [!IMPORTANT]
> **Nota de Seguridad**: Todas las comunicaciones entre estos servicios son internas al VPS (redes privadas). Solo el panel de administración de Directus y la Consola de MinIO están expuestos vía Proxy para tu gestión.
