# 🐙 Guía de Solución de Problemas de Despliegue (GitHub Actions)

Este documento registra los problemas encontrados y las soluciones aplicadas durante la configuración del repositorio `alvarezplacas_web`.

## 1. Conexión SSH y Secrets
- **Problema**: El despliegue fallaba porque el repositorio nuevo no tenía las credenciales.
- **Solución**: Se configuraron los siguientes Secrets en GitHub:
  - `SSH_HOST`: IP del servidor (`144.217.163.13`).
  - `SSH_PASSPHRASE`: Contraseña root (`JavierMix2026!`).
  - `SSH_PRIVATE_KEY`: El contenido del archivo `alvarez_vps.key`.

## 2. Error "ssh: short read"
- **Problema**: GitHub no podía leer correctamente la llave privada (posiblemente por errores de formato al copiar).
- **Solución**: Cambiamos la autenticación de **Llave Privada** a **Contraseña** en el archivo `deploy.yml`:
  ```yaml
  password: ${{ secrets.SSH_PASSPHRASE }}
  ```
  Esto es más fiable y evitó los errores de formato.

## 3. Error "no such host"
- **Problema**: GitHub no lograba resolver la dirección del servidor usando el Secret `SSH_HOST`.
- **Solución**: Se puso la IP del servidor directamente en el campo `host` del `deploy.yml`.

## 4. Conflicto de Archivos en el VPS (Aborting Merge)
- **Problema**: El comando `git pull` fallaba en el servidor porque había cambios locales no registrados (en `docker-compose.yml`). El sitio parecía actualizarse ("verde" en GitHub) pero el código seguía siendo el viejo.
- **Solución**: Se forzó la actualización en `deploy.yml` usando:
  ```bash
  git fetch origin main
  git reset --hard origin/main
  git clean -fd
  ```
  Esto asegura que el servidor siempre tenga una copia exacta de lo que hay en GitHub, borrando cualquier residuo viejo.

---
*Documento creado el 13/03/2026 para referencia futura.*
