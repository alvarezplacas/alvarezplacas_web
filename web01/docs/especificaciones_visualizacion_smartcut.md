# Especificaciones de Visualización y UX - SmartCut PRO

Este documento es una ORDEN DIRECTA de comportamiento para el optimizador. Ninguna IA o desarrollador debe alterar estas reglas, ya que han sido validadas para el flujo de trabajo industrial de Alvarez Placas.

## 1. Flujo de Carga de Datos (Keyboard-Flow FULL)
Es OBLIGATORIO que el operario pueda cargar piezas sin tocar el ratón. El ciclo de la tecla `ENTER` debe ser:
1.  **Cantidad** -> Enter
2.  **Largo** -> Enter
3.  **Ancho** -> Enter
4.  **Etiqueta/Nombre** -> Enter
5.  **Tapacanto Superior** -> Enter
6.  **Tapacanto Inferior** -> Enter
7.  **Tapacanto Izquierdo** -> Enter
8.  **Tapacanto Derecho** -> Enter
9.  **AÑADIR PIEZA** (Ejecuta la acción y devuelve el foco a Cantidad para la siguiente pieza).

## 2. Visualización del Plano (Estándar Industrial)
- **Medidas:** Siempre NOMINALES (no descontar cantos en el dibujo).
- **Tapacantos:** Deben representarse con **LÍNEA PUNTEADA/DASHED**.
- **Desperdicio:** Debe representarse con **TRAMA DIAGONAL a 45°** (Hatching).
- **Legibilidad:** El tamaño de fuente de las medidas debe ser dinámico (compensar el zoom) para que siempre se lea a ~12px en pantalla.

## 3. Comportamiento del Visualizador (Canvas)
- **Snapping Magnético:** Umbral de 15px para "pegar" piezas a los bordes o a otras piezas.
- **Colisiones:** Prohibición total de encimar una pieza sobre otra. Si hay solapamiento, la pieza debe rebotar o no permitir el soltado.

## 4. Estética (OKLCH & Glassmorphism)
- Fondo: Negro Industrial (`oklch(15% 0 0)`).
- Acentos: Rojo Alvarez (`oklch(62.8% 0.25 29.23)`).
- Controles: Efecto cristal (Glass) con bordes sutiles y desenfoque de fondo.

## 5. Impresión y Reporte
- El diseño debe ser apto para impresión en Blanco y Negro. Por eso el uso de líneas punteadas y tramas diagonales es CRÍTICO.
