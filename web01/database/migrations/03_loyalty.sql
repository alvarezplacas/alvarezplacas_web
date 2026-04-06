-- Migration 03: Club de Clientes - Ledger de Puntos
-- Propósito: Auditoría completa de puntos ganados y canjeados para evitar fraudes.

-- 1. Registro Central de Movimientos de Puntos (Auditable)
CREATE TABLE IF NOT EXISTS loyalty_points_ledger (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount INTEGER NOT NULL, -- Positivo = Suma (Compra), Negativo = Resta (Canje/Vencimiento)
    reason VARCHAR(255) NOT NULL, -- 'compra_material', 'bonus_bienvenida', 'canje_premio', 'vencimiento'
    reference_id VARCHAR(100), -- ID de Pedido u ID de Premio
    valid_until TIMESTAMP WITH TIME ZONE, -- Para manejo de vencimientos automáticos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) -- ID del Vendedor o Admin
);

-- 2. Definición de Niveles de Cliente (Gamification)
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- 'Silver', 'Gold', 'Black'
    min_points_acc INTEGER NOT NULL, -- Puntos acumulados de por vida para alcanzar el rango
    benefit_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Multiplicador de puntos x compra
    discount_percentage DECIMAL(5,2) DEFAULT 0.0, -- Descuento directo en el total
    icon_url TEXT
);

-- Inserción de Tiers Iniciales
INSERT INTO loyalty_tiers (name, min_points_acc, benefit_multiplier, discount_percentage)
VALUES 
('Base', 0, 1.0, 0.0),
('Silver', 5000, 1.2, 5.0),
('Gold', 15000, 1.5, 10.0),
('Alvarez Black', 50000, 2.0, 15.0);

-- 3. Vista de Saldo Consolidado (Para Performance en el Dashboard)
CREATE VIEW view_user_points AS
SELECT 
    user_id,
    SUM(amount) as current_points,
    MAX(created_at) as last_activity
FROM loyalty_points_ledger
GROUP BY user_id;
