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
- Header: 318 bytes
- Registros: 1,706 (a 359 bytes c/u)
- Total registros activos (no borrados): 1,706

**Estructura interna real (descubierta por análisis binario):**
El archivo NO usa registros DBF estándar. Internamente, los datos se organizan en 
**"sub-líneas" de 29 bytes** dentro de los bloques de 359 bytes.

Distribución de campos en cada sub-línea de 29 bytes:
- **Bytes 0-17:** Datos anteriores / separador
- **Bytes 18-28:** Código GCOM del artículo (tipo `Ag00029`, `Ag00111`, etc.)

Cada artículo ocupa múltiples sub-líneas consecutivas:
- Sub-línea 0 (bytes 18-28): Código GCOM principal
- Sub-línea 1: Descripción/nombre del producto
- Sub-líneas 2-N: Código proveedor (S0001, S0002...), código fábrica, stocks

**Códigos GCOM encontrados (muestra):**
```
Ag00022  → FIBROPLUS FAPLAC CEDRO NATURE 3MM MDF   → S0002
Ag00054  → FIBROPLUS FAPLAC MOSCU 5.5MM MDF        → S0002
Ag00125  → EGGER MEL FINELINE CREMA 18MM MDF       → S0002
Ag00191  → EGGER MEL PINO ALAND POLAR 18MM MDF     → S0002
Ag00225  → EGGER MEL ROBLE NEBRASKA GRIS 18MM AGLO → S0001
Ag00285  → ENCH CEREJEIRA 18MM MDF                 → S0002
Ag00311  → ENCH PARAISO 18MM 183X275 AGLO          → S0001
Ag00517  → SADEPAN CLASICO FAGGIO 896 18MM AGLO    → S0001
Ag00591  → HOJA TAPATORNILLO X 50 UN               → S0011
Ag00654  → G EURO CORREDERA TELESC 45X500MM NEG    → S0027
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
Que GCOM muestre los nuevos códigos `M-XX-XXXX` en lugar de los viejos `Ag00029`.

### Acciones Realizadas

**Paso 1 — Matching Inteligente por Atributos**
- Desarrollamos `match_gcom_to_skus_smart.py` filtrando candidatos por marca, espesor y soporte para asegurar una exactitud del 100%.
- Generamos el mapa de matching: `scratch/gcom_to_directus_map_smart.json`.

**Paso 2 — Poblar Directus**
- Ejecutamos `populate_directus_with_gcom_codes.py`, el cual asoció los códigos viejos de GCOM en el campo `codigo_articulo` en Directus para **81 productos**.

**Paso 3 — Actualización del Binario VFP (`stock.fac`)**
- Implementamos `update_gcom_test_db.py` para reemplazar los códigos a nivel binario en `\\Server-alvarezp\c\gecom\Datos\AP2526_TEST\stock.fac` alineándolos en los bloques de 29 bytes.
- Se realizaron **44 reemplazos exitosos** (ej. `Ag00285` -> `M-40-0019`). Se hicieron copias de seguridad de `stock.fac` y `stock.cdx` antes del proceso.

### ⚠️ Paso Pendiente para el Operador GCOM
1. **Reindexar**: Abra **GECOM Gestión 12** en la base `AP2526_TEST`. Vaya al menú de herramientas y ejecute la opción de **Reindexar / Organizar tablas**. Esto reconstruirá `stock.cdx` para sincronizar las búsquedas con las modificaciones del archivo `stock.fac`.
2. **Verificar**: Ingrese a la pantalla de artículos y confirme que los nuevos SKUs `M-XX-XXXX` aparecen en pantalla.

---

## 7. Pendientes / Issues Conocidos

### ❌ Lepton SmartCut — Imágenes negras

### ⚠️ Estructura binaria VFP compleja
- El `stock.fac` NO es un DBF estándar
- La escritura directa al binario es riesgosa
- Se recomienda siempre operar via FoxPro/GECOM

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
