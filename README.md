# 🚀 Alvarez Placas - Proyecto Modular v16 (Mayo 2026)

Este repositorio contiene el ecosistema digital de Alvarez Placas, diseñado bajo una arquitectura modular y sectorizada para máxima eficiencia operativa.

**Estado del Sistema:** ✅ Producción Estable | 📦 Catálogo Sincronizado | 👔 Workspace Vendedores Activo

---

## 🧠 Referencia Técnica Maestro (v16.5)

### 🛠️ El Stack (Core)
- **Framework**: **Astro v6.0.8** (SSR modo `node` standalone).
- **Base de Datos**: **PostgreSQL 16** (Contenedor `alvarezplacas_db_v16`).
- **CMS**: **Directus 11.1.0** (Contenedor `alvarezplacas_directus_v16`).
- **Búsqueda**: **MeiliSearch v1.12** (Búsqueda instantánea de productos).
- **Almacenamiento**: **MinIO (S3)** para activos AVIF y videos optimizados.

### 🌍 Infraestructura VPS
- **Host**: **OVH Cloud** (IP: `144.217.163.13`).
- **Directorios**: 
  - Producción: `/opt/alvarez_v16/web01/site/web01`
  - Docker Compose: `/opt/alvarez_v16/web01/docker-compose.vps.yml`
- **SSL/Proxy**: Gestionado por **Caddy v2** en la red `javiermix_network`.

---

## 🚨 REGLAS CRÍTICAS DE DESARROLLO (LEER OBLIGATORIO)

### 1. Despliegue y Build
Astro **NO compila solo** al reiniciar el contenedor. Para aplicar cambios de código:
1. Subir archivos (vía `git` o `scp`).
2. **Build**: `docker exec alvarezplacas_web npm run build`
3. **Restart**: `docker compose restart alvarezplacas_web`

### 2. Middleware y Seguridad (`src/middleware.ts`)
**NO MODIFICAR** sin autorización. El middleware actual resuelve loops de redirección críticos y gestiona tres carriles de acceso:
- **Superadmin**: `admin@alvarezplacas.com.ar` (Hardcodeado en API).
- **Vendedores**: Redirección automática para dominio `@alvarezplacas.com.ar`.
- **Clientes**: Sesión persistente de 30 días.

### 3. Configuración de Red
`security.checkOrigin` debe ser `false` en `astro.config.mjs` para permitir logins a través del proxy Caddy.

---

## 👔 Módulos Implementados (Mayo 2026)

### 📧 Mensajería y Prioridades
- Canal directo Cliente ↔ Vendedor.
- Notificaciones de prioridad alta (activan parpadeo visual en el dashboard del vendedor).
- Tracking de lectura integrado (`visto: boolean`).

### 🔧 SmartCut PRO v5.6.5
- Motor de optimización industrial con márgenes de sierra (3mm) y refilado (5mm).
- **Login Wall**: Requiere sesión para descargar planos o guardar presupuestos.
- **Integración Directus**: Los presupuestos se guardan automáticamente en la colección `pedidos`.

### 👨‍💼 Workspace de Vendedores (`/vendedor`)
- Gestión de notas rápidas (**QuickNotes**) persistentes.
- Listado de clientes con ruteo inteligente.
- Acceso preferencial corporativo para empleados.


---

## 🚀 Avances y Sincronización Lepton Optimizer (Junio 2026)

Se implementó con éxito la integración bidireccional y centralización del motor de optimización **Lepton Optimizer** en red local (LAN) y su sincronización con la plataforma web:

### 1. Centralización en Red Local (LAN)
- **Script de Configuración:** [setup_lepton_network.bat](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/scratch/setup_lepton_network.bat)
- **Lógica:** Automatiza de manera segura la creación de copias de seguridad de los archivos locales de Lepton y establece enlaces simbólicos (`mklink`) que redirigen de forma transparente la base de datos `LEPTON.MDB` y el catálogo `mat.txt` hacia la ruta de red centralizada `\\Server-alvarezp\c\leptomdata`.
- **Beneficio:** Todos los terminales de Álvarez Placas operan bajo una base de datos centralizada en tiempo real, manteniendo de forma individual sus respectivas configuraciones de maquinaria y plantillas de etiquetas (`.eti`).

### 2. Sincronización de Catálogo Web (Directus ➔ Lepton)
- **Scripts:** [sync_lepton_catalog.py](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/scratch/sync_lepton_catalog.py) (Python) y [sync_lepton_db.ps1](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/scratch/sync_lepton_db.ps1) (PowerShell 32-bit ADODB).
- **Alcance:**
  - Descarga y mapeo de **1,224 placas de melamina activas** con stock desde Directus.
  - Asignación inteligente de dimensiones de plancha según marcas (Egger, Faplac, Sadepan).
  - Bloqueo de rotación de veta (grain direction) automático basado en palabras clave del nombre (madera/veta).
  - Escritura y mapeo en el archivo tabulado `mat.txt` y en la tabla `VIDRIOS` de `LEPTON.MDB` con sus respectivos SKUs.
- **Sincronización de Clientes:** Scripts [sync_lepton_clients.py](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/scratch/sync_lepton_clients.py) y [sync_lepton_clientes.ps1](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/scratch/sync_lepton_clientes.ps1) que sincronizan de forma automatizada los clientes registrados en la web hacia la tabla `clientes` de `LEPTON.MDB`.

### 3. Exportador Asistido de Importación en Portal Vendedor
- **Modulo:** [pedidos.ts](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/web01/src/pages/api/vendedor/views/pedidos.ts)
- **Función:** Reemplaza el botón `.ped` por un generador dinámico de archivos `.txt` en formato ASCII nativo tabulado y delimitado por punto y coma (Cantidad;Largo;Alto;Detalle;Material;Girar), compatible con el Asistente de Importación de Lepton. Evita advertencias de tapacantos al omitir comillas y campos vacíos.

### 4. Reasignación Permanente de Vendedor y Notificaciones por WhatsApp
- **Control y Backend:** [update-order-seller.ts](file:///d:/Alvarezplacas_2026/WEB-alvarezplacas_astro/Alvarezplacas/web01/src/pages/api/admin/update-order-seller.ts)
- **Función:** Habilita a los administradores (como `facundo@alvarezplacas.com.ar`) a reasignar asesores comerciales a los clientes de forma permanente y en tiempo real.
- **Notificación por WhatsApp:**
  - Incluye un botón interactivo de WhatsApp al lado del selector. Al hacer clic, se abre una conversación de WhatsApp con el cliente con un mensaje contextual preconfigurado.
  - Si el nuevo asesor asignado es **Facundo**, se genera un mensaje personalizado en primera persona saludando e indicando el canal de atención directo. Si se asigna a otro vendedor, el mensaje le comunica el cambio formalmente.
  - Agrega un acceso rápido de contacto de WhatsApp del cliente en el modal de detalles de cada pedido.

---

## 🚢 Acceso y Credenciales

| Servicio | URL | Usuario | Pass |
|---|---|---|---|
| **Directus Admin** | `https://admin.alvarezplacas.com.ar` | `admin@alvarezplacas.com.ar` | `JavierMix2026!` |
| **PostgreSQL** | `localhost:5433` (vía VPS) | `alvarez_admin` | `AlvarezAdmin2026` |
| **Webmail** | `https://mail.alvarezplacas.com.ar` | — | — |

**Token API Directus**: `alvarez-api-token-v16-2026`

---

## 🛋️ Ciclo Comercial Completo y Optimizaciones Técnicas (Junio 2026)

Se completó y optimizó quirúrgicamente el ciclo extremo a extremo desde el diseño de mobiliario en 3D hasta el cobro y producción industrial:

### 1. Integración CubiCal PRO ➔ SmartCut PRO
* **Preservación Total de Insumos:** El botón **"Exportar a Optimizador SmartCut"** en CubiCal PRO captura el listado de herrajes/insumos calculado (`hw`) y mapea automáticamente el material melamínico de catálogo (`EGGER`, `FAPLAC`, `SADEPAN`), almacenando el payload enriquecido en `sessionStorage`.
* **Carga Transparente:** Al aterrizar en SmartCut PRO, se omiten las pantallas de catálogo y se inyectan las piezas y herrajes automáticamente en segundo plano. Se renderiza un widget dinámico titulado **"Herrajes del Módulo"** con el listado detallado y costo consolidado.

### 2. Flujo de Cotización y Cierre Telefónico
* **API de Presupuestos:** El endpoint `/api/herramientas/save-budget.ts` persiste el pedido en estado `'presupuesto'`, localiza el teléfono del vendedor asignado en Directus y le despacha una alerta de WhatsApp con el enlace de cotización rápida.
* **Cotizador Comercial:** El panel del vendedor (`pedidos.ts`) permite cargar el valor oficial en pesos (`total`) y notas técnicas de entrega, disparando una notificación de WhatsApp al cliente invitándolo a confirmar.
* **Aprobación del Cliente:** El portal del cliente (`pedidos.astro`) muestra el precio oficial cotizado ($) y notas del vendedor. Al presionar "Aprobar", cambia el estado a `'en_produccion'` y despliega un modal interactivo detallando que su asesor lo llamará telefónicamente.
* **Alerta de Cierre Telefónico:** La aprobación del cliente gatilla un WhatsApp urgente al celular del vendedor asignado con los datos del cliente para proceder al cobro y renderiza un badge parpadeante interactivo **"📞 LLAMAR AL CLIENTE"** en su bandeja de pedidos.

### 3. Correcciones de Usabilidad y Rendimiento (Fase 6)
* **Cero Latencia Visual (Sierra Girando):** Se inyectó un script inline (`is:inline`) inmediatamente después del cargador `#sc-saw-loader` en `SmartCutApp.astro`. Este script verifica sincrónicamente el `sessionStorage` al milisegundo de iniciarse el parseo del DOM, mostrando la sierra circular giratoria al instante, eliminando el espacio muerto visual del navegador durante el SSR y la carga de estilos pesados.
* **Feedback de Carga:** El botón de exportación de CubiCal cambia dinámicamente su estado a `PREPARANDO SMARTCUT...` e inhabilita clics duplicados.
* **Resiliencia ante Fallos:** Se dotó de bloques robustos de desactivación del loader en ramas de error y cargas manuales para impedir congelamientos.
* **Auto-Mapeo de Tapacantos (0.45mm):** Reglas inteligentes en SmartCut mapean tapacanto en las 4 caras para frentes (`puerta`, `frente cajón`) y en 1 cara visible (`L1`) para componentes del cuerpo/estructurales (`lateral`, `techo`, `base`, `piso`, `estante`, `zócalo`, etc.).
* **Navegación Unificada:** Se añadieron botones separados por divisores elegantes en la barra superior para permitir un retorno fluido a **VOLVER AL PANEL** (`fas fa-home`) o **VOLVER A CUBICAL** (`fas fa-cubes`), facilitando la corrección rápida de diseños en caliente.

---

## 🏗️ Estructura del Proyecto
- **/src/pages**: Puntos de entrada y API (Astro).
- **/Backend**: Lógica de negocio, dashboards y conexión central Directus.
- **/Frontend**: Experiencia de usuario, catálogo y herramientas.
- **/docs**: Documentación técnica profunda (Ver `AGENTES_IA_REFERENCIA.md`).

---
*Ultima actualización: 1 de Junio de 2026 por Antigravity (Google Deepmind).*
