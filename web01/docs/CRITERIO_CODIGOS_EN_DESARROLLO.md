# 🧪 CRITERIO DE CODIFICACIÓN JERÁRQUICA — EN DESARROLLO

> **Estado**: 🟡 EN PRUEBA / BORRADOR  
> **Fecha de inicio**: Abril 2026  
> **Autor**: Javier (Alvarez Placas) + Agente IA  
> **Próxima revisión**: Pendiente de validación con sistema contable

---

## ⚠️ IMPORTANTE PARA EL PRÓXIMO AGENTE

Este es un **criterio nuevo en desarrollo** para la codificación y organización del catálogo de Alvarez Placas. **NO está implementado en producción todavía.** El sitio web actualmente usa los datos de `database/catalogo_01.csv` con el sistema viejo.

El objetivo futuro es reemplazar el sistema actual por este nuevo criterio de 7 dígitos, que permitirá integración directa con el programa contable de la empresa.

---

## 🎯 ¿Qué es este sistema?

Un sistema de **codificación numérica jerárquica de 7 dígitos** (similar a un Plan de Cuentas Contable) aplicado al inventario de productos. Permite identificar con un solo número:

- A qué **familia** pertenece el producto (Tableros, Herrajes, etc.)
- Cuál es su **marca** (EGGER, FAPLAC, etc.)
- A qué **sub-categoría** pertenece (Melamínico, MDF, Hilados...)
- Cuál es el **producto específico** dentro de ese grupo

---

## 📐 Estructura del Código (7 dígitos)

```
N  -  B  -  S  -  P P P P
│     │     │     └────── Producto secuencial (0001-9999)
│     │     └──────────── Sub-categoría dentro de la marca (0-9)
│     └────────────────── Marca / Fabricante (0-9)
└──────────────────────── Familia / División (1-9)
```

### Ejemplo práctico:
```
1  1  0  0001  →  1100001  =  Tableros / EGGER / Melamínico Standard / Blanco AGL
1  2  1  0003  →  1210003  =  Tableros / FAPLAC / Texturas-Clásicos / Ceniza
1  4  0  0003  →  1400003  =  Tableros / NOVA / MDF / Guillermina 15mm
```

---

## 🗂️ Bloques por Familia

| Rango | Familia | Archivo CSV |
|---|---|---|
| `1000000 - 1999999` | Tableros | `database/grupo_1_tableros.csv` |
| `2000000 - 2999999` | Herrajes | `database/grupo_2_herrajes.csv` |
| `3000000 - 3999999` | Química | `database/grupo_3_quimica.csv` |
| `4000000 - 4999999` | Tapacantos | `database/grupo_4_tapacantos.csv` |
| `5000000 - 5999999` | Herramientas | `database/grupo_5_herramientas.csv` |

---

## 🏷️ Tabla de Marcas (Tableros - Familia 1)

| Dígito B | Marca | Bloque |
|---|---|---|
| 1 | EGGER | `11xxxxx` |
| 2 | FAPLAC | `12xxxxx` |
| 3 | SADEPAN | `13xxxxx` |
| 4 | NOVA | `14xxxxx` |
| 5 | MASISA | `15xxxxx` (disponible) |
| 6 | ARAUCO | `16xxxxx` (disponible) |
| 7-9 | Futuras marcas | disponibles |

---

## 🗂️ Sub-categorías EGGER (11S*****)

| Dígito S | Sub-categoría | Bloque |
|---|---|---|
| 0 | Melamínico Standard | `1100xxx` |
| 1 | MDF / Fibrofácil | `1110xxx` |
| 2 | Multilaminado | `1120xxx` (disponible) |
| 3 | Finger Joint | `1130xxx` (disponible) |

## 🗂️ Sub-categorías FAPLAC (12S*****)

| Dígito S | Sub-categoría | Bloque |
|---|---|---|
| 0 | Melamínico Standard | `1200xxx` |
| 1 | Melamínico Textura / Clásicos | `1210xxx` |
| 2 | Línea Hilados | `1220xxx` |
| 3 | Línea Nature | `1230xxx` |
| 4 | Línea Mesopotamia | `1240xxx` |
| 5 | MDF crudo | `1250xxx` (disponible) |

---

## 📄 Formato de los archivos CSV

- **Separador**: punto y coma (`;`) — compatible con Excel en español.
- **Filas de leyenda**: empiezan con `##` y explican el código. Se deben **ignorar** en el script de ingesta.
- **Sin columna "marca"**: la marca se deduce del código (dígito 2).
- **Sin columna "familia"**: se deduce del código (dígito 1).
- **Espesor y sustrato**: son columnas separadas (no forman parte del código base).

### Para abrir en Excel:
1. Excel → **Datos** → **Desde texto/CSV**
2. Seleccionar el archivo
3. Separador: **Punto y coma**
4. Clic en **Cargar**

---

## 🔄 Estado de implementación

| Tarea | Estado |
|---|---|
| Definir estructura de 7 dígitos | ✅ Completado |
| Crear archivos CSV por grupo | ✅ Completado |
| Migrar 69 productos actuales al nuevo código | ✅ Completado (en grupo_1_tableros.csv) |
| Actualizar script de ingesta (`ingest_full_catalog_v16.mjs`) | ⏳ Pendiente |
| Agregar campo `codigo_base` en colección `materiales` de Directus | ⏳ Pendiente |
| Validar integración con sistema contable | ⏳ Pendiente |
| Carga masiva de 2200+ productos con nuevo sistema | ⏳ Pendiente |

---

## 📁 Archivos relacionados

- `database/grupo_1_tableros.csv` — Datos actuales migrados
- `database/grupo_2_herrajes.csv` — Plantilla vacía
- `database/grupo_3_quimica.csv` — Plantilla vacía
- `database/grupo_4_tapacantos.csv` — Plantilla vacía
- `database/grupo_5_herramientas.csv` — Plantilla vacía
- `scripts/ingest_full_catalog_v16.mjs` — Script actual (usa catalogo_01.csv, a migrar)

---

## 🚫 Lo que NO cambiar por ahora

El sitio web en producción (`alvarezplacas.com.ar`) sigue usando:
- `database/catalogo_01.csv` como fuente de datos
- El script `scripts/ingest_full_catalog_v16.mjs`
- La colección `materiales` en Directus con el esquema actual

**No migrar a producción hasta que el criterio esté validado y aprobado por el equipo.**
