-- Migration 01: Multi-Location Support (Branches)
-- Propósito: Permitir que Alvarez Placas escale a múltiples puntos de venta físicos.

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- 'Villa Tesei', 'Hurlingham', 'San Miguel'
    address TEXT NOT NULL,
    phone VARCHAR(50),
    geocoordinate VARCHAR(100), -- 'lat, lng' para Google Maps
    is_main_branch BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar sucursales base
INSERT INTO branches (name, address, phone, geocoordinate, is_main_branch)
VALUES 
('Casa Central - Villa Tesei', 'Av. Vergara 2200, Villa Tesei, Buenos Aires', '011 4450-XXXX', '-34.6300, -58.6300', TRUE),
('Sucursal Hurlingham', 'Av. Roca 1200, Hurlingham, Buenos Aires', '011 4665-XXXX', '-34.5900, -58.6400', FALSE);

-- Modificar tabla users para vincular con IDs de sucursal en lugar de strings
ALTER TABLE users ADD COLUMN branch_id INTEGER REFERENCES branches(id);

-- Migración de datos heredados (Legacy mapping)
UPDATE users SET branch_id = (SELECT id FROM branches WHERE name ILIKE '%Tesei%') WHERE branch ILIKE '%Tesei%';
UPDATE users SET branch_id = (SELECT id FROM branches WHERE name ILIKE '%Hurlingham%') WHERE branch ILIKE '%Hurlingham%';
