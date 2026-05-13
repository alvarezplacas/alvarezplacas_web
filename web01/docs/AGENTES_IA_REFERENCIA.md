# 🏗️ Alvarez Placas v16 — Referencia Técnica para Agentes IA
**Última actualización:** 2026-05-11 14:48 → 18:05 | **Actualizado por:** Antigravity (Google Deepmind)
**Estado del sistema:** ✅ Producción estable | 📦 Catálogo Sincronizado

---

## 🚨 LEER PRIMERO — REGLAS QUE NO SE DEBEN TOCAR

> Estas configuraciones fueron corregidas con mucho trabajo. Cambiarlas rompe el sistema.

### ❌ NO MODIFICAR — `src/middleware.ts`
El middleware actual es la versión DEFINITIVA y CORRECTA. Fue reescrito completamente el 2026-05-11 para resolver un bug crítico de redirección en loop.

```typescript
// ✅ ASÍ DEBE QUEDAR — NO AGREGAR NI QUITAR NADA
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
    const path = context.url.pathname;
    const isPublic = path.startsWith('/_astro') || path.startsWith('/favicon') || path === '/mantenimiento';
    const isLoginPage = path === '/login' || path === '/admin/login' || path === '/vendedor/login';
    const isApiRoute = path.startsWith('/api');

    if (isPublic || isLoginPage || isApiRoute) return next();

    if (path.startsWith('/admin')) {
        const session = context.cookies.get('admin_session');
        if (!session || session.value !== 'authenticated_javier') return context.redirect('/login');
    }
    if (path.startsWith('/vendedor')) {
        const session = context.cookies.get('seller_session');
        if (!session) return context.redirect('/login');
    }
    if (path.startsWith('/cliente')) {
        const session = context.cookies.get('client_session');
        if (!session) return context.redirect('/login');
    }
    return next();
});
```

**¿Por qué no tocarlo?**
- La versión anterior consultaba Directus en CADA request → performance terrible y crashes.
- La versión anterior redirigía a `/admin/login` (ruta que NO existe) → loop infinito.
- NO volver a agregar `import { directus } from '@conexiones/directus.js'` acá.

### ❌ NO MODIFICAR — `astro.config.mjs` (clave: prefetch)
```javascript
// ✅ DEBE ESTAR ASÍ
prefetch: {
  prefetchAll: false,   // ← NO cambiar a true. Con true, el browser pre-descarga rutas
  defaultStrategy: 'hover'  // protegidas SIN cookie → el middleware las rechaza → loop
}
```

### ❌ NO MODIFICAR — `security.checkOrigin`
```javascript
// ✅ DEBE ESTAR ASÍ
security: {
  checkOrigin: false  // ← Sin esto, el login detrás de Caddy da 403 Forbidden
}
```

### ❌ NO CREAR clientes de Directus sin token
```javascript
// ❌ NUNCA HACER ESTO en páginas SSR — causa ResponseSentError y crash
import { createDirectus, rest } from '@directus/sdk';
const directus = createDirectus('https://...').with(rest()); // SIN TOKEN

// ✅ SIEMPRE importar desde el archivo central
import { directus, readItems } from '@conexiones/directus.js';
```

---

## 📡 Infraestructura de Producción

### VPS
| Dato | Valor |
|---|---|
| IP | `144.217.163.13` |
| SSH Key (local) | `d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\alvarez_vps.key` |
| Acceso | `ssh -i alvarez_vps.key root@144.217.163.13` |
| Info Extra | Ver `/root/INFRAESTRUCTURA_VPS.md` en el servidor |

### Contenedores Docker
| Contenedor | Función | Estado |
|---|---|---|
| `alvarezplacas_web` | Astro SSR Node | ✅ Activo |
| `alvarezplacas_directus_v16` | CMS Directus 11.1.0 | ✅ Activo |
| `alvarezplacas_db_v16` | PostgreSQL 16 | ✅ Activo |
| `alvarezplacas_meili` | MeiliSearch v1.12 | ✅ Activo |
| `alvarezplacas-minio` | Almacenamiento S3 | ✅ Activo |

### URLs
| Servicio | URL |
|---|---|
| Sitio web | `https://alvarezplacas.com.ar` |
| Directus (admin CMS) | `https://admin.alvarezplacas.com.ar` |
| Webmail | `https://mail.alvarezplacas.com.ar` |

### Variables de entorno del contenedor web
```env
PUBLIC_DIRECTUS_URL=https://admin.alvarezplacas.com.ar
DIRECTUS_TOKEN=alvarez-api-token-v16-2026
HOST=0.0.0.0
PORT=4321
```

---

## 🚀 DEPLOY — Regla de Oro (OBLIGATORIO)

El contenedor solo sirve el `dist/` compilado. Después de **cualquier** cambio de código:

```bash
# Desde: d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\

# 1. Subir archivos al VPS
scp -i alvarez_vps.key -r web01/src/ root@144.217.163.13:/opt/alvarez_v16/web01/site/web01/
scp -i alvarez_vps.key -r web01/Frontend/ root@144.217.163.13:/opt/alvarez_v16/web01/site/web01/
scp -i alvarez_vps.key -r web01/Backend/ root@144.217.163.13:/opt/alvarez_v16/web01/site/web01/

# 2. Compilar DENTRO del contenedor (SIEMPRE, sin excepción)
ssh -i alvarez_vps.key root@144.217.163.13 "docker exec alvarezplacas_web npm run build"

# 3. Reiniciar
ssh -i alvarez_vps.key root@144.217.163.13 "docker restart alvarezplacas_web"

# Verificar que arrancó bien
ssh -i alvarez_vps.key root@144.217.163.13 "docker logs alvarezplacas_web --tail 10"
```

---

## 🗂️ Estructura del Proyecto

```
d:\Alvarezplacas_2026\WEB-alvarezplacas_astro\Alvarezplacas\
└── web01/
    ├── astro.config.mjs            ← Config Astro (NO tocar prefetch ni checkOrigin)
    ├── src/
    │   ├── middleware.ts           ← ⚠️ CRÍTICO — NO MODIFICAR (ver arriba)
    │   └── pages/
    │       ├── admin/              ← Re-exportadores que apuntan a Backend/dashboard
    │       │   ├── index.astro     → importa de @backend/dashboard/pages/admin/index.astro
    │       │   ├── vendedores.astro → importa de @backend/dashboard/pages/admin/vendedores.astro
    │       │   ├── clientes.astro
    │       │   ├── consultas.astro
    │       │   ├── login.astro     ← Re-exporta @home/pages/login.astro
    │       │   └── productos.astro
    │       ├── vendedor/           ← Re-exportadores del panel vendedor
    │       ├── cliente/            ← Re-exportadores del panel cliente
    │       └── api/
    │           ├── auth/
    │           │   ├── login-client.ts     ← Login UNIFICADO (clientes, vendedores, admin)
    │           │   ├── register-client.ts  ← Solo crea clientes (NO vendedores)
    │           │   └── logout.ts
    │           ├── messages.ts             ← fromId se extrae de cookie automáticamente
    │           └── admin/
    │               ├── create-seller.ts
    │               ├── set-seller-password.ts   ← NUEVO (2026-05-11)
    │               └── toggle-seller-status.ts  ← NUEVO (2026-05-11)
    ├── Frontend/
    │   ├── home/pages/login.astro          ← Login único para todos los roles
    │   ├── cliente/pages/
    │   │   ├── index.astro                 ← Dashboard cliente (usa @conexiones/directus.js)
    │   │   └── registro.astro
    │   └── shared/components/
    ├── Backend/
    │   ├── conexiones/directus.js          ← ⚠️ INSTANCIA CENTRAL con token (usar siempre)
    │   └── dashboard/pages/
    │       ├── admin/
    │       │   ├── index.astro
    │       │   ├── vendedores.astro        ← REESCRITO (2026-05-11) con gestión de contraseñas
    │       │   ├── clientes.astro
    │       │   └── consultas.astro
    │       ├── vendedor/
    │       │   ├── index.astro             ← Usa vendedor_id (NO vendedor_asignado)
    │       │   ├── clientes.astro          ← Usa name (NO nombre)
    │       │   ├── pedidos.astro
    │       │   └── mensajes.astro
    │       └── cliente/
    │           └── pedidos.astro           ← Usa resumen_visible (NO detalles)
    └── docs/
        └── AGENTES_IA_REFERENCIA.md        ← Este archivo
```

---

## 🗃️ Base de Datos — Campos REALES (Directus / PostgreSQL 16)

> **Token API:** `alvarez-api-token-v16-2026`
> **URL:** `https://admin.alvarezplacas.com.ar`

### `clientes`
| Campo real | ⚠️ Campo INCORRECTO (no usar) |
|---|---|
| `name` | ~~`nombre`~~ |
| `vendedor_id` (FK) | ~~`vendedor_asignado`~~ |
| `phone` | — |
| `address` | — |
| `scoring` | — |
| `debt_amount` | — |
| `client_number` | Formato: `ALV-XXXX` |
| `password_hash` | Hash bcrypt |
| `status` | `active` / `inactive` |
| `fin_status` | `clean` / `overdue` / `blocked` |

### `vendedores`
| Campo real | ⚠️ Campo INCORRECTO (no usar) |
|---|---|
| `name` | ~~`nombre`~~ |
| `email` | — |
| `whatsapp` | — |
| `password_hash` | Hash bcrypt (se asigna desde /admin/vendedores) |
| `role` | `seller` / `admin` |
| `status` | `active` / `inactive` |

**Vendedores en producción (colección `vendedores` en Directus):**
| ID | Nombre | Email | Rol en la web |
|---|---|---|---|
| 1 | Ariel Santivañez | ariel@alvarezplacas.com.ar | Vendedor → `/vendedor` |
| 2 | Facundo | facundo@alvarezplacas.com.ar | Jefe de ventas → `/vendedor` |
| 3 | Braian Santivañez | braian@alvarezplacas.com.ar | Vendedor → `/vendedor` |

> **OJO:** `facundo@alvarezplacas.com.ar` es el **jefe de ventas**, NO el superadmin del sitio. El superadmin es Javier (`admin@alvarezplacas.com.ar`) y sus credenciales son **independientes de esta tabla**.

### `pedidos`
| Campo real | ⚠️ Campo INCORRECTO (no usar) |
|---|---|
| `resumen_visible` | ~~`detalles`~~ |
| `id` (integer) | No es UUID — no usar `.split('-')` |
| `status` | `presupuesto` / `en_produccion` / `en_corte` / `terminado` / `en_reparto` / `entregado` |
| `tracking_id` | Formato: `TRK-XXXX` |
| `vendedor_id` | ~~`vendedor_asignado`~~ |

### `mensajes`
| Campo | Tipo | Nota |
|---|---|---|
| `remitente_id` | string | IDs de clientes/vendedores como string |
| `destinatario_id` | string | — |
| `mensaje` | text | — |
| `visto` | boolean | — |
| `prioridad` | string | `alta` / `media` / `baja` |

---

## 🔐 Autenticación — Sistema de Cookies

### Flujo de Login (`POST /api/auth/login-client`)
- **Input:** `FormData` con `email` y `password` (NO JSON)

#### ⚠️ 3 CARRILES SEPARADOS — NO MEZCLAR

| Carril | Email | Verificación | Cookie → Destino |
|---|---|---|---|
| **Superusuario** | `admin@alvarezplacas.com.ar` | **Hardcodeado** — NO consulta la BD | `admin_session` → `/admin` |
| **Vendedores/Jefe** | Cualquier email `@alvarezplacas.com.ar` | Busca en colección `vendedores` + bcrypt | `seller_session` → `/vendedor` |
| **Clientes** | Email del cliente | Busca en colección `clientes` + bcrypt | `client_session` → `/cliente` |

> **CRÍTICO:** El superusuario (`admin@alvarezplacas.com.ar` / `JavierMix2026!`) se verifica con una comparación directa en el código. **NUNCA** busca en la base de datos. Esto garantiza que funcione aunque Directus esté caído o la tabla `vendedores` sea modificada.

### 🗓️ 2026-05-11 — Estabilización del Catálogo Administrativo
**Objetivo:** Activar selectores dinámicos y visibilidad de productos.
- **Logrado:**
    - Autenticación vía Token de Admin en SSR (Evita 403 Forbidden).
    - Normalización de nombres de tablas: `Productos`, `Rubros`, `marcas`.
    - Implementación de `status=*` para visualizar productos en "Borrador".
    - Conectividad vía Red Interna Docker (`8055`) para estabilidad.
    - Mapeo dinámico de campos capitalizados (`Nombre`, `SKU`).
- **Estado:** ✅ Operativo y validado visualmente.

### Cookies
| Cookie | Valor | MaxAge | Ruta protegida |
|---|---|---|---|
| `admin_session` | `'authenticated_javier'` | 24h | `/admin/*` |
| `seller_session` | ID del vendedor (string) | 24h | `/vendedor/*` |
| `client_session` | ID del cliente (string) | 30 días | `/cliente/*` |

### Registro de Clientes (`POST /api/auth/register-client`)
- **Solo crea en colección `clientes`** — NUNCA en `vendedores`
- Bloquea emails `@alvarezplacas.com.ar` desde el formulario público
- Bloquea si el email ya existe en `vendedores` (mensaje genérico)
- Hashea con bcrypt 10 rounds
- Auto-asigna vendedor random si `vendedor_id === 'auto'`

---

## 👨‍💼 Gestión de Vendedores (NUEVO 2026-05-11)

**Los vendedores NO tienen registro público. Solo se gestionan desde el panel admin.**

### Panel Web: `https://alvarezplacas.com.ar/admin/vendedores`
Funciones disponibles desde el browser:
- **🔑 CONTRASEÑA** → Asigna o cambia contraseña. Genera hash bcrypt automáticamente.
- **✅ ACTIVAR / 🔴 DESACTIVAR** → Cambia `status` del vendedor en Directus.
- **➕ Nuevo Vendedor** → Crea vendedor con contraseña inicial hasheada.

| Endpoint | Método | Función |
|---|---|---|
| `/api/admin/set-seller-password` | POST | `{ sellerId, password }` → hashea y guarda |
| `/api/admin/toggle-seller-status` | POST | `{ sellerId, status }` → activa/desactiva |
| `/api/admin/create-seller` | POST | `{ name, email, whatsapp, password, role }` |
| `/api/admin/create-client` | POST | `{ name, email, phone, address, vendedor_id }` |
| `/api/admin/update-client` | POST | `{ id, name, email, phone, address, vendedor_id, status }` |
| `/api/admin/delete-client` | POST | `{ id }` (borrado físico) |

---

## 📨 API de Mensajería

### `POST /api/messages`
```json
{
  "content": "texto del mensaje",
  "toId": "2",
  "prioridad": "media"
}
```
> `fromId` NO hace falta en el body — se extrae automáticamente de `client_session` o `seller_session` cookie.

---

## 🐛 Historial de Bugs Críticos Resueltos

| Fecha | Bug | Causa | Solución |
|---|---|---|---|
| 2026-05-11 | Loop infinito en `/admin/vendedores` | Middleware redirigía a `/admin/login` (no existe) | Reescribir middleware completo |
| 2026-05-11 | Loop por prefetch | `prefetchAll: true` pre-descargaba rutas protegidas | Cambiar a `prefetchAll: false` |
| 2026-05-11 | `ResponseSentError` crash | Directus sin token en `cliente/index.astro` | Usar `@conexiones/directus.js` |
| 2026-05-11 | `403 field "nombre"` | Campo real es `name` | Corregir todas las queries |
| 2026-05-11 | `403 field "vendedor_asignado"` | Campo real es `vendedor_id` | Corregir todas las queries |
| 2026-05-11 | `403 field "detalles"` | Campo real es `resumen_visible` | Corregir queries de pedidos |
| 2026-05-11 | `400 fromId faltante` en chat | Frontend no enviaba fromId | API lo extrae de cookie |
| 2026-05-11 | `403 en login` POST | `checkOrigin: true` bloqueaba Caddy | `checkOrigin: false` en config |
| Anterior | `p.id.split('-')` crash | IDs de pedidos son integer no UUID | Usar `p.tracking_id \|\| p.id` |

---

## 🦺 Footer del Sitio

El footer es **minimalista por diseño**. Solo tiene:
- Copyright `© 2026 Javier Mix`
- Un ícono ✉️ de webmail → `https://mail.alvarezplacas.com.ar/`

**¿Por qué no tiene links de admin/vendedor?**  
Todos los accesos internos usan el **mismo formulario `/login`** que ya existe en el header (botón "Club"). Tener íconos extra en el footer que van al mismo lugar era ruido visual innecesario.

**❌ NO agregar links de login al footer** — ya están cubiertos por el header.

---

## 🔑 UX — Ícono de Ojo en Contraseñas

El modal "Cambiar Contraseña" de `/admin/vendedores` tiene íconos 👁 en ambos campos (`nueva-pass` y `confirmar-pass`). La función JS `togglePass(inputId, btn)` está definida en el mismo archivo `vendedores.astro` como `<script is:inline>`.

---

## 📋 Estado del Sistema (2026-05-11)

| Función | Estado | URL |
|---|---|---|
| Login (clientes, vendedores, admin) | ✅ OK | `/login` |
| Registro de clientes | ✅ OK | `/cliente/registro` |
| Dashboard cliente | ✅ OK | `/cliente` |
| Pedidos del cliente | ✅ OK | `/cliente/pedidos` |
| Dashboard vendedor | ✅ OK | `/vendedor` |
| Chat cliente→vendedor | ✅ OK | Desde `/cliente` |
| Panel admin — Dashboard | ✅ OK | `/admin` |
| Panel admin — Vendedores | ✅ OK | `/admin/vendedores` |
| Panel admin — Clientes | ✅ OK | `/admin/clientes` |
| Edición/Borrado de clientes | ✅ OK (NUEVO) | `/admin/clientes` |
| Gestión contraseñas vendedores | ✅ OK (NUEVO) | `/admin/vendedores` |
| Catálogo de productos | ✅ OK | `/catalogo` |
| SmartCut Optimizer | ✅ OK | `/herramientas/presupuestador` |
| Middleware de rutas | ✅ OK (REESCRITO) | `src/middleware.ts` |
| Login superusuario hardcodeado | ✅ OK (2026-05-11) | `login-client.ts` |
| Ícono ojo en cambio de contraseña | ✅ OK (2026-05-11) | `vendedores.astro` |
| Footer simplificado | ✅ OK (2026-05-11) | `Footer.astro` |

---

## 🗝️ Credenciales de Acceso

### Superusuario (sitio web)
| Email | Contraseña | Dashboard | Verificación |
|---|---|---|---|
| `admin@alvarezplacas.com.ar` | `JavierMix2026!` | `/admin` | Hardcodeada en `login-client.ts` |

### Equipo comercial (colección `vendedores`)
| Nombre | Email | Rol | Dashboard |
|---|---|---|---------|
| Facundo | `facundo@alvarezplacas.com.ar` | Jefe de ventas | `/vendedor` |
| Ariel Santivañez | `ariel@alvarezplacas.com.ar` | Vendedor | `/vendedor` |
| Braian Santivañez | `braian@alvarezplacas.com.ar` | Vendedor | `/vendedor` |

> Las contraseñas del equipo comercial se asignan desde `/admin/vendedores` → botón 🔑 CONTRASEÑA.

**Token API Directus:** `alvarez-api-token-v16-2026`
**Panel Directus:** `https://admin.alvarezplacas.com.ar/admin`

---

## 📦 Stack Tecnológico

| Componente | Tecnología | Versión |
|---|---|---|
| SSR Framework | Astro | ^6.0.8 |
| Runtime | Node.js Alpine | 22 |
| CSS | Tailwind CSS v4 | ^4.2.1 |
| CMS/API | Directus | 11.1.0 |
| Base de datos | PostgreSQL | 16 |
| Autenticación | bcryptjs | ^3.0.3 |
| Proxy HTTPS | Caddy | — |
| Búsqueda | MeiliSearch | v1.12 |
| Storage | MinIO (S3) | latest |
| SDK CMS | @directus/sdk | ^18.0.3 |

---

## ⚡ Alias de Importación (astro.config.mjs)

```javascript
'@backend'     → ./Backend
'@frontend'    → ./Frontend
'@conexiones'  → ./Backend/conexiones      // ← Usar siempre para Directus
'@home'        → ./Frontend/home
'@components'  → ./Frontend/shared/components
'@layouts'     → ./Frontend/home/layouts
'@dashboard'   → ./Backend/dashboard
```
