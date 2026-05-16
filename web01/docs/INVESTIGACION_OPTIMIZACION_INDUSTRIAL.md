# INVESTIGACIÓN: OPTIMIZACIÓN INDUSTRIAL (SmartCut PRO v9.0)
*Actualizado: Mayo 2026 - Conocimiento Superior*

## 1. El Fracaso del "Strip Packing"
El empaquetado por tiras (Strips) es un modelo lineal que fragmenta el tablero en alturas fijas. En melaminas industriales (18mm), esto genera "pérdida de oportunidad" en cada tira. 

## 2. La Arquitectura MAESTRO: MaxRects-BSSF
Para competir con Lepton, el motor debe basarse en la gestión de **Rectángulos Maximales**.

### A. Heurística BSSF (Best Short Side Fit)
Es la regla de oro. Al elegir dónde colocar una pieza, el motor debe:
1. Calcular `leftoverW = rect.w - piece.w`
2. Calcular `leftoverH = rect.h - piece.h`
3. El `score` es `Math.min(leftoverW, leftoverH)`
**Objetivo:** Minimizar la dimensión más pequeña que sobra. Esto obliga a que el espacio restante sea lo más "cuadrado" y usable posible.

### B. Partición Guillotina Dinámica (MAXAS)
Nunca fijar si el corte es Vertical u Horizontal. El motor debe simular ambos cortes y elegir aquel que genere el rectángulo libre de mayor área (`Max Area Split`). Esto evita que una pieza grande "bloquee" el resto del tablero.

### C. Desfragmentación (Rectangle Merge)
Después de cada inserción, el motor debe revisar los rectángulos libres adyacentes. Si dos rectángulos comparten un borde y una dimensión, deben fusionarse en un único rectángulo maximal. Esto soluciona el problema de "las astillas".

## Hito Tecnológico: Motor v11.2 "TREE LOOK-AHEAD" (Mayo 2026)

Hemos logrado una evolución crítica en el motor de optimización, abandonando las heurísticas bidimensionales genéricas por una **Arquitectura de Árbol Binario Estricta (BSP)**.

### Resultados Actuales
- **Eficiencia Alcanzada:** **90.7%** en entornos de alta densidad.
- **Modelo de Corte:** 100% Guillotina Industrial (ejecutable en seccionadoras).
- **Inteligencia:** Búsqueda exhaustiva BSSF con **Look-Ahead de 1 paso**, permitiendo al motor anticipar bloqueos de piezas futuras.
- **Consolidación:** Se eliminó la fragmentación de retazos mediante la gestión jerárquica de nodos libres.

### Próximos Pasos (Hoja de Ruta)

#### 1. Optimización Mobile (UX/UI)
- **Adaptabilidad:** Ajustar el visualizador de planos para que la interacción táctil en teléfonos sea fluida.
- **Visualización:** Implementar zoom dinámico en el canvas para operarios que usan tablets o móviles en el taller.

#### 2. Validación en el Mundo Real
- **Prueba de Corte:** Realizar un seccionado real de una placa optimizada por la v11.2 para verificar la precisión del kerf (4mm) y la facilidad de ejecución para el operario.
- **Feedback del Taller:** Ajustar la lógica de "primer corte" (Long-side vs Short-side) según la comodidad de la maquinaria disponible (TECNO LD).

#### 3. Estética Premium
- **Acabado Visual:** Pulir las transiciones y micro-animaciones en el dashboard para que la herramienta se sienta como un producto industrial de gama alta.

## 3. Meta-Heurística de Búsqueda (Simulated Annealing)
El motor no debe "barajar" al azar. Debe:
1. Empezar con una temperatura alta (Mutación del 30% de la lista de piezas).
2. A medida que encuentra mejores soluciones, bajar la temperatura (Mutación del 5% para refinamiento).
3. Si la eficiencia se estanca durante 50 iteraciones, disparar un "Reheating" (Mutación masiva) para escapar de óptimos locales.

## 4. Función de Aptitud Industrial
`Score Final = (% Eficiencia * 0.8) + (Área_Retazo_Maximal / Área_Total * 0.2)`
Esto garantiza que, ante dos soluciones con la misma eficiencia, el motor siempre elegirá la que deje el sobrante más grande y vendible.
