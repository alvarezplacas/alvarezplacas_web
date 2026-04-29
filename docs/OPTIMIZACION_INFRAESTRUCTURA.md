# 🏛️ Guía Maestra de Optimización Técnica (Armonía 2026 - v16)

Este documento detalla las configuraciones necesarias para la **Arquitectura v16** de Alvarez Placas.

---

## 🛡️ Reverse Proxy: Caddy v2.9 (Producción)

En el nuevo entorno aislado (`/opt/alvarez_v16/web01`), Caddy gestiona el tráfico de la siguiente manera:

```caddy
alvarezplacas.com.ar {
    # 🚀 Compresión Avanzada
    encode zstd gzip

    # 🛡️ Cabeceras de Seguridad
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        -Server
    }

    # 🔌 Proxy a Astro (Frontend)
    reverse_proxy localhost:4321

    # 📂 Proxy a Directus CMS (Backend)
    # Se recomienda el puerto 8055 para la administración
    handle /admin/* {
        reverse_proxy localhost:8055
    }
}
```

---

## 🖼️ Gestión de Medios: Directus 11 (AVIF / PG 16)

Para que el catálogo de placas vuele:
1. **Optimización Inyectada**: Se ha sincronizado el esquema (`directus_snapshot.json`) para que se hereden los índices de **PostgreSQL 16**, acelerando filtrados por material.
2. **AVIF**: Las peticiones desde el frontend vía `?format=avif` son procesadas nativamente por Directus 11 mediante la librería `sharp`.

---

## ⚡ Conectividad y Rendimiento (WebSockets)

Para habilitar notificaciones instantáneas de pedidos en el Dashboard:
1. **Redis**: Habilitar contenedor `alvarez_redis_v16`.
2. **Configuración Directus**: `WEBSOCKETS_ENABLED=true` y `MESSENGER_STORE=redis`.

---

## 📜 Checklist de Armonía v16
- [x] Verificar que el puerto **8055** sea accesible desde Caddy.
- [x] Comprobar que los logs de Directus no muestren errores de metadatos (Forbidden).
- [x] Validar que el volumen `alvarez_data_v16` tenga acceso de escritura.

---

*Guía técnica validada por Antigravity tras la migración v16.*
