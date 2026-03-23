# DIRECTIVA SUPREMA: MIGRACIÓN Y REFACTORIZACIÓN
**Objetivo:** Migrar el sitio monolítico actual de Alvarez Placas a una arquitectura modular, escalable y sectorizada (Astro + Directus).

## CÓMO DEBES EXTRAER Y PROCESAR LA INFORMACIÓN:

1. **PROHIBIDO EL SCRAPING EN VIVO:** No intentes adivinar la lógica analizando el DOM de la URL en producción. Te proporcionaré fragmentos del código fuente antiguo (archivos .astro, .js, o esquemas JSON de Directus). Tu trabajo es refactorizar *ese* código.
2. **EXTRACCIÓN DE LÓGICA, NO DE BASURA:** Cuando analices el código viejo, extrae únicamente la "Lógica de Negocio" (qué hace el componente) y el "Contenido" (textos, imágenes). Descarta la estructura HTML/CSS vieja si no cumple con los estándares modernos.
3. **MODULARIZACIÓN EXTREMA:** El código viejo probablemente esté todo mezclado. Tu obligación es destriparlo. Si en un archivo viejo hay un botón, una grilla y una llamada a la API, debes separarlos en tres micro-componentes independientes antes de reescribirlos.
4. **ACTUALIZACIÓN TECNOLÓGICA:** El código viejo es el piso, no el techo. Al reconstruir el componente para tu sector asignado, debes aplicar las mejores prácticas vigentes de Astro (Astro Islands, View Transitions) y CSS moderno. 
5. **EL PRINCIPIO DE "NO ROMPER":** Si extraes una funcionalidad que interactúa con un sector que no te corresponde (ej. el Frontend del Catálogo interactuando con el Backend del Dashboard), debes documentar la necesidad de una API y detenerte. No programes fuera de tu jurisdicción.

Esta es la nueva ruta donde cada agente manejara su porción de codigo para realizar un trabajo modular. 
/alvarezplacas_proyecto
  /Backend
          /conexiones
          /dashboard
  /Frontend
          /catalogo
          /herramientas
          /home