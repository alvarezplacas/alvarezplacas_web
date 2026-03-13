-- Esquema inicial para Alvarezplacas

CREATE TYPE user_role AS ENUM ('client', 'seller', 'admin');
CREATE TYPE budget_status AS ENUM ('draft', 'sent', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'cut', 'delivered');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'client',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100), -- Egger, Faplac, Sadepan
    width_raw INTEGER, -- Dimensión original antes del refilado
    height_raw INTEGER,
    category VARCHAR(100),
    thickness DECIMAL(5,2),
    price_m2 DECIMAL(12,2),
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE
);

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
    length INTEGER NOT NULL, -- en mm
    width INTEGER NOT NULL, -- en mm
    quantity INTEGER DEFAULT 1,
    orientation BOOLEAN DEFAULT TRUE, -- TRUE = Veta largo, FALSE = Veta ancho
    
    -- Tapacantos: 0 = sin tapacanto, 0.45 = 0.45mm, 2 = 2mm
    edge_top DECIMAL(3,2) DEFAULT 0,
    edge_bottom DECIMAL(3,2) DEFAULT 0,
    edge_left DECIMAL(3,2) DEFAULT 0,
    edge_right DECIMAL(3,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER REFERENCES budgets(id),
    status order_status DEFAULT 'pending',
    tracking_code VARCHAR(100),
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configuración inicial
INSERT INTO site_settings (key, value) VALUES ('maintenance_mode', 'false');

-- Insertar usuario admin inicial
-- ...
