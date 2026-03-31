# 📧 Manual Técnico: Configuración de Emails (Alvarez Placas)

Este documento detalla la resolución de los fallos de acceso y los datos técnicos para conectar dispositivos y gestionar el correo de Alvarez Placas.

---

### 🔑 1. Acceso al Panel de Administración (SnappyMail)
Este panel se usa para gestionar dominios, usuarios y configuraciones globales.

- **URL Admin:** [http://144.217.163.13:8080/?admin](http://144.217.163.13:8080/?admin)
- **Usuario:** `admin`
- **Contraseña Actual:** `TPRA7QS82Zem` (Clave inicial generada por el sistema).
- **Nota:** Si la clave dejara de funcionar por un reseteo de contenedor, se puede recuperar ejecutando en el VPS: `docker exec snappymail cat /var/lib/snappymail/_data_/_default_/admin_password.txt`.

---

### ⚙️ 2. Datos de Conexión (Outlook, Gmail, Celulares)
Para configurar cualquier cuenta de correo en un dispositivo de escritorio o móvil, usar los siguientes servidores:

| Servicio | Host/Servidor | Puerto | Seguridad |
| :--- | :--- | :--- | :--- |
| **IMAP (Recepción)** | `mail.alvarezplacas.com.ar` | **993** | SSL/TLS |
| **SMTP (Envío)** | `mail.alvarezplacas.com.ar` | **465** | SSL/TLS |

- **Usuario:** Tu email completo (ej: `info@alvarezplacas.com.ar`)
- **Autenticación:** Requerida para salida (SMTP) usando las mismas credenciales que el IMAP.

---

### 👥 3. Directorio de Cuentas Oficiales
Cuentas que deben estar activas en el servidor:

- `info@alvarezplacas.com.ar`
- `Javier@alvarezplacas.com.ar`
- `ariel@alvarezplacas.com.ar`
- `maru@alvarezplacas.com.ar`
- `proveedores@alvarezplacas.com.ar`
- `braian@alvarezplacas.com.ar`
- `facundo@alvarezplacas.com.ar`

---

### 🛠️ 4. Estructural del VPS
- **Ubicación:** `/home/ubuntu/infra/mailserver`
- **Servicio:** `docker-mailserver` + `SnappyMail`
- **Certificados SSL:** `/home/ubuntu/infra/nginx-proxy-manager/data/custom_ssl/npm-8`

---
*Documento generado por Antigravity AI (Google Deepmind) - 30/03/2026.*
