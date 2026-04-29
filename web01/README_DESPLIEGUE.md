# 🚀 Guía de Despliegue Seguro - Alvarez Placas

Este documento detalla el procedimiento para subir cambios desde el entorno local al VPS de producción con total seguridad.

## 1. Conexión y Seguridad
La conexión se realiza mediante **SSH** utilizando una clave privada RSA (`alvarez_vps.key`). 
- **IP del VPS**: `144.217.163.13`
- **Usuario**: `root`
- **Ruta de la Web**: `/opt/alvarez_v16/web01/site/web01`

## 2. Envío de Archivos (Local -> VPS)
Para enviar los archivos de forma segura sin romper el servidor, utilizamos el script:
`C:\Users\javier\Desktop\SUBIR_FRONTEND_ALVAREZ.bat`

Este script utiliza el comando `scp` (Secure Copy) para transferir solo los archivos modificados. Asegúrate de que los archivos estén guardados en tu PC antes de ejecutarlo.

## 3. Activación de Cambios (Build)
Una vez subidos los archivos, los cambios **no se verán** hasta que el servidor Astro los compile. Para ello, entra en la terminal de tu VPS y ejecuta:

```bash
docker exec alvarezplacas_web npm run build && docker restart alvarezplacas_web
```

### ¿Qué hace este comando?
1. `docker exec`: Entra en el contenedor de la web.
2. `npm run build`: Compila todo el código (Astro genera la versión estática y de servidor).
3. `docker restart`: Reinicia el contenedor para limpiar caché y aplicar la nueva compilación.

## 4. Verificación de Errores
Si ves un error **502**, significa que la compilación falló o falta un archivo.
- **Acción**: Revisa el `.bat` para asegurar que el archivo modificado está en la lista de subida.
- **Log**: Puedes ver qué pasa con `docker logs alvarezplacas_web`.

---
**Documento generado por Antigravity - 28/04/2026**
