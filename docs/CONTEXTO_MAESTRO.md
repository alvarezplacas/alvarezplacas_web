# 🧠 CONTEXTO MAESTRO - Alvarez Placas v16
*Este documento es la fuente de verdad para cualquier IA que retome el proyecto.*

## 📌 Visión General
El objetivo es automatizar la catalogación de +2000 productos. El eje central es el **SKU (X-YY-ZZZZ)**, que actúa como puente entre:
1. **Sitio Web (Astro):** Para filtros, búsqueda y visualización.
2. **GCOM (Software Contable):** Para importación de listas de precios y facturación.
3. **Gestión de Media:** Vinculación automática de imágenes/videos desde MinIO usando el SKU como nombre de archivo.

## 📏 Reglas del SKU (X-YY-ZZZZ)
- **X (Rubro):** 1 carácter (M=Maderas, H=Herrajes, I=Insumos, etc.).
- **YY (Marca):** 2 dígitos (10=EGGER, 20=FAPLAC, 30=SADEPAN, etc.).
- **ZZZZ (Correlativo):** 4 dígitos obligatorios (ej: 0001, 0042). **Siempre con ceros a la izquierda.**

## 📊 Fuente de Datos
- **Archivo:** `web01/database/Catalogo_de_productos.xlsx`
- **Manual de Catalogación:** `https://alvarezplacas.com.ar/manuales/Manual_Catalogacion_Alvarez_Placas.html`
- **Localización Manual:** `docs/MANUAL_FLOW_DIRECTUS.txt`

## 🎨 Criterios de Catalogación (Punto 4 del Manual)
- **Modelo/Artículo:** Incluye la inspiración y textura (ej: "Lino Negro", "Black Extreme Matt"). Es el nombre comercial completo.
- **Color Real (Filtro):** Es el color base para filtrado web (Blanco, Negro, Gris, etc.).
- **Espesor:** Siempre en `mm` (ej: 18mm).
- **Soporte:** Tipo de placa (MDF, AGL, RH, etc.).
- **U.M. (Unidad de Medida):** Vital para GCOM (Placa, Unidad, Tira, etc.).

## 🛠️ Infraestructura
- **Backend:** Directus v11 (Filter Hooks para automatización).
- **Base de Datos:** PostgreSQL v16.
- **Frontend:** Astro.
- **Almacenamiento:** MinIO (Imágenes AVIF).
- **Búsqueda:** MeiliSearch.

## 🖥️ Herramientas de Gestión (Escritorio)
- **Carpeta:** `C:\Users\javier\Desktop\ALVAREZ_SISTEMA_V16`
- **Funciones:** Simulación, Carga Segura (Solo Nuevos), Actualización Forzada, Deploy y Sincronización de Búsqueda.

---
*Ultima actualización: 29-Abr-2026 por Antigravity.*
