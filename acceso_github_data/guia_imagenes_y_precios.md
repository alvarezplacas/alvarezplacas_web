# 🖼️ Guía de Imágenes y Precios del Catálogo

Esta guía explica cómo gestionar las imágenes de los productos y la visibilidad de los precios en el sitio de Alvarez Placas.

## 1. Cómo subir Imágenes de Productos

El sistema utiliza una lógica de **emparejamiento automático**. Para que una imagen aparezca, debe estar en la carpeta correcta con el nombre correcto.

### Estructura de carpetas
Las imágenes deben subirse a:
`public/images/catalog/[CATEGORÍA]/[MARCA]/[LÍNEA]/[NOMBRE_IMAGEN].avif`

**Ejemplo para una placa Egger:**
Si es una placa Egger de la línea "Grupo 7" llamada "Roble Bardolino natural", la ruta debe ser:
`public/images/catalog/Placas/Egger/Grupo 7/H1145 ST10 Roble Bardolino natural.avif`

### Reglas importantes:
- **Formato**: Únicamente se admite el formato **.avif**.
- **Jerarquía**: Respetar el orden [Categoría] > [Marca] > [Línea].
- **Nombre del archivo**: El nombre debe ser descriptivo (ej: `H1145 ST10 Roble Bardolino natural.avif`).

---

## 2. Dónde y Cómo subir los archivos

Actualmente, al ser un sistema basado en código, el Panel Admin no tiene un botón de "Subir" (esto es para asegurar que las imágenes se optimicen correctamente).

### La forma más fácil y rápida: Usar FileBrowser Dedicado (Recomendado)
1. Entra a tu nuevo gestor de archivos aquí: [http://144.217.163.13:8083](http://144.217.163.13:8083)
2. **Usuario**: `admin` / **Contraseña**: `admin` (Cámbiala al entrar).
3. Verás directamente el contenido de **`archivos_alvarezplacas`**.
4. Crea la estructura: `Placas` > `Marca` > `Línea`.
5. Sube tus archivos `.avif`.

### Otra opción: Usar GitHub (Web)
*(Este método es más lento porque cada subida debe procesarse e instalarse en el servidor).*
1. Entra a tu repositorio: [alvarezplacas_web en GitHub](https://github.com/alvarezplacas/alvarezplacas_web).
...

---

## 3. Cómo ocultar o mostrar Precios

Para evitar mostrar precios desactualizados o por decisión comercial, puedes controlarlos desde el Panel de Administración.

### Pasos:
1. Ve al **Panel de Administración** (puedes entrar desde el enlace en el pie de página).
2. Busca la sección **"Configuración del Catálogo"**.
3. Verás el interruptor: **"Mostrar Precios al Cliente"**.
   - **Activado**: El cliente verá el precio sugerido y podrá pedir presupuesto con ese valor.
   - **Desactivado**: El cliente verá el texto **"Consultar"** en lugar del precio, tanto en la lista como en el mensaje de WhatsApp que se genera.

---

## 3. Actualización de Datos (Excel)

Cuando subas un nuevo archivo de Excel para actualizar el catálogo, el sistema procesará los nombres. Asegúrate de que los nombres de los productos en el Excel coincidan con los nombres de las imágenes que subiste en el punto 1.

*Última actualización: 13/03/2026*
