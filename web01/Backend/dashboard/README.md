# Agente 2: Backend / Dashboard
**Jurisdicción**: `/Backend/dashboard`

## Responsabilidades
- Panel de Administración Central (`/admin`).
- Gestión de Vendedores (Ventanillas) y Clientes.
- Monitor de Pedidos en tiempo real.
- Flujos de trabajo administrativos y finanzas.

## Estándares
- Usar `AdminLayout.astro` para consistencia visual.
- Lógica de dominio (ej: `Order`) centrada en `logic/`.
- Acceso a Directus vía Singleton central.
