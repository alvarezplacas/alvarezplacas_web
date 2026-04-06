-- Migration 05: Trazabilidad de Pedidos y Línea de Tiempo
-- Propósito: Cronometrar cuánto tiempo pasa un pedido en cada sección (Oficina, Corte, Reparto)

-- 1. Historial de Cambios de Estado (Auditable)
CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    old_status order_status,
    new_status order_status NOT NULL,
    changed_by INTEGER REFERENCES users(id), -- El usuario que impulsó el cambio
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Asignación de Prioridad en Cola de Corte
ALTER TABLE orders ADD COLUMN priority_level INTEGER DEFAULT 50; -- 1: Urgente, 50: Normal, 100: Baja
ALTER TABLE orders ADD COLUMN expected_delivery_date DATE;

-- 3. Índices para el Dashboard de Vendedores
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_date ON order_status_history(timestamp);

-- 4. Trigger inicial para capturar el primer estado
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO order_status_history (order_id, new_status, changed_by, notes)
        VALUES (NEW.id, NEW.status, NEW.seller_id, 'Creación inicial del pedido');
    ELSIF (NEW.status <> OLD.status) THEN
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.seller_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_order_status
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_change();
