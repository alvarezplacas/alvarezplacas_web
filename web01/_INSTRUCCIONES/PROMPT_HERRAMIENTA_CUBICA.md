# 📋 INSTRUCCIONES PARA EL PRÓXIMO AGENTE IA — CubiCal PRO

## Qué hacer: Leer y usar el prompt completo

El archivo con todas las instrucciones técnicas detalladas está en:

```
C:\Users\javier\.gemini\antigravity\brain\d35a0daa-82fd-4fc6-8750-fec5f57e7b7c\PROMPT_HERRAMIENTA_CUBICA.md
```

## Resumen ejecutivo

Crear la herramienta **CubiCal PRO** en:
- `web01/src/pages/herramientas/cubical.astro` (página con auth guard)
- `web01/src/Frontend/herramientas/CubicalApp.astro` (componente principal)
- `web01/src/pages/api/herramientas/save-cubical.ts` (endpoint Directus)
- `web01/src/Frontend/herramientas/logic/cubical/engine.js` (motor de cálculo)
- `web01/src/Frontend/herramientas/logic/cubical/hardware.js` (tablas de herrajes)

## Regla de oro: NO tocar SmartCutApp.astro
