# 🛡️ Guía de Blindaje e Infraestructura Resiliente (v16)

Esta guía documenta la arquitectura de "Cableado" diseñada para asegurar que el ecosistema de **Alvarez Placas** sea robusto, se recupere solo ante fallos y permanezca 100% aislado de otros sitios como `javiermix.ar`.

---

## 🏗️ Diagrama de Redes y Aislamiento

Para garantizar que un cambio en un sitio no rompa el otro, utilizamos un sistema de **Redes Duales**:

1.  **Red Pública (`javiermix_network`)**: 
    - Es el "puente" externo. 
    - Solo los servicios que necesitan ser vistos por internet (Web, Directus Admin, Consola MinIO) se conectan aquí.
    - Se gestiona a través del Proxy Inverso (Caddy).

2.  **Red Privada (`alvarez_prod_private_net`)**: 
    - Es el "cableado interno". 
    - Aquí vive la comunicación entre Base de Datos, Motores de Búsqueda y Almacenamiento.
    - **Nadie desde fuera puede tocar estos servicios directamente.**

---

## 🚀 Resiliencia y Auto-Recuperación (Healthchecks)

Hemos implementado **Controles de Salud** para evitar el error `502 Bad Gateway`:

- **Base de Datos**: El sistema verifica que Postgres esté listo para recibir conexiones antes de arrancar los demás.
- **Directus**: No se marca como "visto" por el proxy hasta que su API responde `200 OK`.
- **Dependencias**: La web de Astro espera a que Directus esté "Sano" para iniciar su proceso de construcción.

**Regla de Oro para Futuros Agentes:**
> [!CAUTION]
> NUNCA cambies una dependencia de `condition: service_healthy` a `service_started`. Si lo haces, el sitio intentará cargar antes de que la base de datos esté lista y fallará.

---

## 🔒 Reglas de Seguridad para el VPS

1.  **Aislamiento de Directorios**: 
    - Todo lo de Alvarez Placas vive en `/opt/alvarez_v16/`. 
    - Todo lo de JavierMix vive en `/opt/javiermix/`.
    - **PROHIBIDO** crear enlaces simbólicos o referencias cruzadas entre estas carpetas.

2.  **Tokens y Secretos**: 
    - El token estático `alvarez-api-token-v16-2026` debe mantenerse sincronizado entre Directus y la variable `PUBLIC_DIRECTUS_URL` del Frontend.

3.  **Puertos Host**: 
    - Solo se exponen los puertos esenciales:
        - `4321` (Web)
        - `8055` (Directus)
    - Los motores de Meilisearch y MinIO API permanecen ocultos tras la red privada.

---

## 🔄 Procedimiento de Reinicio en Catástrofe

Si el servidor se reinicia inesperadamente:
1. Docker levantará los contenedores en orden.
2. Caddy renovará los certificados SSL automáticamente.
3. El `start_period` de Directus le da 30 segundos de margen para estabilizarse antes de recibir tráfico.

---

*Documento creado por Antigravity para asegurar la posteridad técnica del proyecto.*
