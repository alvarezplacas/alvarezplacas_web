# LA BIBLIA DE LA OPTIMIZACIÓN INDUSTRIAL (SmartCut PRO)
*Arquitectura, Algoritmia Científica y Rendimiento Extremo - Mayo 2026*

---

## 1. El Paradigma del Corte: Un Problema a Nivel Científico

La optimización de corte de tableros no es un simple cálculo matemático de áreas; pertenece a una rama de la ciencia computacional conocida como **2D Cutting Stock Problem**, el cual está clasificado como un problema **NP-Hard** (Nondeterministic Polynomial-time hardness). 

Esto significa que es computacionalmente inviable calcular "todas las combinaciones posibles" para encontrar la perfecta en un tiempo razonable. 

### 1.1 Modelos de Referencia: OptiCutter
Al investigar referentes top-tier como **OptiCutter**, descubrimos que la optimización real requiere:
- **Algoritmos Evolutivos y Heurísticas:** Métodos como *Guillotine Bin Packing* o *Max-Rects Algorithm*, que no buscan la perfección bruta, sino la "mejor aproximación evolutiva" en milisegundos.
- **Variables Críticas Obligatorias:**
  - *Kerf (Espesor de Sierra):* Generalmente 3mm o 4mm.
  - *Trim (Refile):* Corte inicial de limpieza del tablero (10mm a 15mm por borde).
  - *Grain Direction (Veta):* Restricción absoluta de rotación para placas con textura.
  - *Edge Banding (Tapacantos):* El algoritmo debe descontar automáticamente el espesor del tapacanto (0.4mm, 1mm o 2mm) de la pieza final para que al pegarlo, la medida coincida.

---

## 2. Ingesta de Datos: PostgreSQL v16 vs Directus

Para que SmartCut PRO sea reactivo y no sufra bloqueos en la interfaz (como los que obligaron a poner escudos anti-caché y hard-resets), la velocidad de los datos es crítica.

### 2.1 El Cuello de Botella de Directus
Directus es excelente como CMS, pero añade un "Overhead" (carga de procesamiento) al consultar datos masivos en tiempo real:
1. **Parseo REST/GraphQL:** Codificar y decodificar JSON.
2. **RBAC (Role-Based Access Control):** Por cada petición, Directus verifica permisos, roles y políticas de seguridad.
3. **Generación de SQL Dinámico:** Traduce la petición REST a consultas SQL al vuelo.
*Resultado:* Una latencia de entre 50ms y 200ms por consulta. Inaceptable para un flujo "Instantáneo" industrial.

### 2.2 La Vía de Alta Velocidad: PostgreSQL v16 Directo
PostgreSQL v16 tiene capacidades extremas que superan cualquier ORM o API intermedia.
Para alcanzar velocidad científica (`< 5ms` de latencia), la teoría de manejo de datos dicta:

1. **Conexión Nativa (Bypass):** Que el backend de Astro (Node.js) use el driver `pg` para conectarse *directamente* a PostgreSQL, saltándose completamente Directus en el portal público de SmartCut.
2. **Materialized Views (Vistas Materializadas):** Crear en PostgreSQL una tabla pre-computada que ya tenga "Marca, Línea, Color, Espesores". PostgreSQL responde esto desde la memoria RAM.
3. **JSONB Aggregation:** Pedirle a PostgreSQL que devuelva toda la estructura del catálogo (Marca -> Línea -> Colores) pre-formateada en un único JSON nativo. Solo requiere un `fetch` inicial al cargar la página, eliminando el "Race Condition" de tener que pedir datos al cambiar de línea.

#### Veredicto Arquitectónico:
**Usar Directus solo para "Escribir" datos (CRUD, gestión del catálogo). Usar consultas directas a PostgreSQL v16 para "Leer" el catálogo desde SmartCut PRO.**

---

## 3. Workflow de Rendimiento Extremo (UX Industrial)

Para Faplac, Egger, Sadepan y Nova, el flujo asistido definitivo será:

1. **Carga Atómica (Single Payload):** 
   - Al abrir SmartCut, el navegador descarga un paquete comprimido (`catalog.json.gz`) generado directamente por PostgreSQL.
   - *Cero peticiones en vivo.* Al seleccionar "SADEPAN", los datos ya están en el navegador. La latencia cae a 0ms.
2. **Filtrado por SKU (Incorruptible):**
   - Como ya implementamos, el motor no filtra por IDs de base de datos ni nombres, filtra por la raíz industrial: `M-10-` (Egger), `M-20-` (Faplac), `M-30-` (Sadepan).
3. **Interacciones Antibalas:**
   - La UI se blinda limpiando el DOM con `removeChild` explícito y usando destructores de eventos (`AbortController`) por si el sistema necesita conectarse a la red, evitando que los datos "sangren" de una marca a otra (Cache Busting).

---

## 4. Próximos Pasos de Implementación CIENTÍFICA

Para llegar al nivel *OptiCutter*, debemos:
1. Reemplazar la petición de Directus (`/api/herramientas/catalog`) por una consulta directa a la vista de PostgreSQL mediante el módulo nativo de Node `pg`.
2. Integrar el motor Heurístico Guillotina 2D para calcular el *Yield* (Rendimiento %) y mostrar un gráfico de cortes instantáneo en SVG o HTML5 Canvas.
3. Incorporar el motor de descuento de Tapacantos (0.4mm, 2mm) antes de que la lista llegue al optimizador.

---
*Este documento dicta la norma técnica obligatoria para el desarrollo del ecosistema Alvarez Placas v16.*
