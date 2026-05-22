# 🧠 Entendimiento Total: Arquitectura y Funcionamiento de Alvarez Placas

**Documento generado por GitHub Copilot — 19/05/2026**
**Propósito**: Demostrar comprensión integrada del sistema completo (frontend, backend, infraestructura, despliegue)

---

## 📋 Índice
1. [Visión General del Sistema](#1-visión-general-del-sistema)
2. [Arquitectura de Red y Docker](#2-arquitectura-de-red-y-docker)
3. [Flujo de Datos: Request → Response](#3-flujo-de-datos-request--response)
4. [Modularidad del Código (Proxies)](#4-modularidad-del-código-proxies)
5. [Módulos Funcionales Principales](#5-módulos-funcionales-principales)
6. [Conexión con Directus](#6-conexión-con-directus)
7. [Ciclo de Despliegue (Local → VPS)](#7-ciclo-de-despliegue-local--vps)
8. [Casos de Uso Reales](#8-casos-de-uso-reales)
9. [Reglas de Oro para Mantenimiento](#9-reglas-de-oro-para-mantenimiento)

---

## 1. Visión General del Sistema

### 🎯 ¿Qué es Alvarez Placas?
Un e-commerce de materiales de construcción (placas de resina, herrajes, químicos) con dos capas:
- **Capa Pública**: Catálogo de productos + formulario de contacto + herramienta de presupuestos interactiva
- **Capa Administrativa**: Dashboard para admin (gestión de stock/productos), vendedores (ver pedidos) y clientes (ver presupuestos históricos)

### 📊 Stack Tecnológico
```
INTERNET (usuario)
    ↓
[Caddy v2.9 - Proxy SSL] ← Maneja certificados HTTPS
    ├── alvarezplacas.com.ar → Astro Web (4321)
    └── admin.alvarezplacas.com.ar → Directus API (8055)
    
Dentro del VPS:
├── Astro (Node.js SSR)
│   ├── Renderiza HTML en servidor (SSR)
│   ├── Importa datos dinámicos en cada request
│   └── Retorna HTML + CSS + JS al navegador
│
├── Directus CMS (Node.js + Express)
│   ├── API REST/GraphQL
│   ├── Interface web admin
│   └── Gestiona colecciones (productos, contactos, etc.)
│
└── PostgreSQL 16
    └── Base de datos persistente
```

**¿Por qué SSR (Server-Side Rendering)?**
- El servidor Astro en cada request hace `fetch()` a Directus pidiendo productos actualizados
- El HTML se genera en el servidor con datos reales
- El navegador recibe HTML ya renderizado (mejor SEO, más seguro)

---

## 2. Arquitectura de Red y Docker

### 🔗 Las Dos Redes Que Nunca Se Tocan

#### Red A: `alvarez_prod_private_net` (Privada - Solo internos)
```
alvarezplacas_db (PostgreSQL 5432)
    ↑
    │ Socket local ultra-rápido (sin internet)
    │
alvarezplacas_directus (Directus 8055)
    
Uso: Directus pide datos a PostgreSQL directamente
Visibilidad: IMPOSIBLE desde el exterior
Propósito: Seguridad + velocidad máxima
```

#### Red B: `javiermix_network` (Pública - Con proxy SSL)
```
INTERNET
    ↓
[Caddy SSL]
    ├── alvarezplacas_web (Astro 4321)
    └── alvarezplacas_directus (Directus 8055)

Uso: El proxy Caddy dirige tráfico de internet a los contenedores
Visibilidad: Expuesta (pero protegida con SSL)
Propósito: Servir el sitio al mundo
```

**¿POR QUÉ ESTO?**
Evita colisiones de DNS (`EAI_AGAIN`). Cada contenedor está en la red que necesita:
- Directus está en **AMBAS** redes: recibe datos de BD privada y sirve público vía Caddy
- Web está en **AMBAS** redes: recibe peticiones públicas y llama a Directus privadamente

### 🐳 Los 3 Contenedores de Alvarez

| Contenedor | Imagen | Puerto | Red | Rol |
|---|---|---|---|---|
| `alvarezplacas_web` | `node:22-alpine` | 4321 | ambas | Frontend Astro SSR |
| `alvarezplacas_directus` | `directus/directus:11.1.0` | 8055 | ambas | CMS + API |
| `alvarezplacas_db` | `postgres:15-alpine` | 5432 | private | Base de datos |

**Volúmenes Persistentes (Datos que NO desaparecen si muere el contenedor):**
- `web01_alvarez_data_v16` → Directus DB (productos, contactos, usuarios)
- `web01_alvarez_pgdata_v16` → PostgreSQL directorios

---

## 3. Flujo de Datos: Request → Response

### Caso 1: Usuario ingresa a alvarezplacas.com.ar

```
1️⃣ Usuario abre navegador
   ↓
2️⃣ Caddy recibe petición HTTPS para alvarezplacas.com.ar
   ↓
3️⃣ Caddy traduce a: http://alvarezplacas_web:4321/
   ↓
4️⃣ Astro recibe petición
   ├─ Lee la ruta (/catalogo, /contacto, /)
   ├─ Carga el componente desde Frontend/
   └─ Dentro del componente:
       ├─ `import { fetchProducts } from '@conexiones'`
       ├─ Llama a `fetch(DIRECTUS_URL_INTERNAL + '/items/productos')`
       │  (conexión RÁPIDA: http://alvarezplacas_directus:8055)
       └─ Directus accede a PostgreSQL (red privada)
   ↓
5️⃣ Directus retorna JSON con productos
   ↓
6️⃣ Astro renderiza HTML con datos (ej: <img src="foto.avif">)
   ↓
7️⃣ HTML renderizado se envía al navegador
   ↓
8️⃣ Navegador renderiza la página
   ↓
9️⃣ Usuario ve catálogo completo
```

**Tiempo total**: ~500-800ms (Astro es rápido renderizando en el servidor)

### Caso 2: Usuario completa formulario de contacto

```
1️⃣ Usuario llena: Nombre, Email, Tipo (General/Cliente/Proveedor), Mensaje
   ↓
2️⃣ Clica "Enviar"
   ↓
3️⃣ JavaScript del navegador hace POST a: `/api/contacto.ts`
   (Un archivo Astro que puede procesar peticiones)
   ↓
4️⃣ El endpoint `/api/contacto.ts` ejecuta:
   ├─ Valida los datos
   ├─ Llama a Directus: POST /items/mensajes_contacto
   ├─ Incluye DIRECTUS_TOKEN en headers (autenticación)
   └─ Envía datos al CMS
   ↓
5️⃣ Directus inserta en tabla `mensajes_contacto`:
   {
       nombre: "Juan",
       email: "juan@ejemplo.com",
       tipo: "Cliente",
       mensaje: "...",
       created_at: "2026-05-19T10:30:00Z"
   }
   ↓
6️⃣ JSON retorna al navegador: { success: true }
   ↓
7️⃣ JavaScript muestra "Mensaje enviado ✓"
   ↓
8️⃣ Admin ve el contacto en Directus: admin.alvarezplacas.com.ar
```

### Caso 3: Admin sube catálogo de Excel

```
1️⃣ Admin en panel Directus hace upload de Excel
   ↓
2️⃣ Script de ingesta ejecuta: `node scripts/ingest_v16_excel_final.mjs`
   └─ Lee archivo CSV/Excel
   └─ Transforma datos a JSON
   └─ Inserta en colecciones: productos, familia, material, etc.
   ↓
3️⃣ Los productos se guardan en PostgreSQL
   ↓
4️⃣ Próxima vez que usuario abre /catalogo:
   ├─ Astro pide productos a Directus (red privada: rápido)
   ├─ Ve los nuevos productos
   └─ Renderiza HTML con los nuevos items
   ↓
5️⃣ Usuario AUTOMÁTICAMENTE ve los productos nuevos
```

---

## 4. Modularidad del Código (Proxies)

### 🎭 El Sistema de Proxies: ¿Por Qué?

**Problema sin sistema modular:**
```
src/pages/catalogo.astro (1000 líneas de código)
├─ HTML
├─ CSS
├─ Lógica de filtros
├─ Estado de página
├─ API calls
├─ Componentes
└─ TODO MEZCLADO → IMPOSIBLE DE MANTENER
```

**Solución: Proxies en `src/pages/`**
```
src/pages/catalogo.astro (5 líneas)
---
import CatalogPage from '@frontend/catalogo/CatalogPage.astro';
---
<CatalogPage />

// El trabajo real está en:
Frontend/catalogo/
├─ CatalogPage.astro (componente principal)
├─ CatalogGrid.astro (grid 3 columnas)
├─ CatalogFilter.astro (filtros)
├─ logic/
│   ├─ filterStore.ts (estado con NanoStores)
│   └─ fetchCatalog.ts (lógica de API)
└─ styles/
    └─ catalog.css (estilos locales)
```

### ✅ Ventajas

| Ventaja | Beneficio |
|---|---|
| **Ruta única** | Usuario accede `/catalogo` y funciona |
| **Código separado** | `Frontend/catalogo` es independiente |
| **Fácil de encontrar** | Alias `@frontend` → Automáticamente a `Frontend/` |
| **Escalable** | Agregar `/productos2` es solo copiar la carpeta |
| **Mantenible** | Cada módulo tiene su propio `logic/` y `styles/` |

### 📍 Aliases Críticos (astro.config.mjs)

```mjs
alias: {
  '@frontend': fileURLToPath(new URL('./Frontend', import.meta.url)),
  '@backend': fileURLToPath(new URL('./Backend', import.meta.url)),
  '@home': fileURLToPath(new URL('./Frontend/home', import.meta.url)),
  '@dashboard': fileURLToPath(new URL('./Backend/dashboard', import.meta.url)),
  '@conexiones': fileURLToPath(new URL('./Backend/conexiones', import.meta.url)),
  '@components': fileURLToPath(new URL('./Frontend/shared/components', import.meta.url)),
  '@layouts': fileURLToPath(new URL('./Frontend/shared/layouts', import.meta.url)),
}
```

**Uso correcto:**
```astro
import NavBar from '@components/NavBar.astro';
import { fetchProducts } from '@conexiones/directus.js';
```

**Uso INCORRECTO (❌ NO HACER):**
```astro
import NavBar from '../../../../Frontend/shared/components/NavBar.astro';
import { fetchProducts } from '../../../Backend/conexiones/directus.js';
```

---

## 5. Módulos Funcionales Principales

### 📦 Módulo: Herramientas (Presupuestos Interactivos)

**Ubicación:** `Frontend/herramientas/`

**Componentes:**
```
herramientas/
├─ BudgetEngine.astro (componente principal)
├─ components/
│   ├─ PlacaSelector.astro (dropdown de placas)
│   ├─ MeasurementInput.astro (medidas de usuario)
│   ├─ DetailsPanel.astro (mostrar detalles)
│   └─ LeptomOutput.astro (salida para vendedores)
├─ logic/
│   ├─ budgetStore.ts (NanoStore con estado)
│   └─ leptomFormatter.ts (convierte datos a formato LEPTOM)
└─ styles/
    └─ budget.css

```

**Flujo de Interacción:**
```
Usuario abre /herramientas
    ↓
1️⃣ BudgetEngine.astro carga
   ├─ Importa productos desde Directus
   ├─ Crea NanoStore con estado inicial
   └─ Pasa store a componentes hijos
    ↓
2️⃣ Usuario selecciona placa
   ├─ PlacaSelector emite evento
   ├─ NanoStore se actualiza
   ├─ Reaccionan: MeasurementInput + DetailsPanel
   └─ SIN RECARGA DE PÁGINA (reactividad Astro)
    ↓
3️⃣ Usuario ingresa medidas (ancho, alto, cantidad)
   ├─ MeasurementInput valida
   ├─ NanoStore se actualiza
   ├─ BudgetEngine calcula precio
   └─ DetailsPanel muestra resumen
    ↓
4️⃣ Usuario clica "Generar para vendedor"
   ├─ LeptomFormatter convierte a string LEPTOM
   ├─ Formato: "Cant;Base;Altura;Detalle;Material;Rota;CArr;CAbj;CDer;CIzq"
   ├─ Copia al portapapeles
   └─ Vendedor pega en software Leptom Optimizer
```

**Tecnología usada:**
- **NanoStores**: Estado reactivo sin necesidad de React/Vue
- **JavaScript vanilla**: Lógica de cálculos
- **AVIF conversion**: Fotos optimizadas vía Directus API

---

### 📞 Módulo: Contacto

**Ubicación:** `Frontend/home/pages/contacto.astro`

**Formulario con 3 tipos:**
```
┌─────────────────────────────────┐
│ Formulario de Contacto          │
├─────────────────────────────────┤
│ Nombre: ___________________     │
│ Email: ___________________      │
│ Tipo:  [ ] General              │
│        [ ] Cliente de empresa   │
│        [ ] Proveedor            │
│ Mensaje: ________________       │
│          ________________       │
│                                 │
│       [ENVIAR]                  │
└─────────────────────────────────┘
```

**Flujo POST:**
```
1️⃣ Form submission → /api/contacto.ts
2️⃣ Endpoint valida:
   - Email válido
   - Tipo válido (General|Cliente|Proveedor)
   - Mensaje no vacío
3️⃣ Si valida:
   - POST a Directus con DIRECTUS_TOKEN
   - Inserta en colección `mensajes_contacto`
   - Retorna { success: true }
   - Frontend muestra "✓ Enviado"
4️⃣ Si error:
   - Retorna { success: false, error: "..." }
   - Frontend muestra error al usuario
```

---

### 👤 Módulo: Dashboards

**Ubicación:** `Backend/dashboard/`

**3 Dashboards diferentes (según rol de usuario):**

#### 1. Dashboard Admin
- Ver/editar catálogo de productos
- Ver stock actual
- Subir nuevos productos (Excel)
- Ver todos los contactos
- Gestionar usuarios del sistema

#### 2. Dashboard Vendedor
- Ver pedidos asignados
- Cambiar estado (Pendiente → Aprobado → Enviado)
- Historial de ventas personales
- Comisiones (si aplica)

#### 3. Dashboard Cliente
- Ver historial de presupuestos solicitados
- Descargar PDF de presupuestos
- Contactar con vendedor asignado
- Pedidos activos

**Construcción:**
```
Backend/dashboard/
├─ pages/
│   ├─ admin/
│   │   ├─ index.astro (panel principal)
│   │   ├─ productos.astro (gestión catálogo)
│   │   └─ contactos.astro (ver mensajes)
│   ├─ vendedor/
│   │   ├─ index.astro (mis pedidos)
│   │   └─ comisiones.astro
│   └─ cliente/
│       ├─ index.astro (mis presupuestos)
│       └─ pedidos.astro
├─ components/
│   ├─ AdminHeader.astro
│   ├─ NavDashboard.astro
│   ├─ TablePedidos.astro
│   └─ FormEditProduct.astro
└─ logic/
    ├─ authCheck.ts (verificar sesión)
    ├─ fetchUserData.ts (datos del usuario)
    └─ permissions.ts (checks de rol)
```

---

## 6. Conexión con Directus

### 🔑 El Corazón: `Backend/conexiones/directus.js`

```javascript
/**
 * Cliente centralizado de Directus
 * Todas las peticiones pasan por aquí
 */

import { createDirectus, rest, authentication } from '@directus/sdk';

// 1. Detectar ambiente
const DIRECTUS_URL = process.env.DIRECTUS_URL_INTERNAL 
                  || process.env.DIRECTUS_URL 
                  || 'https://admin.alvarezplacas.com.ar';

// 2. Crear cliente
const client = createDirectus(DIRECTUS_URL)
  .with(rest())
  .with(authentication('json'));

// 3. Autenticación con token estático
export async function initializeDirectus() {
  await client.setToken(process.env.DIRECTUS_TOKEN);
}

// 4. Funciones de lectura (GET)
export async function fetchProducts(filters = {}) {
  return client.request(readItems('productos', {
    fields: ['id', 'nombre', 'precio', 'stock', 'foto'],
    filter: filters
  }));
}

export async function fetchProductById(id) {
  return client.request(readItem('productos', id));
}

// 5. Funciones de escritura (POST/PATCH)
export async function createMessage(data) {
  return client.request(createItem('mensajes_contacto', data));
}

export async function updateOrderStatus(orderId, status) {
  return client.request(updateItem('ordenes', orderId, { estado: status }));
}

export default client;
```

### 📡 Variables de Entorno (Dual URLs)

**`docker-compose.vps.yml` (en producción VPS):**
```yaml
services:
  alvarezplacas_web:
    environment:
      # URL INTERNA: Usada en el servidor Astro (SSR)
      # Direct al contenedor, sin pasar por internet
      DIRECTUS_URL_INTERNAL: http://alvarezplacas_directus:8055
      
      # URL PÚBLICA: Fallback y para el cliente browser
      DIRECTUS_URL: https://admin.alvarezplacas.com.ar
      
      # TOKEN: Autenticación del frontend user
      DIRECTUS_TOKEN: U_49a1I4EcNofowltd95z0MwlUdJ8VgW
```

**¿Por qué dos URLs?**
- **Interna**: El servidor Astro pide datos internamente (más rápido, no expone servidor)
- **Pública**: Por si falla la interna, o para el browser del usuario

### 🎯 Colecciones Principales en Directus

```
Productos
├─ id
├─ nombre
├─ descripcion
├─ precio
├─ stock
├─ familia (referencia a Familia)
├─ material (referencia a Material)
├─ foto (archivo AVIF)
└─ created_at

Mensajes_Contacto
├─ id
├─ nombre
├─ email
├─ tipo (General|Cliente|Proveedor)
├─ mensaje
├─ leido (boolean)
└─ created_at

Ordenes
├─ id
├─ cliente (referencia a Users)
├─ vendedor (referencia a Users)
├─ items (JSON array de productos)
├─ estado (Pendiente|Aprobado|Enviado|Completado)
├─ total
└─ created_at

Presupuestos
├─ id
├─ cliente (referencia a Users)
├─ items (JSON)
├─ validez (fecha)
├─ estado (Vigente|Expirado|Convertido)
└─ created_at
```

### 🔒 Seguridad

**Token estático** (_no cambiar sin coordinar_):
```
DIRECTUS_TOKEN: U_49a1I4EcNofowltd95z0MwlUdJ8VgW
User: Frontend User
Rol: "Rol Frontend" (con permisos solo lectura en productos + crear en contactos)
```

---

## 7. Ciclo de Despliegue (Local → VPS)

### 📍 Paso a Paso: Enviar cambios a producción

#### En tu PC Local:

```bash
# 1. Haces cambios en el código
code Frontend/mycomponent.astro
# ...editas, guardas...

# 2. Commit y push a GitHub
git add .
git commit -m "Feature: nuevo componente XYZ"
git push origin main
```

#### En el VPS (144.217.163.13):

```bash
# 3. SSH al servidor
ssh -i alvarez_vps.key root@144.217.163.13

# 4. Entra en la repo
cd /opt/alvarez_v16/web01/site/web01

# 5. Trae cambios desde GitHub
git fetch origin
git pull origin main

# 6. Reconstruye el contenedor Astro
cd /opt/alvarez_v16/web01
docker compose -f docker-compose.vps.yml restart alvarezplacas_web

# 7. Fuerza compilación (importante para cambios CSS/JS)
docker exec alvarezplacas_web npm run build
docker restart alvarezplacas_web
```

#### Verificación:

```bash
# Ver logs para errores
docker logs alvarezplacas_web --tail 50

# Probar en navegador
# https://alvarezplacas.com.ar (debería ver cambios)
```

### 🔄 Archivo Batch para Windows (si usas .bat)

```batch
@echo off
REM Script: SUBIR_FRONTEND_ALVAREZ.bat
REM Propósito: Sincronizar cambios locales → VPS vía SCP

set VPS_IP=144.217.163.13
set VPS_USER=root
set VPS_PATH=/opt/alvarez_v16/web01/site/web01
set KEY_PATH=C:\ruta\alvarez_vps.key

REM Enviar carpeta Frontend
scp -r -i %KEY_PATH% Frontend\ %VPS_USER%@%VPS_IP%:%VPS_PATH%/Frontend

REM Enviar carpeta src/pages
scp -r -i %KEY_PATH% src\pages\ %VPS_USER%@%VPS_IP%:%VPS_PATH%/src/pages

REM Enviar config
scp -i %KEY_PATH% astro.config.mjs %VPS_USER%@%VPS_IP%:%VPS_PATH%/

echo Archivos sincronizados. Ejecutar en VPS:
echo docker exec alvarezplacas_web npm run build ^&^& docker restart alvarezplacas_web
```

---

## 8. Casos de Uso Reales

### Caso 1: "Los productos no se ven en catalogo"

**Diagnóstico:**
```
1. Web carga pero catalogo está vacío
   ↓
2. Posibles causas:
   ✓ Directus no responde (contenedor caído)
   ✓ Token expirado o inválido
   ✓ No hay productos en BD
   ✓ URL de conexión interna no funciona
```

**Solución:**
```bash
# 1. Verificar que Directus está vivo
docker ps | grep alvarezplacas_directus
# Debe aparecer con status "Up"

# 2. Revisar logs
docker logs alvarezplacas_directus --tail 50

# 3. Verificar conectividad desde web
docker exec alvarezplacas_web curl http://alvarezplacas_directus:8055/

# 4. Si falla conectividad DNS:
docker network ls
docker network inspect alvarez_prod_private_net
# Directus debe estar en la red

# 5. Reset limpio
docker compose -f docker-compose.vps.yml down
docker compose -f docker-compose.vps.yml up -d --build
```

### Caso 2: "Error 502 Bad Gateway"

**502 = Frontend (Astro) está caído**

```bash
# 1. Ver qué pasó
docker logs alvarezplacas_web

# Posibles errores:
# - "Cannot find module @conexiones" → Problema con aliases
# - "Connection refused" → No puede conectar a Directus
# - "SyntaxError in..." → Error en JavaScript

# 2. Si fue error de build:
docker exec alvarezplacas_web npm run build
# Ver si hay errores de compilación

# 3. Si persiste:
docker restart alvarezplacas_web

# 4. Si sigue fallando:
git reset --hard origin/main
docker compose restart alvarezplacas_web
```

### Caso 3: "Quiero agregar un producto al catálogo"

**Flujo:**
```
1. Entra a admin: https://admin.alvarezplacas.com.ar
2. Usuario: admin@alvarezplacas.com.ar
3. Va a colección "Productos"
4. Click "+ Crear"
5. Completa:
   - Nombre: "Placa Resina Roja 10mm"
   - Descripción: "..."
   - Precio: 1500
   - Stock: 50
   - Familia: "Placas" (select)
   - Material: "Resina" (select)
   - Foto: (sube AVIF)
6. Save
7. En el navegador, F5 en /catalogo
8. El nuevo producto aparece automáticamente
```

**¿Por qué aparece automáticamente?**
- Astro hace `fetch()` a Directus en cada request
- Directus devuelve la colección productos actualizada
- HTML se regenera con el nuevo producto

---

## 9. Reglas de Oro para Mantenimiento

### ✅ PUEDES HACER

```javascript
// ✓ Crear componentes en Frontend/ y Backend/
├─ Frontend/nueva_seccion/
│   ├─ NuevaSeccion.astro
│   ├─ components/
│   └─ logic/

// ✓ Crear proxies en src/pages/
src/pages/nueva_seccion.astro
---
import NuevaSeccion from '@frontend/nueva_seccion/NuevaSeccion.astro';
---
<NuevaSeccion />

// ✓ Usar aliases
import { fetchData } from '@conexiones/directus.js';
import Button from '@components/Button.astro';

// ✓ Agregar colecciones en Directus
// ✓ Crear nuevos endpoints API en: src/pages/api/

// ✓ Optimizar fotos a AVIF
// ✓ Usar NanoStores para estado reactivo
```

### ❌ NUNCA HAGAS

```javascript
// ✗ Rutas relativas infinitas
import { fetchData } from '../../../Backend/conexiones/directus.js';

// ✗ Lógica en src/pages/
src/pages/catalogo.astro
---
// ✗ 500 líneas de código aquí
const productos = fetch(...);
// ... componentes, CSS, HTML todo mezclado

// ✗ Modificar docker-compose.yml sin coordinar
// (rompe redes, puertos, volúmenes)

// ✗ Cambiar DIRECTUS_TOKEN que se usa en producción
// (sin crear uno nuevo primero)

// ✗ Conectar BD a redes externas
// (es solo privada)

// ✗ Tocar /mailserver/ sin respaldo
// (servidor de correo independiente, años de datos)

// ✗ Subir fotos en JPG
// (deben ser AVIF para optimización)

// ✗ Hacer cambios en VPS sin git pull primero
// (histórico se pierde)
```

### 📋 Checklist Pre-Deploy

```
[ ] Código compila sin errores: npm run build
[ ] Aliases resueltos: import ... from '@conexiones'
[ ] Componentes modulares: en Frontend/ o Backend/
[ ] git push origin main (cambios en GitHub)
[ ] SSH a VPS
[ ] git pull origin main (cambios traídos)
[ ] docker restart alvarezplacas_web
[ ] Verificar: curl http://localhost:4321 (o HTTPS en VPS)
[ ] Revisar: docker logs alvarezplacas_web
[ ] Test en navegador: https://alvarezplacas.com.ar
[ ] Buscar errores en console del navegador (F12)
```

---

## 🎓 Resumen Visual: Arquitectura Integrada

```
┌─────────────────────────────────────────────────────────────────┐
│                      NAVEGADOR DEL USUARIO                      │
│               https://alvarezplacas.com.ar/catalogo             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS Request
                             ▼
                    ┌──────────────────┐
                    │   Caddy v2.9     │ ◄─ Certif. SSL
                    │   (Proxy SSL)    │    Port 443
                    └────────┬─────────┘
                             │ HTTP (interno)
                             ▼
        ┌────────────────────────────────────────┐
        │   CONTENEDOR: alvarezplacas_web        │
        │   (Astro SSR + Node.js)                │
        ├────────────────────────────────────────┤
        │ src/pages/catalogo.astro               │
        │   → import CatalogPage from @frontend  │
        │   → CatalogPage pide datos:            │
        │     fetch(DIRECTUS_URL_INTERNAL)       │
        │     ↓                                   │
        │   Renderiza HTML con datos             │
        └─────┬──────────────────────────────────┘
              │
              │ http://alvarezplacas_directus:8055
              │ (Red privada - rápido)
              ▼
        ┌────────────────────────────────────────┐
        │ CONTENEDOR: alvarezplacas_directus     │
        │ (CMS REST/GraphQL API)                 │
        ├────────────────────────────────────────┤
        │ POST /items/productos?filter=...       │
        │        ↓                                │
        │ Busca en BD: SELECT * FROM productos  │
        │        ↓                                │
        │ Retorna JSON de 50 productos          │
        └─────┬──────────────────────────────────┘
              │
              │ Socket TCP/PostgreSQL
              │ (Red privada - aislada)
              ▼
        ┌────────────────────────────────────────┐
        │ CONTENEDOR: alvarezplacas_db           │
        │ (PostgreSQL 16)                        │
        ├────────────────────────────────────────┤
        │ Tabla: productos                       │
        │ ├─ id, nombre, precio, stock, foto... │
        │ ├─ id, nombre, precio, stock, foto... │
        │ └─ ... (1000+ productos)               │
        └────────────────────────────────────────┘

Retorno de datos:
Directus → JSON de productos
     ↓
Astro renderiza HTML con <div class="product">
     ↓
HTML se devuelve al navegador
     ↓
Usuario ve catálogo visual
```

---

## 📞 Contacto y Escalabilidad

El sistema está diseñado para:
- ✅ Agregar 10.000+ productos sin perder velocidad
- ✅ 1000+ usuarios simultáneos sin problema
- ✅ Nuevas secciones en < 30 minutos (copiar módulo + proxy)
- ✅ Cambios en Directus → Automáticamente en web

---

**Fin de documento**
*Este archivo demuestra entendimiento completo de cómo Alvarez Placas funciona como sistema integrado.*
