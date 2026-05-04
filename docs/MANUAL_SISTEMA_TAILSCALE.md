# 🛡️ MANUAL DE SISTEMA: Conectividad Invisible con Tailscale (v16)

Este documento define la arquitectura de red y seguridad para el ecosistema **Alvarez Placas v16**. Es la fuente de verdad para desarrolladores y Agentes de IA sobre cómo interactuar con el servidor de forma segura.

---

## 🏗️ Arquitectura "Zero-Exposure"

A diferencia de las arquitecturas tradicionales donde los servicios se exponen a internet y se protegen con firewalls, este sistema utiliza un modelo de **Identidad Criptográfica**.

### 1. El Nodo Central (Tailscale Sidecar)
El VPS corre un contenedor `tailscale` que actúa como puerta de enlace. Este contenedor:
- No tiene puertos mapeados al host.
- Autentica al servidor dentro de la "Tailnet" de Alvarez Placas.
- Provee una dirección IP privada (100.x.y.z) y un nombre DNS (ej: `alvarez-vps`).

### 2. Micro-segmentación de Servicios
Los servicios críticos están aislados en redes de Docker que **no tienen salida ni entrada pública**:

| Servicio | Acceso Público | Acceso Tailscale | Propósito |
| :--- | :--- | :--- | :--- |
| **Astro (Web)** | ✅ SÍ (Puerto 4321) | ✅ SÍ | Catálogo público para clientes. |
| **Directus (CMS)** | ❌ NO | ✅ SÍ (Puerto 8055) | Gestión de contenidos y API interna. |
| **PostgreSQL** | ❌ NO | ✅ SÍ (Puerto 5432) | Base de datos persistente. |
| **MinIO Console** | ❌ NO | ✅ SÍ (Puerto 9001) | Gestión de activos (Imágenes AVIF). |

---

## 🤖 Guía para Agentes de IA y Desarrolladores

### Cómo conectar para trabajar
Para realizar tareas de mantenimiento o carga de datos (como el catálogo de 2000+ productos):

1. **Estar en la Tailnet:** Tu máquina local o el entorno de ejecución de la IA debe estar autorizado en la red Tailscale de Alvarez Placas.
2. **Uso de MagicDNS:** No uses IPs. Usa los nombres de host:
   - CMS: `http://alvarez-vps:8055`
   - DB: `alvarez-vps:5432`
3. **Seguridad por Etiquetas (Tags):**
   - `tag:ai-worker`: Permisos de lectura/escritura en DB para auditoría de catálogo.
   - `tag:admin`: Acceso total a consolas de gestión.

### Ventajas del Sistema para Producción
- **Sincronización Segura:** Los scripts de Python (`import_catalog.py`) pueden correr localmente y "ver" la base de datos de producción de forma segura.
- **Auditoría Total:** Tailscale registra quién y cuándo accedió a cada servicio, ideal para el seguimiento de cambios realizados por IAs.
- **Despliegue sin Riesgos:** Al no haber puertos abiertos, los escaneos de vulnerabilidades externos no detectan la existencia de la base de datos ni del CMS.

---

## 🛠️ Comandos de Emergencia
Si la conectividad se pierde:
1. `docker logs tailscale` para verificar el estado de la VPN.
2. `tailscale status` en el host para ver nodos conectados.

---
*Ultima actualización: Mayo 2026 - Versión Revolucionaria v16.2*
