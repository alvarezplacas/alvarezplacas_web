# MASTER AI DOCUMENTATION: SmartCut PRO v5.6.0

## 🎯 Objetivo del Sistema
SmartCut PRO es un optimizador de placas industrial basado en web, diseñado para reemplazar flujos de trabajo heredados (como Lepton) mediante una interfaz moderna de alto rendimiento sin dependencias de frameworks pesados (React/Vue).

## 🏗️ Arquitectura Técnica
- **Frontend**: Astro 6.0 (Zero JS by default).
- **Lógica de Optimización**: JavaScript Vanilla (ESM) ubicado en `public/herramientas/logic/core/`.
- **Motor**: Algoritmo **FFD (First Fit Decreasing)** optimizado para cortes de guillotina (Strips).
- **Backend**: Conexión directa a Directus para catálogo de maderas y persistencia de pedidos.

## ⚙️ El Motor de Optimización (Industrial Core)
El motor acepta los siguientes parámetros expertos:
- `kerf`: Grosor de la sierra (Estándar: 4mm).
- `trim`: Refilado perimetral de la placa para saneado.
- `steps`: Iteraciones de búsqueda (Estándar: 900 iteraciones para máximo aprovechamiento).
- `philosophy`: `V` (Vertical) o `H` (Horizontal), definiendo la dirección del corte primario.

## 💎 Características UX de Alto Nivel
- **Snapping System**: Magnetismo de bordes con umbral de 15mm para alineación perfecta en el canvas.
- **Glassmorphism UI**: Interfaz basada en transparencia, desenfoque de fondo y animaciones de haz de luz (Shine) en botones.
- **Fast-Data Entry**: Flujo de navegación por teclado mediante la tecla ENTER para carga masiva de piezas.

## 🔗 Integraciones
- **Directus API**: Los pedidos se envían a `/items/pedidos`.
- **Auth**: Muro de registro obligatorio antes del cierre del presupuesto para capturar leads.

---
*Este documento ha sido generado por Antigravity para guiar a futuras IAs en el mantenimiento de este sistema.*
