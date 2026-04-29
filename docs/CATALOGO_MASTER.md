# 📘 Master de Catalogación - Alvarez Placas (v16)

Este documento es el registro maestro de la automatización del catálogo de Alvarez Placas. Su objetivo es proporcionar contexto inmediato a cualquier desarrollador o IA sobre cómo se gestionan los ~2000 productos y sus activos.

**Meta: Catálogo 100% online en Julio 2026.**

---

## 🏗️ Arquitectura del Ecosistema

El catálogo se basa en cuatro pilares tecnológicos que trabajan en armonía:

### 1. 🐘 PostgreSQL v16 (La Memoria)
- **Función**: Base de datos relacional robusta.
- **Uso**: Almacena las tablas físicas de `Productos`, `Marcas`, `Rubros` y los metadatos de Directus.
- **Ventaja v16**: Rendimiento optimizado para consultas JSONB, lo que acelera los filtros dinámicos.

### 2. 🐰 Directus v11 (El Cerebro)
- **Función**: Headless CMS y orquestador de API.
- **Uso**: Es la interfaz donde el equipo de Alvarez Placas carga los datos del Excel. Gestiona los "Flows" (automatizaciones) para generar SKUs y validar datos.

### 3. 📦 MinIO (El Almacén de Activos)
- **Función**: Almacenamiento de objetos compatible con S3.
- **Uso**: Aquí viven las **2000+ imágenes AVIF**. Al usar MinIO en lugar del sistema de archivos local, evitamos que la base de datos crezca innecesariamente y facilitamos los backups.

### 4. 🔍 MeiliSearch (El Velocista)
- **Función**: Motor de búsqueda de texto completo (Full-text search).
- **Uso**: Indexa los datos de Directus para ofrecer una búsqueda instantánea en la web. Permite buscar por SKU, Código de Fábrica o Nombre con tolerancia a errores.

---

## 🆔 El Código Maestro (SKU)

El SKU es el "ADN" del producto y sigue el formato de 9 caracteres: **`X-YY-ZZZZ`**

- **X (Rubro)**: Una sola letra que identifica la categoría principal.
  - `M`: Maderas
  - `H`: Herrajes
  - `I`: Insumos / Química
- **YY (Marca)**: Dos dígitos que identifican al fabricante.
  - `10`: EGGER
  - `20`: FAPLAC
  - `30`: SADEPAN
- **ZZZZ (Correlativo)**: Cuatro dígitos para el ítem específico.
  - Siempre se completa con ceros a la izquierda (ej: `0001`, `0042`).

---

## 📈 Registro de Avances (Log de Automatización)

### [23-Abril-2026] - Fase de Cimentacion
- [x] Escaneo profundo del VPS para validar recursos.
- [x] Sincronizacion del `docker-compose.vps.yml` local con la version de produccion.
- [x] Documentacion de logica de automatizacion SKU/Descripcion (AUTOMATIZACION_DIRECTUS.md).
- [x] Creacion de campos en Directus via API: `rubro`, `modelo`, `espesor`, `soporte`, `descripcion`.
- [x] Schema SQL moderno: tablas `rubros`, `marcas`, `productos` (db-schema-modern.sql).
- [x] Script de importacion masiva desde Excel (scripts/import_catalog.py).
- [x] Manual paso a paso para configurar el Flow en Directus (MANUAL_FLOW_DIRECTUS.txt).
- [ ] **PENDIENTE MANUAL**: Configurar el Flow 'Auto Generate SKU' segun MANUAL_FLOW_DIRECTUS.txt.
- [ ] **PENDIENTE**: Probar generacion automatica con 1 producto de prueba.
- [ ] **PENDIENTE**: Ejecutar importacion masiva del Excel (2000+ productos).
- [ ] **PENDIENTE**: Reintegrar MinIO y MeiliSearch al docker-compose.vps.yml.
