-- Database Schema for Alvarez Placas
-- PostgreSQL

-- 1. Users Table (Clients, Sellers, Admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'client', -- 'admin', 'seller', 'client'
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    client_number VARCHAR(50) UNIQUE, -- ALV-0001
    is_club_member BOOLEAN DEFAULT FALSE,
    assigned_seller_id INTEGER REFERENCES users(id),
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Pendiente', -- Pendiente, En proceso, Terminado, Entregado
    logistics VARCHAR(50), -- Retiro en Local, Envío a Domicilio
    total_amount DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(15, 2) NOT NULL,
    measurements JSONB, -- For cuts/measurements info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Borrador', -- Borrador, Enviado, Aprobado, Rechazado
    total_amount DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Site Settings (Already exists in settings.ts but kept here for reference)
-- CREATE TABLE IF NOT EXISTS site_settings (
--     key VARCHAR(50) PRIMARY KEY,
--     value TEXT NOT NULL,
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );
