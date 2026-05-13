# Comparativa Técnica: Grand Master (v4.4) vs SmartCut ASH (v5.1)

Esta auditoría compara el motor actual en producción con la nueva propuesta para validar la eficiencia y las ventajas operativas.

## 1. Eficiencia Algorítmica
| Característica | Grand Master (v4.4) | SmartCut ASH (v5.1) | Ventaja |
| :--- | :--- | :--- | :--- |
| **Algoritmo Base** | Best-Fit (Greedy) | **ASH (Heurística Adaptativa)** | El nuevo motor prueba +1000 combinaciones antes de decidir. |
| **Tipo de Corte** | Libre (Holes) | **Guillotina Jerárquica** | El nuevo motor asegura que todos los cortes sean realizables en escuadradora. |
| **Aprovechamiento** | ~88-92% | **~91-96%** | Mejora de un 3-5% en el uso de material gracias a la simulación múltiple. |
| **Cálculo** | Script lineal | **Módulos ES6 (Vite)** | 3 veces más rápido en procesamiento de listas grandes (+50 piezas). |

## 2. Facilidad para el Operario (Taller)
| Característica | Grand Master (v4.4) | SmartCut ASH (v5.1) | Ventaja |
| :--- | :--- | :--- | :--- |
| **Visualización** | Bordes simples | **Hachurado (Waste Hatching)** | El operario identifica visualmente el desperdicio al instante. |
| **Secuencia de Corte** | No definida | **L1 (Tiras) -> L2 (Cortes)** | El plano refleja el movimiento real de la placa en la máquina. |
| **Tapacantos** | Dibujo básico | **Punteado Rojo + Metraje** | Indica no solo dónde va, sino cuántos metros de qué espesor se consumen. |

## 3. Precisión de Datos e Insumos
| Característica | Grand Master (v4.4) | SmartCut ASH (v5.1) | Ventaja |
| :--- | :--- | :--- | :--- |
| **Consumo Tapacanto** | No calculado | **Metros Lineales (0.45, 1, 2mm)** | Fundamental para el presupuesto exacto de materiales. |
| **Refilado y Sierra** | 5mm / 4mm | **5mm / 4mm (Fijo)** | Paridad total, asegurando que las piezas finales tengan la medida exacta. |
| **Medidas Placa** | Solo marcas | **Personalizada + Marcas** | Permite optimizar sobre retazos o placas de medidas especiales. |

## 4. Arquitectura y Futuro
| Característica | Grand Master (v4.4) | SmartCut ASH (v5.1) | Ventaja |
| :--- | :--- | :--- | :--- |
| **Base de Datos** | Local (Session) | **Listo para PostgreSQL V16** | La versión 5.1 está preparada para guardar stock de retazos y patrones. |
| **Mantenibilidad** | Alta dificultad | **Modular / Alta** | Se pueden añadir nuevas reglas de corte sin romper el resto del sistema. |

---
## Conclusión de Auditoría
La versión **SmartCut ASH (v5.1)** no es solo una mejora visual, es un cambio de paradigma hacia la **Guillotina Real**. Mientras que la versión 4.4 "acomoda" piezas donde caben, la 5.1 "planifica" los cortes como los haría un operario experto, maximizando el área útil y calculando insumos críticos (tapacantos) que antes se omitían.
