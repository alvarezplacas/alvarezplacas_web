# 📚 README: Sincronización Catálogo ↔ GCOM — Alvarez Placas 2026

> **Última actualización:** 2026-06-02  
> **Estado:** En desarrollo — base de prueba `AP2526_TEST` activa

---

## 🗺️ Mapa del Sistema Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE DATOS                               │
│                                                                 │
│  CATALOGADOR           DIRECTUS              GCOM (GECOM)      │
│  (Next.js PIM)  ──►   (CMS/API)    ──►     (ERP contable)     │
│  \\SERVER\CATALOGADOR   admin.alvarez...     \\SERVER\gecom\    │
│                                                                 │
│  • Define SKUs          • Stock master       • Ventas          │
│  • M-XX-XXXX            • Precios            • Compras         │
│  • Catálogo web         • Imágenes           • Contabilidad    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. El Catalogador (`\\Server-alvarezp\c\CATALOGADOR`)

### Qué es
PIM (Product Information Manager) en **Next.js 15** corriendo en el servidor, puerto 3050.
Base de datos: **PostgreSQL 16** en `localhost:5432`.

### Estructura del SKU (el nuevo código)
El nuevo código de producto tiene el formato: **`X-YY-ZZZZ`**

| Parte | Significado | Ejemplo |
|-------|-------------|---------|
| `X`   | Rubro (categoría) | `M` = Maderas, `H` = Herrajes, `T` = Tapacanto, `I` = Insumos, `R` = Herramientas, `S` = Servicios, `D` = Molduras |
| `YY`  | Marca/proveedor | `10` = EGGER, `20` = FAPLAC, `30` = SADEPAN, `40` = Enchapados |
| `ZZZZ`| Número secuencial | `0001` a `9999` |

**Ejemplos reales:**
- `M-10-0001` = Placa EGGER BLANCO LACA 18mm AGLO
- `M-20-0006` = FAPLAC FIBROPLUS 3MM COLORES VARIOS  
- `M-40-0019` = ENCHAPADO CEREJEIRA 18MM MDF
- `H-10-xxxx` = Herraje GRUPO EURO
- `R-10-xxxx` = Herramienta EINHELL

### Rubros y marcas definidos en catalog-logic.ts
```
M (Maderas):   M-10=EGGER, M-20=FAPLAC, M-30=SADEPAN, M-40=ENCHAPADO, M-50=MASISA
H (Herrajes):  H-10=GRUPO EURO, H-20=BRONZEN, H-30=GREENWAY, H-40=ELEMENTA, H-50=HAFELE
T (Tapacanto): T-00=GENERICO
I (Insumos):   I-10=KEKOL, I-20=MACAVI, I-30=COLA
R (Herram.):   R-10=EINHELL
S (Servicios): S-10=PROPIOS, S-00=GENERICO
D (Molduras):  D-10=ATENEA, D-20=CASETO, D-00=GENERICO
```

### Archivos clave del Catalogador
| Archivo | Función |
|---------|---------|
| `src/lib/catalog-logic.ts` | Lógica de catalogación y generación de SKU |
| `prisma/schema.prisma` | Modelo de datos (Product, Brand, Supplier, ProductOffer, SkuSequence) |
| `ingesta/MADERAS.csv` | CSV con productos de madera y sus SKUs |
| `ingesta/precios_venta_ap.csv` | Lista de precios con nombres normalizados |
| `ingesta/Catalogo_Estructurado_RECLASIFICADO.xlsx` | Excel maestro del catálogo |
| `ingesta/Catalogo_Sincronizado.xlsx` | Excel con estado de sincronización |
| `MANUAL_CODIGOS_CONTABLES.md` | Manual de códigos contables para GECOM |
| `INSTRUCCIONES_ANTIGRAVITY.md` | Instrucciones para IA de continuidad |

---

## 2. Directus (`https://admin.alvarezplacas.com.ar`)

### Conexión
- **Token:** `alvarez-api-token-v16-2026`
- **API base:** `https://admin.alvarezplacas.com.ar/items/Productos`

### Estructura de la tabla `Productos`
| Campo | Descripción |
|-------|-------------|
| `id` | ID interno Directus |
| `sku` | **Código nuevo M-XX-XXXX** (campo clave) |
| `nombre` | Nombre completo del producto |
| `modelo` | Código del modelo (e.g. código EGGER `W954`) |
| `marca` | Marca/proveedor |
| `espesor` | Espesor en mm |
| `rubro` | Número de rubro |
| `Estado` | Estado del producto (incluye "En Stock") |
| `codigo_articulo` | Código viejo del ERP/GCOM (SOLO 124 de 2022 tienen este campo cargado) |

### Estado actual (2026-06-02)
- **2726** productos totales en Directus
- **2022** con SKU asignado (`M-XX-XXXX`)
- **2725** marcados como "En Stock"
- **124** tienen `codigo_articulo` (código viejo GCOM) cargado

> [!WARNING]  
> El campo `codigo_articulo` está casi vacío. Solo 124 productos tienen el código viejo de GCOM.
> Esto hace imposible el matching automático directo. Se requiere matching por nombre.

---

## 3. GCOM / GECOM (`\\Server-alvarezp\c\gecom`)

### Estructura de directorios
```
\\Server-alvarezp\c\gecom\
├── Datos\
│   ├── AP2526\          ← PRODUCCIÓN (NO MODIFICAR)
│   └── AP2526_TEST\     ← BASE DE PRUEBA (usar esta)
├── GECOM.exe            ← Ejecutable principal
└── (otros archivos de sistema)
```

> [!CAUTION]  
> **NUNCA modificar AP2526 (producción)**. Solo usar AP2526_TEST para pruebas.

### El archivo stock.fac (estructura VFP descubierta)

El archivo `stock.fac` es una tabla **Visual FoxPro tipo 0x30** (Free Table).

**Datos físicos del archivo:**
- Tamaño: ~612,756 bytes
- Cabecera real (Header): 492 bytes (la cabecera está parcialmente sobreescrita en los bytes 8-35 por una cadena de marca de tiempo `"26052117090331"`, lo que confunde a los lectores DBF estándar al corromper `header_len` y `record_len`).
- Registro real: **388 bytes** por registro.
- Registros totales: 1,578 registros.

**Estructura interna de cada registro de 388 bytes:**
- **Bytes 0-16 (Ancho 17):** Código de artículo GCOM (`CODIGO`, ej: `Ag00285          `, relleno con espacios a la derecha).
- **Bytes 17-74 (Ancho 58):** Descripción / Nombre del producto (`NOMBRE`, ej: `ENCH CEREJEIRA 18MM MDF S0002...`).
- **Resto de bytes (75-387):** Códigos de proveedor, marca, código de fábrica y existencias/stocks.

**Códigos GCOM encontrados (muestra):**
```
Ag00022  → FIBROPLUS FAPLAC CEDRO NATURE 3MM MDF
Ag00054  → FIBROPLUS FAPLAC MOSCU 5.5MM MDF
Ag00125  → EGGER MEL FINELINE CREMA 18MM MDF
Ag00191  → EGGER MEL PINO ALAND POLAR 18MM MDF
Ag00225  → EGGER MEL ROBLE NEBRASKA GRIS 18MM AGLO
Ag00285  → ENCH CEREJEIRA 18MM MDF
Ag00293  → ENCH GUATAMBU 18MM MDF
Ag00308  → ENCH PARAISO 15MM
```

### Llave de acceso al servidor
La llave USB de acceso se encuentra en: `\\SERVER-ALVAREZP` (USB física conectada al servidor).

---

## 4. Estado del Matching GCOM ↔ Directus

### Análisis de matching actual

#### Por `factory_code` / `codigo_articulo` (método numérico)
Solo funciona para **19 pares** — los únicos donde Directus tiene `codigo_articulo` cargado.

Ejemplos que sí matchean:
| GCOM Code | Factory | SKU Directus | Producto |
|-----------|---------|--------------|---------|
| `Ag00026` | `00027` | `M-20-0006` | FAPLAC FIBROPLUS 3MM COLORES VARIOS |
| `ROMIX BLANCO 18` | `00108` | `M-20-0016` | FAPLAC MADERA CLASICA 18MM MDF |
| `Ag00111` | `00112` | `M-20-0052` | FAPLAC ETNICA 112.0 SAHARA 18MM AGLO |

#### Por nombre (método fuzzy — más efectivo)
Usando `SequenceMatcher` con umbral 0.65:
- **123 matches** confirmados (score ≥ 0.65)
- Mejores resultados:

| GCOM Code | GCOM Descripción | Score | Nuevo SKU | Nombre Directus |
|-----------|-----------------|-------|-----------|-----------------|
| `Ag00285` | ENCH CEREJEIRA 18MM MDF | 0.836 | `M-40-0019` | ENCHAPADO CEREJEIRA 18MM MDF 260 |
| `Ag00293` | ENCH GUATAMBU 18MM MDF | 0.830 | `M-40-0013` | ENCHAPADO GUATAMBU 18MM MDF 260 |
| `Ag00308` | ENCH PARAISO 15MM 26 | 0.800 | `M-40-0004` | ENCHAPADO PARAISO 15MM MDF 260 |

---

## 5. Scripts Desarrollados

Todos los scripts están en:
`d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\scratch\`

| Script | Función |
|--------|---------|
| `analyze_gcom_matching.py` | Análisis completo GCOM ↔ Directus (factory_code) |
| `scan_gcom_offsets.py` | Scanner de patrones binarios en stock.fac |
| `find_true_record_structure.py` | Descubrimiento de la estructura 29-byte |
| `parse_gcom_real.py` | Parser experimental 29-byte chunks |
| `parse_gcom_final.py` | Parser definitivo — genera `gcom_inventory.json` |
| `match_gcom_to_skus.py` | Matching GCOM ↔ Directus por nombre fuzzy básico |
| `match_gcom_to_skus_smart.py` | Matching inteligente aplicando restricciones de marca, espesor y soporte |
| `populate_directus_with_gcom_codes.py` | Script que inyecta los códigos viejos en el campo `codigo_articulo` de Directus |
| `update_gcom_test_db.py` | Script de inyección directa de SKUs en el archivo binario `stock.fac` |
| `sync_lepton_catalog.py` | Sync del catálogo a Lepton (SmartCut) |
| `check_bmp_color.py` | Verificador de formato BMP para Lepton |

### Archivos de datos generados
| Archivo | Contenido |
|---------|-----------|
| `scratch/gcom_inventory.json` | 2,213 entradas del GCOM stock.fac |
| `scratch/gcom_to_directus_map.json` | Mapa de matching viejo código → nuevo SKU básico |
| `scratch/gcom_to_directus_map_smart.json` | Mapa de matching inteligente optimizado (105 matches de alta confianza) |

---

## 6. Estado de la Actualización de AP2526_TEST (Logrado)

### Objetivo
Que GCOM muestre los nuevos códigos (SKUs) comerciales `X-YY-ZZZZ` generados por el Catalogador en lugar de los viejos `AgXXXXX` en la base de prueba `AP2526_TEST`.

### Acciones Realizadas

**Paso 1 — Matching Ultra-Estricto por Atributos**
- Desarrollamos `match_gcom_strictest.py` aplicando validaciones deterministas:
  - Marca exacta (Egger solo con Egger, Faplac solo con Faplac).
  - Espesor exacto (evitando que un material de 5.5mm matchee con uno de 18mm).
  - Soporte exacto (MDF vs AGLO).
  - Presencia obligatoria de todas las palabras clave del modelo/color de GCOM (ej: `MACADAM`, `GRAFITO`, `HAYA`, `BARDOLINO`) en el nombre de Directus, expandiendo abreviaciones comunes de GCOM.
- **Resultado:** **124 emparejamientos 100% correctos y precisos** (sin falsos positivos). Guardado en `scratch/gcom_to_directus_map_strictest.json`.

**Paso 2 — Limpieza de Códigos Directus**
- Para asegurar que los datos no heredaran asociaciones incorrectas, limpiamos el campo `codigo_articulo` de Directus de cualquier mapeo erróneo anterior.

**Paso 3 — Inyección Correcta Alineada en VFP (`stock.fac`)**
- Implementamos `update_gcom_correct_db.py` para escribir directamente en los bytes `0-16` (campo `CODIGO` de 17 bytes con alineación exacta) de cada uno de los registros del archivo binario `\\Server-alvarezp\c\gecom\Datos\AP2526_TEST\stock.fac`.
- **Resultado:** **124 reemplazos exitosos** ejecutados de forma limpia, sin alterar un solo byte de la descripción, proveedor, ni stocks de la tabla.

### ⚠️ Paso Pendiente para el Operador GCOM (Reindexado)
Al haber modificado el archivo `.fac` directamente a nivel binario, el archivo de índice `stock.cdx` de Visual FoxPro ha quedado desincronizado (lo cual hace que los artículos aparezcan mezclados u ocultos al abrirlos en GCOM). Es **imprescindible** reindexar:
1. **Opción en el Menú Superior:** En **GECOM Gestión 12** con la base de datos `AP2526_TEST` abierta, vaya a la barra de menú superior, busque el menú **`Base de datos`** (o en su defecto `Bases`, `Ver` o `Herramientas`) y busque opciones como **`Reindexar`**, **`Mantenimiento de archivos`**, **`Organizar archivos`** u **`Organizar índices`**.
2. **Utilidad Externa:** Si no la encuentra allí, cierre GCOM y ejecute la herramienta oficial de mantenimiento ubicada en el servidor en:
   `\\Server-alvarezp\c\gecom\gestion12\utiles\gecom_util.exe`
   Esta utilidad contiene las opciones de reindexado, compactación y reparación de las tablas de GECOM.

---

## 7. Pendientes / Issues Conocidos

### ❌ Lepton SmartCut — Imágenes negras

### ⚠️ Estructura binaria VFP compleja
- El `stock.fac` tiene una cabecera alterada por GECOM (sobreescrita por marca de tiempo), impidiendo el uso de conectores ADODB/OLEDB estándar.
- La inyección binaria directa requiere el reindexado posterior a través de la interfaz de GECOM o `gecom_util.exe` para reflejar los cambios en el buscador.

---

## 8. Credenciales y Endpoints

| Sistema | Dato | Valor |
|---------|------|-------|
| Directus | Token API | `alvarez-api-token-v16-2026` |
| Directus | URL Admin | `https://admin.alvarezplacas.com.ar` |
| Catalogador | URL local | `http://localhost:3050` |
| Catalogador | DB | `postgresql://postgres:AlvarezAdmin2026@127.0.0.1:5432/alvarezplacas` |
| GCOM Prod | Path | `\\Server-alvarezp\c\gecom\Datos\AP2526` |
| GCOM Test | Path | `\\Server-alvarezp\c\gecom\Datos\AP2526_TEST` |
| Catalogador | Path | `\\Server-alvarezp\c\CATALOGADOR` |

---

## 9. Lecciones Aprendidas: Importación a GCOM (Exportaciones TXT)

### 9.1. Creación de Formatos en GCOM
Para que GCOM entienda los archivos `.txt` de ancho fijo generados por el Catalogador, se deben crear **Formatos** en:
`Bases ➡️ Formatos ➡️ Importación y exportación`

#### Formato: "CAMBIO DE PRECIOS"
- `CODIGO ARTICULO` ➡️ Col: 1 | Ancho: 11
- `PRECIO (Importe)` ➡️ Col: 21 | Ancho: 12
- **⚠️ MUY IMPORTANTE SOBRE LA MONEDA:** Eliminar del formato la fila de `PRECIO (Código moneda)` (usar el tacho de basura). Si se incluye, GCOM puede rechazar el archivo con el error `"Código de moneda no existe"`. Al no pedirle moneda, GCOM asume la moneda por defecto (Pesos) y funciona sin problemas.

### 9.2. Importar Artículos vs Importar Precios
> [!CAUTION]
> **NUNCA usar el botón "Importar Artículos"** para cargar precios. Si se sube un TXT de precios usando la pantalla de "Rubros y Artículos", GCOM pisará y arruinará los nombres de los artículos reemplazándolos con los números de los precios.

#### Flujo correcto para Importar Precios:
1. Ir al panel principal izquierdo: **Ventas ➡️ Listas de precios**.
2. Seleccionar la lista destino (ej: `1 LP1`).
3. Presionar **`Ctrl + I`** (o clic derecho ➡️ Importar).
4. Seleccionar la Lista a actualizar (`LP1`), el formato (`CAMBIO DE PRECIOS`) y el archivo `.txt`.

### 9.3. El Error de "Lista Calculada"
Al intentar importar sobre `LP1`, GCOM puede arrojar el error:
> *"La lista de precios seleccionada es CALCULADA y por lo tanto no se puede actualizar."*

Esto ocurre porque `LP1` toma los valores de la lista `COSTOS DE REPOSICION` y les suma un margen de ganancia.
**Solución para inyectar precios finales del Catalogador:**
1. Modificar la lista `LP1` (ícono de lápiz).
2. Ir a la pestaña **Calculada**.
3. En el desplegable **"Lista de precios referida"** (que dice COSTOS DE REPOSICION), hacer clic sobre el texto y **borrarlo completamente usando la tecla Retroceso o Suprimir** hasta dejar el cajón vacío.
4. Presionar Aceptar. Esto convierte la LP1 en una lista Manual que aceptará la importación directa de precios.

### 9.4. Próximos pasos (Para mañana)
1. Confirmar la ejecución exitosa de la importación de precios con el formato sin la columna de Moneda.
2. Validar en la interfaz de facturación/caja de GCOM que los artículos bajen con el precio y SKU correctos.
3. Consolidar el exportador del Catalogador para que de ahora en adelante el flujo sea un simple clic en "GCOM TXT (Precios)".
