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

## 4. Reglas de Seguridad y Limitaciones Mecánicas

Para que el SmartCut PRO sea una herramienta de producción real, debe respetar las limitaciones físicas de las máquinas seccionadoras y la integridad de los datos.

### 4.1 Restricciones de Tamaño de Pieza (Mínimos de Seguridad)
Las máquinas industriales (Escuadradoras y Seccionadoras) requieren un área mínima de agarre para evitar accidentes y roturas de material.
- **Límite Crítico Inferior:** La medida mínima de un lado es **70mm**.
- **Regla de Proporción:** No se permiten piezas de **70mm x 70mm**. 
- **Estándar Alvarez Placas:** Si un lado mide **70mm**, el lado adyacente debe medir como mínimo **100mm**. Esto garantiza la estabilidad de la pieza durante el corte y el posterior pegado de cantos.

### 4.2 Restricciones de Tamaño de Placa (Máximos Físicos)
El sistema debe impedir la carga de piezas que superen las dimensiones reales del tablero seleccionado (ej. 2750x1820 para Faplac), considerando además el **Trim (Refile)** perimetral de limpieza.

---

## 5. Estándares de Visualización en el Plano de Corte

El plano de corte es el mapa del operario. La legibilidad es fundamental para evitar desperdicios por errores de interpretación.

### 5.1 Jerarquía y Código de Líneas (Impresión B/N)
Para garantizar la legibilidad en impresiones de taller, se establece un código de líneas según el espesor:
1. **Sólida Gruesa (2mm):** Línea continua, representa el canto de mayor espesor y protección.
2. **Segmentada (1mm):** Guiones medios, para cantos intermedios.
3. **Punteada (0.45mm):** Puntos cerrados, para cantos finos.
4. **Guía Tenue:** Línea de referencia si el borde no lleva canto.
*Se elimina cualquier fondo gris o sombreado para evitar empastes en la impresión.*

### 5.2 Diseños Híbridos (Canto Diferente)
El sistema permite especificar un color o diseño de tapacanto independiente de la placa. Esta información debe viajar en el objeto de la pieza y mostrarse resaltada en el listado técnico para evitar errores de pegado con el diseño base de la placa.

### 5.3 Excedente de Tapacanto (Edge Overlap)
Para el cálculo de costos y stock, no basta con medir el perímetro de la pieza. Se debe sumar un **excedente de seguridad** (retestado) de aproximadamente 50mm por cada punta de canto aplicada para permitir el corte de los sobrantes por la máquina.

---

## 6. Trazabilidad y Logística de Planta

### 6.1 Etiquetado Automático
Cada pieza generada por el algoritmo debe portar un identificador único que incluya:
- ID de Pedido / Cliente.
- Dimensiones Finales.
- Indicación de qué bordes llevan qué tipo de canto.
- Código de barras o QR para integración con CNC posteriores.

### 6.2 Gestión de Sobrantes y Retazos (Política Alvarez)
A diferencia de otros modelos industriales, en SmartCut PRO la optimización es **estrictamente individual por cliente**.
- **Propiedad del Sobrante:** Todos los retazos generados pertenecen al cliente que adquirió el tablero. El plano de corte debe mostrar claramente estas áreas para su entrega.
- **Regla de Custodia (15 Días):** Alvarez Placas se reserva el derecho de custodia de los sobrantes por un periodo máximo de 15 días corridos.
- **Depósito de Cortes:** Pasados los 15 días, los sobrantes no retirados pasan a integrar el stock de "Cortes del Depósito", destinados exclusivamente a:
    1. Reposición por errores de producción.
    2. Pedidos menores que no justifiquen la compra de una placa entera.

---

---

## 8. Paradigmas de Carga: Modo Compacto vs. Modo Lepton (Grilla)

Tras auditar **Lepton Optimizer**, se identifican dos perfiles de usuario que SmartCut PRO debe satisfacer:

### 8.1 El Usuario Móvil / Rápido (Modo Compacto)
- **Interfaz:** Formulario vertical atómico (Actual).
- **Ventaja:** Ideal para tablets o celulares en obra.
- **Flujo:** Carga pieza por pieza con validaciones inmediatas.

### 8.2 El Operario Industrial (Modo Lepton / Grilla)
- **Interfaz:** Tabla de datos tipo hoja de cálculo (Excel/Lepton).
- **Requisitos Científicos de Velocidad:**
    1. **Navegación por Teclado:** Uso de `TAB` para saltar entre Largo, Ancho, Cantidad y Cantos. `ENTER` para crear una nueva fila automáticamente.
    2. **Edición In-Place:** Poder corregir cualquier medida directamente en la grilla sin procesos de "Edición/Guardado".
    3. **Visualización de Cantos Atómica:** Mini-selectores de posición (T, B, L, R) integrados en la misma fila de la pieza.
    4. **Memoria de Fila:** El sistema debe recordar el último espesor de canto usado para la siguiente pieza (autocompletado inteligente).

---

## 9. Próximos Pasos de Implementación CIENTÍFICA

Para llegar al nivel *OptiCutter/Lepton*, debemos:
1. **Rediseñar la Lista de Piezas:** Pasar de un listado básico a un panel técnico legible con jerarquía visual de medidas.
2. **Implementar el Switch de Modo:** Permitir al usuario alternar entre la carga actual y la nueva Grilla Industrial.
3. **Exportación Lepton:** Crear un conversor de formato para que lo cargado en SmartCut pueda exportarse como archivo compatible con Lepton Optimizer.

---

## 10. Ingeniería de Reversa: El ADN de Lepton Optimizer

Tras analizar los archivos de sistema (`PLANOS3.HTM`, `CECIL.ped`, `LEPTON.CFG`), se extraen los siguientes estándares industriales:

### 10.1 Estructura de Datos de Corte
Lepton fragmenta la optimización en dos vectores críticos:
- **Vector de Geometría (V-Geo):** Coordenadas absolutas (X, Y) y dimensiones relativas. Usa el valor `-2` como delimitador de placa y `-1` como fin de archivo.
- **Vector de Catálogo (V-Cat):** Relación de piezas por ID, cantidad y descripción.

### 10.2 Reglas de Visualización Industrial
1. **Umbral de Utilidad (`min_util`):** Fijado en 100mm. Todo sobrante por debajo de esta medida se etiqueta como "Scrap" y no se dimensiona en el plano para evitar ruido visual.
2. **Sistema de Etiquetas:**
    - Medida de Largo: Centrada en la base de la pieza.
    - Medida de Ancho: Texto vertical (`textoutv`) en el margen derecho de la pieza.
    - Identificador: El ID de pieza siempre se encierra entre paréntesis `(ID)`.
3. **Paleta de Colores de Taller:** Uso de colores pasteles de alto contraste para diferenciar familias de piezas (Cyan, Magenta, Amarillo, Verde Lima).

### 10.3 Decodificación del Archivo `.vid` (Geometría Binaria/Texto)
El archivo `.vid` es el volcado directo del motor de optimización. Su estructura es una secuencia de bloques de 6 campos por pieza:

| Línea | Parámetro | Unidad | Ejemplo (Pieza 1000x90, Sierra 4mm) |
| :--- | :--- | :--- | :--- |
| 1 | Largo Total | 0.1 mm | 10040 (1000.0 + 4.0) |
| 2 | Ancho Total | 0.1 mm | 940 (90.0 + 4.0) |
| 3 | Largo Neto | 0.1 mm | 10000 |
| 4 | Ancho Neto | 0.1 mm | 900 |
| 5 | Posición X | 0.1 mm | Variable según nesting |
| 6 | Posición Y | 0.1 mm | Variable según nesting |

---

## 11. Hoja de Ruta de Compatibilidad PRO

Para que SmartCut PRO sea el sucesor definitivo, implementaremos:
1. **Lógica de Sobrantes Inteligente:** Replicar el umbral de 100mm para limpieza de planos.
2. **Modo Grilla "Zero-Click":** Entrada de datos optimizada para teclado, emulando la velocidad de carga de Lepton.
3. **Importador Universal (.ped/.vid):** Motor de lectura que multiplique por 0.1 los valores de Lepton para normalizar la base de datos de Alvarez Placas.

---
*Este documento dicta la norma técnica obligatoria para el desarrollo del ecosistema Alvarez Placas v16.*
*Actualizado: Mayo 2026 - Decodificación Matemática Lepton.*
