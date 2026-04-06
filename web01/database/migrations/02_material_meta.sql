-- Migration 02: Normalización de Materiales y Tapacantos
-- Propósito: Mejorar el filtrado del catálogo y la gestión de variaciones (Egger, Faplac, etc.)

-- 1. Tablas de Metadatos
CREATE TABLE IF NOT EXISTS material_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    website TEXT,
    order_rank INTEGER DEFAULT 0 -- Para que Egger aparezca primero ;)
);

CREATE TABLE IF NOT EXISTS material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- 'Melaminas', 'MDF Crudo', 'Pisos Vinílicos'
    slug VARCHAR(100) UNIQUE,
    parent_id INTEGER REFERENCES material_categories(id) -- Permite jerarquías
);

CREATE TABLE IF NOT EXISTS material_thicknesses (
    id SERIAL PRIMARY KEY,
    value DECIMAL(5,2) NOT NULL UNIQUE, -- 15.00, 18.00, 25.00
    display_unit VARCHAR(10) DEFAULT 'mm'
);

-- 2. Inserción de Datos Maestros
INSERT INTO material_brands (name, order_rank) VALUES ('Egger', 10), ('Faplac', 20), ('Sadepan', 30), ('Masisa', 40);
INSERT INTO material_categories (name, slug) VALUES ('Melaminas', 'melaminas'), ('MDF', 'mdf'), ('Herrajes', 'herrajes');
INSERT INTO material_thicknesses (value) VALUES (15), (18), (25), (3);

-- 3. Actualización de la Tabla de Materiales
ALTER TABLE materials ADD COLUMN brand_id INTEGER REFERENCES material_brands(id);
ALTER TABLE materials ADD COLUMN category_id INTEGER REFERENCES material_categories(id);
ALTER TABLE materials ADD COLUMN thickness_id INTEGER REFERENCES material_thicknesses(id);

-- 4. Migración de datos existentes (Si existieran mapeos directos)
UPDATE materials SET brand_id = (SELECT id FROM material_brands WHERE name ILIKE materials.brand);
UPDATE materials SET category_id = (SELECT id FROM material_categories WHERE name ILIKE materials.category);
UPDATE materials SET thickness_id = (SELECT id FROM material_thicknesses WHERE value = materials.thickness);
