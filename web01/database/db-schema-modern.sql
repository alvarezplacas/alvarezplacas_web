-- Esquema Evolucionado v16 (Abril 2026) - Alvarez Placas
-- Incorpora lógica para automatización de SKU y Descripciones

-- 1. Tablas Maestras (Tablas de Referencia)
CREATE TABLE IF NOT EXISTS rubros (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo_letra CHAR(1) NOT NULL UNIQUE, -- E.g., 'M' para Maderas
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS marcas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo_numerico CHAR(2) NOT NULL UNIQUE, -- E.g., '10' para EGGER
    activo BOOLEAN DEFAULT TRUE
);

-- 2. Tabla de Productos (Evolución de materials)
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(20) UNIQUE, -- Generado por Directus Flow: X-YY-ZZZZ
    rubro_id INTEGER REFERENCES rubros(id),
    marca_id INTEGER REFERENCES marcas(id),
    
    modelo VARCHAR(255) NOT NULL, -- E.g., "Roble Vicenza"
    espesor DECIMAL(5,2),        -- E.g., 18.0
    soporte VARCHAR(50),         -- E.g., "MDF", "AGL"
    
    descripcion TEXT,            -- Generado por Directus Flow
    
    -- Dimensiones
    ancho_mm INTEGER,
    largo_mm INTEGER,
    
    -- Precios y Stock
    precio_base DECIMAL(12,2) DEFAULT 0,
    stock_actual INTEGER DEFAULT 0,
    
    -- Metadatos y Media
    imagen_principal TEXT,       -- URL en MinIO
    slug VARCHAR(255) UNIQUE,    -- Para SEO en Astro
    activo BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inserciones Iniciales (Semillas)
INSERT INTO rubros (nombre, codigo_letra) VALUES 
('Maderas', 'M'),
('Herrajes', 'H'),
('Insumos', 'I'),
('Química', 'Q'),
('Tapacantos', 'T')
ON CONFLICT DO NOTHING;

INSERT INTO marcas (nombre, codigo_numerico) VALUES 
('EGGER', '10'),
('FAPLAC', '20'),
('SADEPAN', '30'),
('NOVA', '40'),
('HAFELE', '50'),
('FORTEX', '60')
ON CONFLICT DO NOTHING;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_productos_modtime
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
