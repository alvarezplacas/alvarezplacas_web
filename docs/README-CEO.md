# Dashboard del CEO (Supervisión)

## Descripción General
El módulo del **CEO** (`/ceo`) es una interfaz de alto nivel, de estricta **sólo lectura** (analítica), diseñada para la supervisión global de las métricas de Alvarez Placas.

**Usuario Principal**: `guillermo@alvarezplacas.com.ar`

El CEO tiene la capacidad de observar el comportamiento financiero y operativo de la empresa sin riesgo de alterar o introducir datos accidentales en las tablas del sistema (como `movimientos_caja`, `facturas_ocr`, etc).

## Estructura del Panel del CEO
El entorno del CEO (`CeoWorkspace.astro`) posee un panel lateral izquierdo (toolbar) que ofrece accesos directos a distintos módulos analíticos:

1. **Control de Correos (IMAP)** (`/ceo`): Visualización del registro automático de correos (principalmente facturas y presupuestos entrantes).
2. **Radar Global Predictivo** (`/ceo/radar`): Módulo de predicción y cruce de datos en tiempo real (para seguimiento de deudores, envíos, despachos y proyecciones).
3. **Buscador de Facturas** (`/ceo/facturas`): Interfaz OCR para búsqueda indexada (texto completo) sobre todos los PDFs emitidos y procesados. Distingue visualmente entre Facturas (FA) y Notas de Crédito (NC).
4. **Dashboard Financiero** (`/ceo/finanzas`): *Módulo recientemente añadido.* Es un réplica de sólo lectura del "Dashboard Ejecutivo" manejado por los vendedores. Contiene:
    - Indicadores KPI (Egresos, Fijos, Variables, Impuestos).
    - Gráfico comparativo de Egresos.
    - Gráfico de tendencias de Ingresos basados en la facturación PDF (OCR).
    - Gráficos de torta (Donut) detallando la distribución del gasto fijo y variable.

## Arquitectura y Lógica de Datos

### Dashboard Financiero (`finanzas.astro`)
El archivo `finanzas.astro` se alimenta de dos APIs principales:
- `GET /api/caja/movimientos`: Extrae todos los movimientos asentados por los vendedores (cajeros) limitados por rango de fecha.
- `GET /api/documentos/ingresos-chart`: Retorna las sumatorias agrupadas de facturación leída por el OCR, diferenciando FA (suman) y NC (restan).

A diferencia de `caja.astro` utilizado por el perfil `Vendedor`, el dashboard del CEO:
- Omite la carga de "Movimientos Locales Offline" (`localStorage`), dado que el CEO audita la "verdad" subida al servidor (PostgreSQL/Directus).
- No incluye el botón `Asentar Movimiento`.

## Notas para futuros desarrolladores
- Cualquier nuevo KPI o gráfico que se añada a las métricas diarias del vendedor/cajero, **se recomienda replicar visualmente** en el entorno del CEO si tiene relevancia gerencial.
- Mantener la premisa de "sólo lectura". Todo formulario de acción (`POST`, `PATCH`, `DELETE`) en el módulo CEO debe ser evitado o tener comprobaciones estrictas en el Backend.
