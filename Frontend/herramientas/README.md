# Agente 5: Frontend / Herramientas & Utilidades
**Jurisdicción**: `/Frontend/herramientas`

## Responsabilidades
- Mantenimiento del Presupuestador de Cortes (`BudgetEngine.astro`).
- Sistema de Smart Match (Sugerencia de combinaciones).
- Lógica de Scoring y Fidelidad de clientes.
- Generación de PDF y exportación para Lepton.

## Estándares
- Lógica pesada aislada en `logic/`.
- El estado del presupuesto debe manejarse vía `logic/budgetStore.js` (Nanostores).
