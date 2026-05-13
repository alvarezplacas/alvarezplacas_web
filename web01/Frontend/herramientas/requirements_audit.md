# Auditoría Técnica: Optimizador Alvarez Placas

Este documento registra los parámetros y funcionalidades críticas del optimizador original para asegurar que la nueva versión (SmartCut v5.0) cumpla con todos los requisitos industriales establecidos.

## 1. Parámetros de Máquina (Inamovibles)
- **Espesor de Sierra (Kerf)**: 4 mm.
- **Refilado Perimetral (Trim)**: 5 mm (Se restan 5mm de cada lado de la placa antes de empezar).
- **Área Útil Real**: Largo - 10mm, Alto - 10mm (5mm + 5mm de cada lado).

## 2. Lógica de Tapacanto (Crítico)
El sistema debe calcular y mostrar el consumo total de tapacanto por espesor:
- **Espesores soportados**: 0.45 mm, 1 mm, 2 mm.
- **Posiciones**: Superior (T), Inferior (B), Izquierdo (L), Derecho (R).
- **Visualización**: Líneas punteadas rojas (`ctx.setLineDash([5, 5])`) en los bordes correspondientes del plano.
- **Cálculo de Metros**: Sumatoria de (Largo o Ancho) según el lado seleccionado, multiplicado por la cantidad de piezas.

## 3. Interfaz y Flujo de Trabajo (UX)
- **Configuración Inicial**:
    - Selector de Marca con dimensiones predefinidas.
    - Inputs manuales para Largo/Alto (Medida Personalizada).
- **Formulario Lepton (Carga Rápida)**:
    - Fila única de datos: CANT | LARGO | ALTO | NOM | GIRAR.
    - Segunda fila: Selectores de Tapacanto (4 lados).
    - Atajos de teclado: `ENTER` para saltar entre campos y añadir.
- **Grilla de Resultados**:
    - Panel de piezas cargadas a la izquierda.
    - Planos de corte a la derecha con scroll independiente.

## 4. Datos Técnicos Requeridos en Pantalla
- [ ] Cantidad total de piezas.
- [ ] Cantidad total de placas.
- [ ] M² Útiles totales.
- [ ] **NUEVO**: Metros totales de Tapacanto 0.45mm.
- [ ] **NUEVO**: Metros totales de Tapacanto 1mm.
- [ ] **NUEVO**: Metros totales de Tapacanto 2mm.
- [ ] Porcentaje de eficiencia por placa.

## 5. Reglas de Giro (Veta)
- Respetar el checkbox "Girar". Si está desactivado, el motor NO puede rotar la pieza bajo ninguna circunstancia para respetar el sentido de la veta del material.

---
**Estado**: Registro completado. Procediendo a la implementación en `beta-optimizado.astro`.
