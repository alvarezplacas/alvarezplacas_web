# Investigación: Optimización de Corte Industrial y UX de Alto Rendimiento

## 1. Introducción
Este documento detalla el estudio realizado sobre las mejores prácticas internacionales y locales en sistemas de optimización de corte de melamina. El objetivo es transformar el actual "SmartCut PRO" en un motor de presupuesto y optimización líder en el mercado.

---

## 2. Referentes de la Industria
### 2.1 Lepton Optimizer (Estándar Industrial)
**Lepton** es el referente indiscutido en el Cono Sur para la gestión de carpintería industrial.
- **Proceso de Información**: Utiliza archivos estructurados (CSV/XML) para alimentar seccionadoras CNC.
- **Automatización**: Su motor permite la "Integración Web", donde el cliente carga datos y el servidor procesa el plano de corte en segundos.
- **Feedback**: Reportes técnicos detallados que incluyen metros lineales de tapacanto, desperdicio real y costo de mano de obra.

### 2.2 Faplac Online (UX de Selección)
La plataforma de **Faplac** destaca por eliminar la fricción en la entrada de datos:
- **Catálogo Visual**: No se "escribe" el color; se busca en un catálogo visual con imágenes de alta resolución.
- **Filtros Dinámicos**: Si seleccionas la línea "Mesopotamia", solo te muestra los diseños de esa línea.
- **Validación Estricta**: No permite ingresar combinaciones imposibles (ej. un color que no existe en 15mm).

---

## 3. Puntos de Mejora Críticos (Gap Analysis)
Tras analizar nuestro optimizador actual frente a la competencia, identificamos los siguientes "gaps":
1. **Ambigüedad en el Material**: Actualmente el usuario escribe el diseño (ej. "Sahara"). Esto genera errores de tipeo y confusión con las marcas.
2. **Falta de Tapacantos (Edge Banding)**: La optimización industrial moderna requiere definir qué bordes van pegados y con qué espesor (0.4mm o 2mm).
3. **Desconexión del Catálogo**: El sistema no sabe si el material seleccionado tiene stock o precio actualizado en Directus.

---

## 4. El Proceso de Información Automatizado
Para lograr un flujo "superador", la información debe fluir de la siguiente manera:
1. **Entrada**: Selección asistida desde la base de datos PostgreSQL v16.
2. **Procesamiento**: El algoritmo de SmartCut recibe objetos JSON validados, no strings aleatorios.
3. **Salida**: 
    - Plano de corte (SVG/Canvas).
    - Reporte de insumos (Placas + Tapacantos + Pegamento).
    - Presupuesto final (Precio Directus + Costo de Servicio).

---

## 5. Conclusión de Investigación
El éxito de un optimizador web no radica solo en el algoritmo de corte, sino en la **seguridad de los datos**. Si el cliente no puede equivocarse al elegir el color, el resto del proceso industrial fluye sin intervenciones humanas.

---
*Investigación realizada para Alvarez Placas - Mayo 2026*
