CREATE TABLE IF NOT EXISTS documentos_facturacion (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    filepath VARCHAR(1024) NOT NULL,
    doc_type VARCHAR(10) NOT NULL, -- 'FA-A', 'FA-B', 'RE-B', etc.
    pos_number VARCHAR(10) NOT NULL, -- '1901', etc.
    doc_number VARCHAR(20) NOT NULL, -- '00010451', etc.
    doc_date DATE NOT NULL,
    client_cta VARCHAR(50),
    client_name VARCHAR(255),
    client_cuit VARCHAR(50),
    total_amount DECIMAL(12,2) NOT NULL,
    seller_code VARCHAR(50),
    doc_text TEXT NOT NULL,
    fts_doc tsvector, -- Full-Text Search column
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for full-text search
CREATE INDEX IF NOT EXISTS idx_documentos_fts ON documentos_facturacion USING gin(fts_doc);

-- Indexes for pattern matching
CREATE INDEX IF NOT EXISTS idx_documentos_filename ON documentos_facturacion(filename);
CREATE INDEX IF NOT EXISTS idx_documentos_number ON documentos_facturacion(doc_number);
