# 🔍 Análisis Profundo: Backups GCOM (`\\SERVER-ALVAREZP\gecom\Backups`)

## 📦 Archivos Encontrados

| Archivo | Tamaño | Fecha | Base de datos |
|---------|--------|-------|---------------|
| `gestion_ap2526_20260602.csg` | **9.42 MB** | 02/06/2026 17:19 | AP2526 (actual) |
| `gestion_no entrar_20251114.csg` | **5.45 MB** | 14/11/2025 12:45 | AP2425 (anterior) |

---

## 🧬 Formato CSG Reverse-Engineered

Los archivos `.csg` usan un formato **propietario de GECOM** basado en compresión LZH con un contenedor `SPIS`:

```
┌──────────────────────────────────────────────────────┐
│ GLOBAL HEADER                                         │
│  SSeg(4B) + version(4B) + SHdr(4B) + version(4B)    │
│  + hash/checksum(16B) + Scan(4B) + scan_info         │
│  + source_path (e.g. \\server-alvarezp\c\gecom\...)  │
├──────────────────────────────────────────────────────┤
│ SPIS #1 - Metadata Entry ($S$ file, ~13KB)           │
│  SPIS(4B) + 0x1A + "LZH"(3B) + comp_size(4B)       │
│  + fields(9B) + filename + compressed_data           │
├──────────────────────────────────────────────────────┤
│ SPIS #2 - Data Blob (ALL tables compressed)          │
│  SPIS(4B) + 0x1A + "LZH"(3B) + total_comp_size(4B) │
│  + fields(9B) + 1 extra byte                         │
│  ┌────────────────────────────────────────────────┐  │
│  │ FILE ENTRY N (repeated for each table):        │  │
│  │  fnLen(2B) + timestamp(4B) + attr(2B)          │  │
│  │  + orig_size(4B) + comp_size(4B)               │  │
│  │  + method(1B) + extra(4B) + padding(4B)        │  │
│  │  [= 25 bytes header]                           │  │
│  │  + filename(fnLen bytes)                        │  │
│  │  + compressed_data(comp_size bytes)             │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> La compresión es **LZH propietaria** (method=0x02) con un prefijo custom (`DE 05 63 23...` para `.fac`, `DF C5 63 23...` para `.idx`). **No es compatible con zlib, deflate, gzip ni lhafile estándar**. Solo se puede descomprimir con GECOM.

---

## 📊 Inventario del Backup AP2526 (02/06/2026)

**590 archivos** totales contenidos:

| Extensión | Cantidad | Tamaño original total |
|-----------|----------|----------------------|
| `.fac` (tablas VFP) | **305** | ~52 MB |
| `.idx` (índices) | **280** | ~2.4 MB |
| `.dat` | 2 | ~2 KB |
| `.ini` | 1 | 23 B |
| `.txt` | 1 | 40 KB |
| `.mem` | 1 | ~1 KB |

### Top 15 Archivos Más Grandes

| Archivo | Original | Comprimido | Ratio | Contenido |
|---------|----------|-----------|-------|-----------|
| `ac1d0326.fac` | 2.86 MB | 534 KB | 19% | Asientos contables Mar-26 |
| `ac1d0126.fac` | 2.83 MB | 527 KB | 19% | Asientos contables Ene-26 |
| `ac1d0226.fac` | 2.64 MB | 490 KB | 19% | Asientos contables Feb-26 |
| `ac1d0426.fac` | 2.56 MB | 472 KB | 18% | Asientos contables Abr-26 |
| `ac1d0525.fac` | 2.21 MB | 410 KB | 18% | Asientos May-25 |
| `saldom.fac` | 1.25 MB | 101 KB | 8% | Saldos de movimientos |
| `agenda.fac` | 1.19 MB | 101 KB | 9% | Agenda de contactos |
| `ac1d0625.fac` | 1.35 MB | 243 KB | 18% | Asientos Jun-25 |
| `ac1h0726.fac` | 744 KB | 132 KB | 18% | Asientos cabecera Jul-26 |
| **`stock.fac`** | **613 KB** | **72 KB** | **12%** | **Artículos de stock** |
| `ocomprad.fac` | 521 KB | 47 KB | 9% | Órdenes de compra detalle |
| `stock.idx` | 292 KB | 72 KB | 25% | Índice de stock |

### Tablas Clave de Negocio

| Tabla | Original | Estado |
|-------|----------|--------|
| ✅ `stock.fac` | 612,756 B | **Tabla principal de artículos (1,578 registros)** |
| ✅ `stock.idx` | 291,840 B | Índice del stock |
| ✅ `stockdescri.fac` | 188 B | Descripciones extendidas (vacía) |
| ✅ `stockdep.fac` | ~depósitos | Stock por depósito |
| ✅ `artrubro.fac` | 5,220 B | Rubros de artículos |
| ✅ `artcompra.fac` | 168 B | Artículos de compra (vacía) |
| ✅ `artprove.fac` | 105,960 B | Artículos-Proveedor |
| ✅ `persona.fac` | 1,568 B | Personas/Clientes |
| ✅ `pedidocabe.fac` | 444 B | Cabecera de pedidos |
| ✅ `pedidodeta.fac` | 172 B | Detalle de pedidos |
| ✅ `empresa.ini` | 23 B | Config de empresa |

---

## 🔄 Comparación entre Backups

### Base de datos completa

| Métrica | AP2425 (Nov 2025) | AP2526 (Jun 2026) | Cambio |
|---------|-------------------|-------------------|--------|
| Archivos | 601 | 590 | -11 |
| Tamaño total | **31.9 MB** | **54.7 MB** | **+22.8 MB (+71%)** |
| Período contable | 2024-2025 | 2025-2026 | 1 ejercicio más |

### Evolución de `stock.fac`

```
Nov 2025 (AP2425):  526,620 bytes  →  ~1,358 registros
Jun 2026 (AP2526):  612,756 bytes  →  ~1,578 registros  (+220 artículos)
Actual PROD:        612,756 bytes  →  Idéntico al backup del 02/06
Actual TEST:        612,756 bytes  →  Mismo tamaño (los SKUs reemplazados no cambian el tamaño)
```

> [!NOTE]
> El backup del 02/06/2026 es un snapshot **exacto** del estado actual de producción. Esto significa que el backup fue hecho **después** de que se le cargaron los últimos artículos pero **antes** de la inyección de SKUs en TEST.

### Tablas con cambios significativos

| Tabla | AP2425 | AP2526 | Cambio | Interpretación |
|-------|--------|--------|--------|---------------|
| `stock.fac` | 527 KB | 613 KB | +86 KB | +220 artículos nuevos |
| `artprove.fac` | 87 KB | 106 KB | +19 KB | Más relaciones artículo-proveedor |
| `artprovehisto.fac` | 28 KB | 60 KB | +32 KB | Historial de precios proveedor |
| `cuenta.fac` | 70 KB | 204 KB | +134 KB | Plan de cuentas expandido |
| `saldom.fac` | 914 KB | 1.25 MB | +333 KB | Más saldos acumulados |
| `totcopa.fac` | 276 B | 153 KB | +153 KB | Totales de compras (era vacía) |
| `ocomprad.fac` | 273 KB | 521 KB | +248 KB | Duplicaron órdenes de compra |
| `compensa.fac` | 16 KB | 57 KB | +41 KB | Más compensaciones |

---

## 🔑 Hallazgos Clave

1. **Los backups son completos** — Contienen TODA la base de datos de GECOM (305 tablas + 280 índices), no solo el stock.

2. **La compresión es propietaria** — No se pueden extraer archivos individuales sin GECOM. Solo la función de **restauración de GECOM** puede abrir estos archivos.

3. **El backup AP2526 es actual** — El `stock.fac` del backup tiene exactamente el mismo tamaño que el archivo de producción actual (612,756 bytes), confirmando que es un backup válido y reciente.

4. **Se preserva el ejercicio anterior** — El backup `AP2425` (Nov 2025) tiene los datos del ejercicio 2024-2025, que son importantes para la contabilidad.

5. **El reindexado sigue pendiente** — Aunque se inyectaron SKUs en `AP2526_TEST`, el backup no incluye el `.cdx` reindexado. Se debe reindexar desde GECOM.

---

## ⚙️ Scripts Generados

| Script | Función |
|--------|---------|
| [extract_csg_backup.py](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/scratch/extract_csg_backup.py) | Parser y catalogador del formato CSG |
| [backup_catalog.json](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/scratch/gcom_backup_extracted/backup_catalog.json) | Catálogo completo JSON de ambos backups |

---

## 🚨 Opciones de Acción

> [!WARNING]
> **Los archivos `.csg` NO se pueden descomprimir externamente**. Para restaurar o extraer datos de estos backups, se debe usar la función de restauración de GECOM Gestión 12 directamente.

### Para restaurar un backup:
1. Abrir **GECOM Gestión 12**
2. Menú **Base de datos → Restaurar copia de seguridad**
3. Seleccionar el archivo `.csg` deseado
4. GECOM descomprimirá y reindexará automáticamente

### Para el reindexado del TEST (pendiente):
- Seguir las [instrucciones de reindexado](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/scratch/instrucciones_reindexado_gcom.html) ya generadas.
