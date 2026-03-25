-- Esquema inicial para Alvarezplacas

CREATE TYPE user_role AS ENUM ('client', 'seller', 'admin');
CREATE TYPE budget_status AS ENUM ('draft', 'sent', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'cut', 'delivered');
CREATE TYPE financial_status AS ENUM ('clean', 'partial', 'debt');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'client',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    branch VARCHAR(100), -- Sucursal: Villa Tesei, Hurlingham, etc.
    seller_level VARCHAR(50), -- Sr., Jr., etc.
    
    -- Club de Clientes fields
    client_number VARCHAR(20) UNIQUE,
    points INTEGER DEFAULT 0,
    address TEXT,
    last_order_at TIMESTAMP WITH TIME ZONE,
    points_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_club_member BOOLEAN DEFAULT FALSE,
    assigned_seller_id INTEGER REFERENCES users(id),
    
    -- Financial fields
    fin_status financial_status DEFAULT 'clean',
    debt_amount DECIMAL(12,2) DEFAULT 0,
    due_date DATE,
    financial_notes TEXT,
    
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
    user_id INTEGER REFERENCES users(id),
    seller_id INTEGER REFERENCES users(id),
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(12,2),
    tracking_code VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE points_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount INTEGER NOT NULL,
    reason TEXT, -- 'order', 'inactivity_deduction', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configuración inicial
INSERT INTO site_settings (key, value) VALUES ('maintenance_mode', 'false');

-- Insertar usuario admin inicial
INSERT INTO users (email, password_hash, role, full_name, branch, seller_level) 
VALUES ('alvarezjavierh@gmail.com', '$2b$10$YourHashHere', 'admin', 'Javier Alvarez', 'Casa Central', 'Administrador');

-- Insertar vendedores de prueba (Igual que el Mock previo pero en DB)
INSERT INTO users (email, password_hash, role, full_name, branch, seller_level)
VALUES ('martin@alvarezplacas.com', 'pass', 'seller', 'Martín Giménez', 'Villa Tesei', 'Vendedor Sr.');
INSERT INTO users (email, password_hash, role, full_name, branch, seller_level)
VALUES ('laura@alvarezplacas.com', 'pass', 'seller', 'Laura Sánchez', 'Hurlingham', 'Vendedor');
INSERT INTO users (email, password_hash, role, full_name, branch, seller_level)
VALUES ('carlos@alvarezplacas.com', 'pass', 'seller', 'Carlos Rodriguez', 'Villa Tesei', 'Vendedor Jr.');
