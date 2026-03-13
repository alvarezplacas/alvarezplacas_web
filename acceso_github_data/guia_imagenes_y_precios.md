# 🖼️ Guía de Imágenes y Precios del Catálogo

Esta guía explica cómo gestionar las imágenes de los productos y la visibilidad de los precios en el sitio de Alvarez Placas.

## 1. Cómo subir Imágenes de Productos

El sistema utiliza una lógica de **emparejamiento automático**. Para que una imagen aparezca, debe estar en la carpeta correcta con el nombre correcto.

### Estructura de carpetas
Las imágenes deben subirse a:
`public/images/catalog/[MARCA]/[NOMBRE_IMAGEN].avif`

**Ejemplo para Faplac:**
Si tienes una placa que en el Excel/Catálogo se llama "Blanco", debes subir la imagen a:
`public/images/catalog/Faplac/Blanco.avif`

### Reglas importantes:
- **Formato**: Únicamente se admite el formato **.avif** por su alta compresión y calidad.
- **Nombre del archivo**: Debe coincidir exactamente con el nombre de la variante/color en el catálogo (ej. "Roble", "Gris Humo").

---

## 2. Cómo ocultar o mostrar Precios

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
