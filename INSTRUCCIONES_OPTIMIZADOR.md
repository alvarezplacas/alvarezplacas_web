# Manual Técnico: Optimizador de Corte v4.4 (Alvarez Placas)

Este documento detalla el funcionamiento del nuevo Optimizador de Corte integrado en el sitio web principal.

## 1. Integración con Astro
- **Ruta del Archivo**: `web01/src/pages/herramientas/optimizador.astro`
- **Dependencias**: No requiere librerías externas (Vanilla JS/CSS) para máxima velocidad de carga.
- **Activos**: El CSS y JS están inyectados directamente en el archivo `.astro` para evitar peticiones adicionales.

## 2. Sistema de Autenticación (Auth Wall)
El optimizador utiliza las cookies existentes del sitio principal para verificar la sesión:
- `client_session`: Contiene el ID del cliente registrado.
- `seller_session`: Sesión activa de un vendedor.
- `admin_session`: Sesión activa del administrador.

**Lógica**: Si no existe ninguna de estas cookies, el botón de "Enviar" y "Descargar Plano" disparará un modal de registro. La carga de piezas sigue siendo pública para atraer leads.

## 3. Motor de Optimización
- **Algoritmo**: Monte Carlo de Guillotina con múltiples heurísticas.
- **Restricciones**: Cortes pasantes obligatorios (seccionadora manual/automática).
- **Tapacantos**: Los datos de tapacanto se restan de la medida nominal para obtener la medida de corte real, y se marcan visualmente con líneas de puntos en el plano.

## 4. Flujo de Datos
- **Exportación**: El sistema genera un string formateado para WhatsApp.
- **Escalabilidad**: Se puede conectar con `api/messages.ts` para enviar los datos internamente a la base de datos de pedidos de Alvarez Placas usando el ID de la cookie.

## 5. Instrucciones para el VPS
1. Ejecutar `npm run build` en la carpeta `web01`.
2. Verificar que la ruta `/herramientas/optimizador` sea accesible.
3. Asegurar que las cookies de dominio estén configuradas correctamente para que el optimizador las lea.

---
*Desarrollado por el Equipo de Advanced Agentic Coding - Mayo 2026*
