-- Migration 04: Control Financiero y Registro de Deudas (BI Ready)
-- Propósito: Tracking detallado de pagos, cuotas y deudas históricas.

-- 1. Registro de Transacciones Individuales (Ingresos/Egresos)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL, -- El cliente/proveedor
    order_id INTEGER REFERENCES orders(id), -- El pedido vinculado (opcional)
    amount DECIMAL(12,2) NOT NULL, -- Positivo = Cobro, Negativo = Ajuste (si fuera necesario)
    payment_method VARCHAR(50) NOT NULL, -- 'Efectivo', 'Transferencia', 'Tarjeta', 'Cuenta Corriente'
    currency VARCHAR(10) DEFAULT 'ARS', -- 'ARS', 'USD' (Preparado para bimoneda)
    exchange_rate DECIMAL(12,4) DEFAULT 1.0, -- Valor de cambio al momento de la transacción
    receipt_no VARCHAR(100), -- Nº de factura o comprobante físico
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) -- El vendedor que recibió el pago
);

-- 2. Historial de Saldos (Instantánea Diaria/Semanal)
CREATE TABLE IF NOT EXISTS financial_debt_snapshots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    total_debt_at_time DECIMAL(12,2) NOT NULL,
    recorded_at DATE DEFAULT CURRENT_DATE,
    financial_status financial_status DEFAULT 'clean'
);

-- 3. Índices para reportes rápidos (BI / Dashboard de Negocio)
CREATE INDEX idx_fin_trans_user ON financial_transactions(user_id);
CREATE INDEX idx_fin_trans_order ON financial_transactions(order_id);
CREATE INDEX idx_fin_trans_date ON financial_transactions(created_at);
