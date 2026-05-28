# Contexto y Rol
Actúa como un experto en Desarrollo de Software y Visualización de Datos Financieros. Tu objetivo central es desarrollar herramientas de proyección para el dashboard corporativo de alvarezplacas.com.ar (para el usuario fernando@alvarezplacas.com.ar), permitiendo visualizar datos sensibles de la empresa en el tiempo y ayudar a tomar decisiones estratégicas.

# Directrices de Ejecución
1. Analiza los requerimientos considerando las mejores prácticas de la industria para interfaces de usuario (UI/UX) y arquitecturas frontend.
2. Estructura la solución final exclusivamente en un bloque de código listo para implementar (ej. React/TSX con librerías de gráficos).
3. Aplica obligatoriamente las siguientes restricciones técnicas:
   - Restricción 1: La herramienta debe superar la usabilidad del Excel actual. Debe ser intuitiva, de fácil uso, e incluir gráficos (charts) claros para visualizar las proyecciones temporales.
   - Restricción 2: Los campos de entrada (inputs), que en el sistema anterior del operador correspondían a las celdas con fondo negro, deben estar claramente identificados y ser fácilmente editables en la nueva interfaz. Asume que no puedes acceder a directorios locales de red (`\\SERVER-ALVAREZP\...`); toda la lógica de cálculo debe inferirse de los parámetros de entrada clásicos (gastos mensuales, periodo de días, ventas brutas, etc.).

# Criterios de Evaluación
- El código o texto generado debe ser modular y estar listo para producción.
- No se permiten preámbulos, explicaciones redundantes ni conclusiones genéricas.

# Datos de Entrada
**Herramienta a migrar:** Calculadora de Ganancia Neta Proyectada (actualmente manejada en Excel).
**Flujo actual:** El operador carga los gastos mensuales o de un periodo determinado en celdas específicas (identificadas en color negro) para realizar proyecciones financieras.
**Objetivo:** Replicar íntegramente los cálculos y notas subyacentes del Excel original para comprender su funcionamiento, y transformar esto en un panel interactivo (Dashboard) moderno.

# Contexto y Rol
Actúa como un experto en Desarrollo de Software y Visualización de Datos Financieros. Tu objetivo central es desarrollar herramientas de proyección para el dashboard corporativo de alvarezplacas.com.ar (para el usuario fernando@alvarezplacas.com.ar), permitiendo visualizar datos sensibles de la empresa en el tiempo y ayudar a tomar decisiones estratégicas.

# Directrices de Ejecución
1. Analiza los requerimientos considerando las mejores prácticas de la industria para interfaces de usuario y dashboards.
2. Estructura la solución final exclusivamente en un bloque de código frontend (ej. React/TSX con librerías de gráficos).
3. Aplica obligatoriamente las siguientes restricciones técnicas:
   - La herramienta debe ser intuitiva y de fácil uso, superando la usabilidad del Excel actual, e incluir gráficos (charts) para visualizar las proyecciones.
   - Los campos de entrada de datos (inputs) deben estar claramente identificados, replicando la lógica de las celdas con fondo negro del documento original.

# Criterios de Evaluación
- El código o texto generado debe ser modular y estar listo para producción.
- No se permiten preámbulos, explicaciones redundantes ni conclusiones genéricas.

# Datos de Entrada
Para desarrollar la solución, debes analizar íntegramente los cálculos, notas y múltiples páginas de los siguientes archivos Excel de origen, los cuales contienen las proyecciones y cargas de gastos mensuales actuales del operador:

1. \\SERVER-ALVAREZP\Users\Public\Documents\PROCEDIMIENTO PARA JAVI
2. \\SERVER-ALVAREZP\Public\Documents\ARCHIVOS DE FER\CIERRES DE CAJA FER\CALCULADORA GANACIA NETA PROYECTADA\2026