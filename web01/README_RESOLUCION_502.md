# 🚨 README: Resolución de Error Crítico 502 y Base de Datos (Marzo 2026)

**ATENCIÓN FUTURO AGENTE O DESARROLLADOR:** 
Si te enfrentas a un `502 Bad Gateway` en el panel de Directus (`admin.alvarezplacas.com.ar`), o si los logs de Docker muestran un error `password authentication failed for user "alvarez_admin"`, **LEE ESTO ANTES DE CAMBIAR CÓDIGO.**

## 1. El Contexto del Error
El `docker-compose.yml` de este proyecto (ubicado en `web01/`) tiene credenciales definidas para Postgres (`AlvarezAdmin2026`). Sin embargo, en implementaciones anteriores, el volumen físico de Docker (`alvarez_data_v2`) pudo haber quedado corrupto o inicializado con una contraseña antigua (ej. `AdminAlvarez2026` u otras pruebas de desarrollo).

## 2. El Comportamiento Oculto de Docker
Cuando Postgres detecta que el "Data Volume" ya existe, **ignora por completo cualquier nueva contraseña definida en el `docker-compose.yml`**. 
Si cambias la clave en el archivo, Directus intentará usarla, pero Postgres la rechazará porque confiará en la clave antigua grabada en su volumen. Esto causa que Directus colapse y arroje el 502 en Cloudflare.

## 3. La Solución Probada e Infalible
En lugar de forzar parches al usuario usando comandos `psql`, el método más limpio (si puedes prescindir temporalmente de la data fresca del entorno local) es destruir el volumen conflictivo.

**Debes ejecutar esto:**
```bash
# Apaga el sistema interconectado y el argumento '-v' borra los volúmenes corruptos atascados.
# Nota: Esto NO borra los archivos (BIND MOUNTS) de FileBrowser, solo los discos duros virtuales que causan conflicto.
docker compose down -v

# Reinicia el sistema. En este boot, Postgres (al ver que no hay disco) aplicará correctamente las variables de entorno para siempre.
docker compose up -d
```

## 4. Arquitectura y Seguridad
*   **Contraseñas funcionales**: `AlvarezAdmin2026` (Postgres) y `JavierMix2026!` (Directus Admin).
*   **Aislamiento de red**: Postgres NUNCA se debe exponer a un `port` hacia el exterior en ambientes de producción a menos que sea a `127.0.0.1`. Aquí, la comunicación es estrictamente interna (`alvarez_internal`) entre Node y la BD.

*Documentado tras la victoria conjunta del ecosistema de Agentes y Javiermix. ¡Sigue construyendo genialidades!*

---

## 🚨 Resolución de "503 Service Unavailable" (Almacenamiento S3/MinIO)
**Síntoma:** Directus responde pero la "Biblioteca de Archivos" da error, o las imágenes del catálogo no cargan.

**Causas y Soluciones:**
1.  **Endpoint S3 Incorrecto**: Si se usa una IP interna en `STORAGE_S3_ENDPOINT` (ej: `172.19.0.6`), esta cambia al reiniciar contenedores.
    *   *Solución*: Usar siempre el nombre del servicio Docker (ej: `http://alvarezplacas-minio:9000`).
2.  **Guiones Bajos en Hostname**: MinIO y algunos clientes S3 rechazan hostnames con `_` (ej: `alvarezplacas_minio`), devolviendo `Invalid Request (invalid hostname)`.
    *   *Solución*: Renombrar el servicio a `alvarezplacas-minio` (con guion medio) tanto en `services:` como en `container_name:` y en la variable `STORAGE_S3_ENDPOINT`.
3.  **Path Style**: MinIO requiere que las peticiones no usen subdominios de bucket.
    *   *Solución*: Asegurar `STORAGE_S3_FORCE_PATH_STYLE: "true"`.

*Manual actualizado por Antigravity-IA - Abril 2026*
