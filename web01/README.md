# 🚀 Alvarez Placas - Arquitectura Modular (web01)

Este es el esqueleto oficial y modular de la plataforma **Alvarez Placas**. Diseñado para ser escalable, desacoplado y listo para el trabajo colaborativo entre múltiples agentes de IA y desarrolladores.

## 🏗️ Estructura del Proyecto (El Esqueleto)

El proyecto se divide en módulos lógicos para evitar conflictos y facilitar la expansión:

```text
web01/
├── src/
│   └── pages/          <-- 🟢 CAPA DE PROXIES (Rutas oficiales de Astro)
├── Frontend/           <-- 🔵 UI & COMPONENTES (Propiedad del Agente Frontend)
│   ├── home/           <-- Landing, Contacto, Layouts generales
│   ├── catalogo/       <-- Grilla de productos, Modales de detalle
│   ├── cliente/        <-- Login, Registro, Dashboard Cliente
│   └── herramientas/   <-- Presupuestador, Smart Match
├── Backend/            <-- 🟡 LÓGICA & DASHBOARDS (Propiedad del Agente Backend)
│   ├── dashboard/      <-- Panel Admin y Panel Vendedores
│   └── conexiones/     <-- Singleton de Directus y APIs
└── public/             <-- Assets estáticos (Imágenes, Fuentes)
```

## 🧠 Lógica de Funcionamiento: Los "Proxies"

Para mantener la modularidad, los archivos en `src/pages/` actúan únicamente como **punteros** o proxies. 

**Ejemplo de un archivo proxy (`src/pages/catalogo.astro`):**
```astro
---
import Page from '../Frontend/catalogo/CatalogGrid.astro';
---
<Page />
```
*Esto permite mover o refactorizar el código en `Frontend/` sin romper las URLs del sitio.*

## 🔌 Conexión con Directus (API-First)

Toda la data (Productos, Pedidos, Clientes, Mensajes) vive en **Directus CMS**. 
La conexión se centraliza en `web01/Backend/conexiones/directus.js`.

- **Catálogo**: Hidratación dinámica desde la colección `productos`.
- **Dashboards**: Autenticación persistente mediante cookies y consultas SDK.
- **Contacto**: Envío de formularios vía API route (`src/pages/api/contacto.ts`) hacia Directus.

## 💻 Desarrollo Local

Para correr este proyecto en tu máquina y que funcione con la data real de Alvarez Placas:

1.  **Clonar** el repositorio.
2.  Entrar a la carpeta: `cd web01/`.
3.  **Instalar dependencias**: `npm install`.
4.  **Configurar Entorno**: Copia `.env.example` a `.env` y asegúrate de tener:
    ```env
    PUBLIC_DIRECTUS_URL=https://admin.alvarezplacas.com.ar
    ```
5.  **Iniciar**: `npm run dev`.
6.  Abre [http://localhost:4321](http://localhost:4321).

## 🚢 Despliegue en VPS

El sitio se gestiona con Docker en una instancia Ubuntu. 
- **Archivo de Config**: `docker-compose.vps.yml`.
- **Comando de reinicio**: `docker compose -f docker-compose.vps.yml restart web`.

---
*Manual mantenido por Antigravity AI - Arquitecto de Sistemas.*
