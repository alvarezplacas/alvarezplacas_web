# Contexto de Infraestructura: javiermix.ar & alvarezplacas.com.ar

## Arquitectura del VPS (Ubuntu)
Ambos proyectos corren como contenedores Docker independientes, orquestados con Docker Compose y expuestos a través de Nginx Proxy Manager. Comparten la red interna de Docker. Todo el desarrollo nuevo es en Astro (WordPress está descartado).

### 1. Proyecto: Alvarez Placas
* **Dominio:** `alvarezplacas.com.ar`
* **Directorio Docker:** `/opt/alvarezplacas/`
* **Directorio de Código Vivo (Astro):** `/home/ubuntu/alvarezplacas_web/`
* **Stack:** Astro + Tailwind CSS + Node 22 (Alpine).
* **Comando de ejecución:** `npm install && npm run dev -- --host 0.0.0.0`
* **Configuración vital:** `astro.config.mjs` tiene configurado `server.allowedHosts: ['alvarezplacas.com.ar']` para evitar bloqueos de Vite.

### 2. Proyecto: Javier Mix
* **Dominio:** `javiermix.ar`
* **Directorio Docker:** `/opt/javiermix/`
* **Directorio de Código Vivo (Astro):** `/home/ubuntu/javiermix_web/`
* **Stack:** Astro.

## Herramientas del Sistema
* **File Browser:** Instancia única corriendo bajo el dominio principal de Javier. 
    * Existe un usuario administrador con acceso a la raíz `/`.
    * Existe un usuario restringido (`alvarez`) con acceso exclusivo a `/home/ubuntu/alvarezplacas_web/`.
    * No se deben sugerir configuraciones para levantar nuevos File Browsers.
* **Analítica (Umami):** Instancia única. El rastreo de nuevos dominios se gestiona agregando el sitio en el dashboard de Umami e inyectando el script en el `<head>` de Astro. No desplegar contenedores separados.

## Flujo de Trabajo (REGLAS ESTRICTAS PARA LA IA)
Existen dos métodos de actualización. Antes de generar código, debes indicar explícitamente qué método utilizar:

1.  **Ediciones Menores (Textos, colores, ajustes de un solo archivo):**
    * **Método:** Edición directa en File Browser.
    * **Acción de la IA:** Proveer la ruta absoluta del archivo y el bloque de código a modificar. El servidor de desarrollo de Astro recompilará en caliente.
2.  **Cambios Estructurales (Múltiples componentes, instalación de dependencias, refactorización):**
    * **Método:** Desarrollo local -> Git Push -> `git pull` en el VPS.
    * **Acción de la IA:** Generar el código para el entorno local. Si se requiere modificar `package.json` (nuevas dependencias de npm), la IA debe incluir el comando `docker restart <nombre_del_contenedor>` para que se instalen al reiniciar.
    * **Advertencia:** Inducir al usuario a hacer cambios grandes vía File Browser generará conflictos de Git irrecuperables.