# 🧠 Ayuda Memoria: Antigravity Context (Marzo 2026)

Este documento resume los conocimientos clave y cambios realizados para facilitar la continuidad del desarrollo.

## 🏗️ Arquitectura "Web01"
- **Astro 6 (SSR)**: Rendimiento extremo.
- **Proxies de Ruta**: `src/pages/` solo importa de `Frontend/` o `Backend/`.
- **Aliasing**: Usa siempre `@home`, `@frontend`, `@backend`, `@components`, etc.
- **Directus CMS**: Motor de datos. Conexión central en `@conexiones`.

## ✅ Cambios Realizados

### 1. Contacto y Ubicación
- **Dirección Principal**: Av. Vergara y Bradley, Villa Tesei.
- **Recepción Proveedores**: Av. Vergara 1605, Villa Tesei.
- **Google Maps**: Sincronizado con "Alvarez Placas SRL".

### 2. Presupuestador (Budget Engine)
- **Marcas**:
  - EGGER: 2600 x 1830 mm
  - FAPLAC: 2750 x 1830 mm
  - SADEPAN: 2820 x 1830 mm
- **Cálculo de Sierra**: Se añaden 3mm porimetrales a cada pieza para el cálculo de m².
- **Refilado**: Descuento de 5mm perimetrales (10mm total por eje) en la placa base.
- **Estimaciones**: El sistema calcula placas necesarias y desperdicio, pero advierte que **Leptom** es la fuente oficial.

## 🚨 Reglas de Oro
- **No tocar Dashboards**: Se mantienen aislados en `Backend/dashboard`.
- **SEO & Performance**: Prioridad absoluta en el Frontend Público.
- **Modularidad**: Cada sector tiene sus propias instrucciones en su carpeta.
