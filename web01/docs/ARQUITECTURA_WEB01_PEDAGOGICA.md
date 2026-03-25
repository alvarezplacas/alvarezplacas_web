# 🧠 Ayuda Memoria: Arquitectura Modular "web01" - Alvarez Placas

Este documento está diseñado para orientar a cualquier Agente IA o Desarrollador que tome el proyecto. Aquí se detalla el "esqueleto", la lógica de comunicación y las reglas de oro para mantener el sitio operativo.

---

## 🏗️ 1. Arquitectura General: El Sistema de Proxies
El sitio utiliza **Astro** en modo **SSR (Server-Side Rendering)**. Para mantener una separación total de conceptos, implementamos un sistema de **Proxies de Ruta**:

- **Ubicación Física**: `web01/src/pages/`
- **Comportamiento**: Los archivos en `src/pages` son "cáscaras" vacías. Su única función es importar el componente real desde `Frontend/` o `Backend/` y renderizarlo.
- **Regla de Oro**: NUNCA escribas lógica de negocio o HTML complejo dentro de `src/pages`. Todo debe ir en sus respectivos módulos.

**Ejemplo de un Proxy de Ruta (`src/pages/contacto.astro`):**
```astro
---
import ContactoPage from '@home/pages/contacto.astro';
---
<ContactoPage />
```

---

## 🏷️ 2. El Poder de los Alias (`@`)
Para evitar errores de resolución de módulos ("Failed to load module SSR") y rutas relativas infinitas (`../../../../`), el proyecto utiliza **Vite Aliases** definidos en `astro.config.mjs`.

**Aliases obligatorios:**
- `@frontend`: Acceso a todo el directorio `Frontend/`.
- `@backend`: Acceso a todo el directorio `Backend/`.
- `@home`: Sección principal del sitio (Home, Contacto, etc.).
- `@dashboard`: Paneles de Admin, Cliente y Vendedor.
- `@conexiones`: Cliente de Directus y APIs.
- `@components`: Componentes compartidos (Header, Footer, Buttons).
- `@layouts`: Layouts base del sitio.

---

## 📡 3. Comunicación y Datos (Directus API-First)
El sitio es **totalmente dinámico** y depende de una instancia de **Directus CMS**.

- **Cliente Central**: `web01/Backend/conexiones/directus.js`. Utiliza el SDK oficial de Directus.
- **Variables de Entorno**:
  - `PUBLIC_DIRECTUS_URL`: URL pública para el navegador.
  - `DIRECTUS_URL_INTERNAL`: URL interna (Docker network) para que Astro pida datos en el servidor (más rápido y seguro).
  - `DIRECTUS_TOKEN`: Token estático para acciones administrativas (como guardar mensajes de contacto).

---

## 🛠️ 4. Lógica de Módulos Críticos

### 🧮 Módulo Herramientas (`Frontend/herramientas`)
- **BudgetEngine.astro**: El "corazón" interactivo. Utiliza **NanoStores** para manejar el estado de las placas y piezas sin recargas de página.
- **Motor LEPTOM**: Ubicado en `logic/budgetStore.js`. Transforma los pedidos en un string compatible con el software *Leptom Optimizer* usado por los vendedores.
  - **Formato**: `Cant;Base;Altura;Detalle;Material;Rota;CArr;CAbj;CDer;CIzq`

### 📞 Módulo Contacto (`Frontend/home/pages/contacto.astro`)
- **Categorización**: El formulario diferencia entre *General*, *Cliente* y *Proveedor*.
- **Endpoint**: `/api/contacto.ts` procesa el envío y lo guarda en la colección `mensajes_contacto` de Directus, añadiendo el campo `tipo`.

### 👤 Módulo Dashboards (`Backend/dashboard`)
- **Admin**: Gestión de materiales (Excel), stock y visualización de mensajes.
- **Vendedor**: Seguimiento de pedidos asignados.
- **Cliente**: Creador de presupuestos históricos.

---

## 🚢 5. Despliegue y VPS
- **Docker**: El archivo maestro es `docker-compose.vps.yml`.
- **Flujo de Cambio**:
  1. `git push origin main` (Local)
  2. `git pull origin main` (En el VPS)
  3. `docker compose restart web` (Para aplicar cambios de código Astro).
  4. Si cambias dependencias: `docker compose up -d --build web`.

---

## 🚨 Reglas para el Futuro Agente IA:
1. **No rompas la modularidad**: Si creas una página nueva, ponla en `Frontend/` y crea su proxy en `src/pages/`.
2. **Usa siempre @**: No uses `../../` para importar componentes.
3. **Check de Precios**: El catálogo usa Directus. Si los precios no se ven, revisa la conexión con el contenedor `alvarezplacas_db`.
4. **Reseñas Reales**: La sección de contacto DEBE mantener la data real de Google Maps (4.9⭐) para no perder credibilidad comercial.

---
*Documentación generada por Antigravity-IA para Alvarez Placas SRL.*
