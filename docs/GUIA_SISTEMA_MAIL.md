# Guía Maestra: Sistema de Email Alvarez Placas

Este documento detalla la arquitectura, ubicación y gestión del sistema de correos tras la estabilización de mayo de 2026.

## 1. ¿Qué pasó? (Causa de la falla)
El sistema dejó de ser accesible por tres factores concurrentes:
1.  **Colisión de Puertos**: El puerto `8080` (original de SnappyMail) fue "secuestrado" por el servicio `Nextcloud AIO`, lo que redirigía el tráfico de correo a una pantalla de login de Nextcloud.
2.  **Corrupción de Configuración**: Los intentos previos de resetear la clave mediante archivos `.txt` no funcionaban porque SnappyMail no los consumía. Además, se aplicaron "hacks" al código fuente de la aplicación que se perdían al reiniciar el contenedor, dejando el acceso bloqueado.
3.  **Desincronización del Proxy**: Caddy intentaba buscar el servicio en el puerto viejo mientras que el contenedor intentaba levantarse en uno nuevo sin éxito.

## 2. Arquitectura del Sistema
El sistema se compone de dos "células" principales alojadas en el VPS (`144.217.163.13`):

*   **Motor de Correo (Mailserver)**:
    *   **Imagen**: `docker-mailserver`
    *   **Función**: Gestiona el envío (SMTP) y recepción (IMAP) real de los correos.
    *   **Puertos**: 25 (SMTP), 143 (IMAP), 587 (Submission), 993 (IMAPS).
*   **Interfaz Web (SnappyMail)**:
    *   **Imagen**: `snappymail` (fork moderno de RainLoop)
    *   **Función**: El panel visual donde los usuarios leen y escriben correos.
    *   **Puerto Interno**: `8888`
    *   **Puerto VPS**: `8091` (Mapeado en Docker).
    *   **Almacenamiento**: Migrado a **PostgreSQL v16** (Base de datos `snappymail` en el contenedor `javiermix-db`).
    *   **Acceso Público**: `https://mail.alvarezplacas.com.ar` (vía Caddy).

## 3. Ubicación de Archivos en el VPS
Toda la configuración reside en la carpeta:
`/opt/alvarez_prod_mail/`

*   `docker-compose.yml`: Define los servicios y redes.
*   `snappymail-data/`: Contiene toda la persistencia de la interfaz web.
    *   `_data_/_default_/configs/application.ini`: Configuración principal y clave de admin.
    *   `_data_/_default_/domains/`: Archivos `.json` con la configuración de conexión para cada dominio.

## 4. Datos Técnicos de Conexión
Para configurar clientes externos (Outlook, Gmail, etc.) o dentro de SnappyMail:

*   **Dominio**: `alvarezplacas.com.ar`
*   **Servidor (Host)**: `mailserver` (si es interno) o `mail.alvarezplacas.com.ar` (si es externo).
*   **IMAP**: Puerto `143` | Seguridad: `STARTTLS`.
*   **SMTP**: Puerto `587` | Seguridad: `STARTTLS`.

## 5. Gestión Administrativa
*   **Panel de Administración**: `https://mail.alvarezplacas.com.ar/?admin`
*   **Usuario**: `admin`
*   **Seguridad**: Protegido con **TOTP (Segundo Factor de Autenticación)** configurado en mayo de 2026. Se requiere la app Google Authenticator para ingresar.
*   **Reset de Contraseña/2FA**: Si se pierde la clave o el acceso TOTP, se debe editar el archivo `application.ini` en el servidor:
    *   Para clave: Cambiar `admin_password`.
    *   Para TOTP: Limpiar el campo `admin_totp`.

## 6. Configuración de Almacenamiento (PostgreSQL)
SnappyMail utiliza PostgreSQL para contactos y configuraciones globales con los siguientes parámetros:
*   **Host**: `javiermix-db`
*   **Port**: `5432`
*   **Database**: `snappymail`
*   **User**: `postgres`
Tras el escaneo realizado, se confirmó que:
- La red `javiermix_network` permite la comunicación interna entre SnappyMail y Mailserver sin exponer puertos sensibles al exterior innecesariamente.
- El uso de memoria es estable.
- Caddy está configurado como terminador SSL, lo que garantiza que todo el tráfico de correo viaje cifrado (HTTPS).
