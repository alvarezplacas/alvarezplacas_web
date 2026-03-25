# 🚀 Alvarez Placas - Web Modular (web01)

Sito web oficial de Alvarez Placas, migrado a una arquitectura modular de alto rendimiento basada en Astro y Directus.

## 🧬 Arquitectura y Guía para Desarrolladores (IA y Humanos)
Para comprender el esqueleto modular, el sistema de proxies y la lógica de conexiones con Directus, consulta la guía maestra:
👉 [**Guía Arquitectónica Web01**](./docs/ARQUITECTURA_WEB01_PEDAGOGICA.md)

---

## 🛠️ Tecnologías y Módulos
- **Astro (SSR)** en modo `web01`.
- **Tailwind CSS** para un diseño premium y reactivo.
- **Directus CMS** como motor de datos (API-First).
- **NanoStores** para gestión de estado en herramientas interactivas.

## 📁 Estructura del Proyecto
- `/src/pages/`: Proxies de ruta (mantener ligeros).
- `/Frontend/`: Todo el UI y lógica visual.
- `/Backend/`: Conexiones, Dashboards y lógica de negocio pesada.

## 👨‍💻 Desarrollo Local
Para correr este proyecto en tu máquina y que funcione con la data real de Alvarez Placas:

1. **Clonar** el repositorio.
2. **Instalar dependencias**: `npm install`.
3. **Configurar Entorno**: Copia `.env.example` a `.env` y asegúrate de tener:
   ```env
   PUBLIC_DIRECTUS_URL=https://admin.alvarezplacas.com.ar
   ```
4. **Iniciar**: `npm run dev`.
5. Abre [http://localhost:4321](http://localhost:4321).

## 🚢 Despliegue en VPS
El despliegue se realiza mediante Docker:
1. `git pull origin main`
2. `docker compose -f docker-compose.vps.yml restart web`

---
*Mantenido por el Agente Antigravity - Marzo 2026*
