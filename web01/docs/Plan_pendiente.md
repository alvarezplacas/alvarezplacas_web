# Plan Pendiente — Post-Restauración v16 (Abril 2026)

> [!NOTE]
> La infraestructura fue restaurada el 07/04/2026. La web está en línea pero el catálogo no muestra productos aún.

---

## 🔴 Pendiente Urgente

### 1. Conectar el Catálogo al Directus
**Problema**: La web carga pero muestra "No se encontraron productos".
**Causa probable**: La variable `DIRECTUS_URL_INTERNAL` en el contenedor web no resuelve correctamente al contenedor de Directus.

**Pasos para resolver:**
1. Verificar que ambos contenedores estén en la misma red:
   ```bash
   docker inspect alvarezplacas_web | grep Networks -A 20
   docker inspect alvarezplacas_directus_v16 | grep Networks -A 20
   ```
2. Probar conexión interna desde el contenedor web:
   ```bash
   docker exec alvarezplacas_web wget -qO- http://alvarezplacas_directus_v16:8055/server/health
   ```
3. Si falla, cambiar en `docker-compose.vps.yml`:
   ```yaml
   - DIRECTUS_URL_INTERNAL=https://admin.alvarezplacas.com.ar
   ```

### 2. Permisos Públicos Directus
**Problema**: El rol "Público" de Directus puede no tener permisos de lectura sobre `materiales`, `marcas`, `categorias`, `espesores`.
**Acción**: Ejecutar script `scripts/fix_public_permissions_es.mjs` apuntando a `https://admin.alvarezplacas.com.ar`.

---

## 🟡 Pendiente Normal

### 3. Workflow de Deploy Automatizado
Actualizar el script `scripts/upload_to_vps.bat` para que en lugar de hacer `git push` + alertar, también haga `git pull` en el VPS y el rebuild automáticamente.

### 4. Banner de Horarios Especiales (Feriados)
Crear colección `fechas_especiales` en Directus:
- Fields: `fecha` (ISO Date), `mensaje` (String), `activo` (Boolean).
- Actualizar `Hero.astro` para leer estas fechas.

---

## ✅ Completado

- [x] **Restauración DB**: Volumen `web01_alvarez_data_v16` recuperado con 69 materiales.
- [x] **Código desplegado**: Git clone en `/opt/alvarez_v16/web01/site/`.
- [x] **Build exitoso**: `dist/server/entry.mjs` generado.
- [x] **Web en línea**: `alvarezplacas.com.ar` responde (sin 502).
- [x] **Directus online**: `admin.alvarezplacas.com.ar` accesible.
- [x] **Documentación**: `VPS_INFRAESTRUCTURA_V16.md` creado con toda la configuración.

---

*Actualizado el 07 de Abril de 2026.*
