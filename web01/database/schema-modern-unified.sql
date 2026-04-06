-- Alvarez Placas - Modernized Database Schema (Unified)
-- Propósito: Consolidar todas las mejoras estructurales para una instalación limpia en PostgreSQL 15.

-- 1. Tipos de Datos y Enums
CREATE TYPE user_role AS ENUM ('client', 'seller', 'admin');
CREATE TYPE budget_status AS ENUM ('draft', 'sent', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('presupuesto', 'produccion', 'corte', 'terminado', 'transito', 'entregado');
CREATE TYPE financial_status AS ENUM ('clean', 'partial', 'debt');

-- 2. Sucursales
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    geocoordinate VARCHAR(100), -- 'lat, lng'
    is_main_branch BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'client',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    branch_id INTEGER REFERENCES branches(id),
    seller_level VARCHAR(50), -- Sr., Jr., etc.
    
    -- Club de Clientes fields
    client_number VARCHAR(20) UNIQUE,
    points INTEGER DEFAULT 0,
    address TEXT,
    last_order_at TIMESTAMP WITH TIME ZONE,
    is_club_member BOOLEAN DEFAULT FALSE,
    assigned_seller_id INTEGER REFERENCES users(id),
    
    -- Financial state
    fin_status financial_status DEFAULT 'clean',
    debt_amount DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Catálogo de Materiales (Normalizado)
CREATE TABLE material_brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    order_rank INTEGER DEFAULT 0
);

CREATE TABLE material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) UNIQUE
);

CREATE TABLE material_thicknesses (
    id SERIAL PRIMARY KEY,
    value DECIMAL(5,2) NOT NULL UNIQUE
);

CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand_id INTEGER REFERENCES material_brands(id),
    category_id INTEGER REFERENCES material_categories(id),
    thickness_id INTEGER REFERENCES material_thicknesses(id),
    price_m2 DECIMAL(12,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_alert INTEGER DEFAULT 10,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- 5. Presupuestos y Pedidos
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    status budget_status DEFAULT 'draft',
    total_price DECIMAL(12,2) DEFAULT 0,
    lepton_export_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_items (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id),
    length INTEGER NOT NULL,
    width INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    edge_top DECIMAL(3,2) DEFAULT 0,
    edge_bottom DECIMAL(3,2) DEFAULT 0,
    edge_left DECIMAL(3,2) DEFAULT 0,
    edge_right DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER REFERENCES budgets(id),
    user_id INTEGER REFERENCES users(id),
    seller_id INTEGER REFERENCES users(id),
    status order_status DEFAULT 'presupuesto',
    priority_level INTEGER DEFAULT 50, -- 1-100
    total_amount DECIMAL(12,2),
    tracking_code VARCHAR(100),
    expected_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Auditoría y Finanzas (Ledgers)
CREATE TABLE loyalty_points_ledger (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    reference_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    order_id INTEGER REFERENCES orders(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'Cash', 'Transfer', etc.
    receipt_no VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    old_status order_status,
    new_status order_status NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Triggers Automáticos
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO order_status_history (order_id, new_status, changed_by)
        VALUES (NEW.id, NEW.status, NEW.seller_id);
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
