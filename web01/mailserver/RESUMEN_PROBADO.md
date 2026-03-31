# Resumen de Pruebas - Configuración de Correo (Pendiente)

Este documento resume lo intentado para resolver el acceso a Roundcube y los resultados obtenidos para evitar repeticiones.

## Estado Actual
- **Pantalla de Login**: FUNCIONA (v14 del `docker-compose.yml`).
- **Acceso IMAP**: ERROR ("Error de conexión con el servidor IMAP").
- **Causa probable**: El servidor de correo requiere TLS/SSL y el certificado es autofirmado. Roundcube rechaza la conexión por seguridad.

## Lo que se probó y NO funcionó:
1.  **Montaje de `config.inc.php` personalizado**: 
    - **Resultado**: Error "Oops... something went wrong!".
    - **Causa**: Problema de permisos de Linux/Docker al montar archivos desde Windows. El contenedor no puede escribir en la DB ni en los logs si se monta este archivo.
2.  **Ejecutar como `user: root`**:
    - **Resultado**: Seguía dando error "Oops". No resolvió el problema de permisos de la aplicación Apache interna.
3.  **Uso de volúmenes nombrados**:
    - **Resultado**: No resolvió el conflicto cuando el archivo de configuración estaba presente.

## Lo que SÍ funcionó:
1.  **Eliminar el montaje del archivo personalizado**: Restauró la pantalla de login (v14).
2.  **Conexión básica por red interna**: El contenedor de Roundcube ve al de `mailserver`.

## Próximos pasos sugeridos:
1.  **Parchear el SSL sin romper los permisos**: 
    - Opción A: Usar un `docker build` para meter el archivo dentro de la imagen con los permisos correctos (`chown www-data`).
    - Opción B: Usar comandos `sed` en el `entrypoint`.
2.  **Credenciales**: Confirmar si el servidor de correo tiene activa la cuenta `info@alvarezplacas.com.ar` con `Tecno/315`.

---
*Manual detallado de estudio disponible en: `C:\Users\javier\.gemini\antigravity\brain\...\manual_roundcube_astro.md`*
