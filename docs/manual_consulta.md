# 📘 Manual de Consulta Especializado: PostgreSQL 16 - Alvarez Placas

Este manual técnico define los estándares de consulta, optimización y mantenimiento para el ecosistema **Directus + Astro** de Alvarez Placas, basado en las capacidades avanzadas de **PostgreSQL 16**.

---

## 1. 🚀 Optimización de Consultas y Planificación

El motor de PostgreSQL 16 ha sido optimizado para la ejecución de consultas agregadas y escaneos de índices paralelos.

### 1.1. Manejo de Esquemas Dinámicos (JSONB)
Directus utiliza `JSONB` para campos dinámicos. Para evitar que el catálogo se ralentice:
*   **Índice GIN (Path Ops)**: Recomendado para filtrar atributos de productos.
    ```sql
    CREATE INDEX idx_productos_metadata ON Productos USING GIN (metadata jsonb_path_ops);
    ```
*   **Consultas Eficientes**: Prefiere el operador `@>` (contiene) para disparar el índice GIN.
    ```sql
    SELECT * FROM Productos WHERE metadata @> '{"espesor": "18mm"}';
    ```

### 1.2. Estadísticas y E/S (`pg_stat_io`)
En el VPS, monitorea si el disco está saturando la base de datos:
```sql
SELECT backend_type, io_object, context, reads, writes 
FROM pg_stat_io 
WHERE reads > 1000;
```
*Si los "reads" son altos para `client backend`, es señal de que falta memoria en `shared_buffers`.*

---

## 2. 🛡️ Resiliencia y Alta Disponibilidad

La arquitectura de Alvarez Placas debe ser "anti-fragilidad".

### 2.1. Replicación Lógica de Secuencias
Fundamental para los Dashboards de Vendedores. PSQL 16 permite replicar secuencias de IDs lógicamente:
```sql
-- En el publicador (Servidor Principal)
CREATE PUBLICATION pub_pedidos FOR TABLE pedidos, vendedores;
ALTER PUBLICATION pub_pedidos ADD SEQUENCE pedidos_id_seq;
```
*Esto asegura que si el servidor falla, el backup tenga el próximo ID de pedido (`ALV-XXXX`) listo.*

### 2.2. Checkpoint Tuning for VPS
Para evitar picos de latencia durante las grabaciones de pedidos masivos:
```text
checkpoint_timeout = 15min
max_wal_size = 2GB
checkpoint_completion_target = 0.9
```

---

## 3. 📦 Mantenimiento y Respaldos Modernos

### 3.1. Respaldos Ultra-Rápidos con Compresión v16
Utiliza la compresión **LZ4** de PostgreSQL 16 para mayor velocidad en el VPS:
```bash
pg_dump -d alvarez_db -Fd -j 4 -Z lz4 -f /opt/alvarez_v16/backups/daily_dump
```

### 3.2. Mantenimiento del Catálogo (Autovacuum)
Tras una carga masiva de Productos (ej. Deep Sync), fuerza la actualización de estadísticas para que el optimizador no use "Sequential Scan" en lugar de índices:
```sql
VACUUM (ANALYZE, VERBOSE) Productos;
```

---

## 4. 📊 Snippets para Dashboards (SQL Avanzado)

### 4.1. Análisis de Deuda por Vendedor
```sql
SELECT 
    v.nombre AS vendedor,
    count(c.id) AS total_clientes,
    SUM(c.debt_amount) AS deuda_total
FROM vendedores v
LEFT JOIN clientes c ON v.id = c.vendedor_asignado
GROUP BY v.nombre
HAVING SUM(c.debt_amount) > 0;
```

### 4.2. Top 5 Marcas más Buscadas (Cross-Join)
```sql
SELECT m.nombre_marca, count(p.id) as cantidad
FROM pedidos p
JOIN items_pedido ip ON p.id = ip.pedido_id
JOIN Productos m ON ip.producto_id = m.id
GROUP BY m.nombre_marca
ORDER BY cantidad DESC
LIMIT 5;
```

---

## 5. 🚨 Protocolo de Exorcismo (Limpieza de Demonios)
Si una colección se "rompe" o queda vacía sin esquema:
1.  **Drop Directus Metadata**: Eliminar primero de `directus_fields` y `directus_collections`.
2.  **Cascading Delete**: Asegurar que las relaciones foráneas no dejen "huérfanos" (PSQL 16 maneja mejor los `FK` en cascada en paralelo).

---
*Manual generado por Antigravity - Basado en la Documentación Oficial de PostgreSQL 16 (Abril 2026)*
