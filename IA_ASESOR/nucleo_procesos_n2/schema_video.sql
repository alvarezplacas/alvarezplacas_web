-- Esquema para la gestión de dispositivos de video y analítica de flujo físico
-- A ser ejecutado en la base de datos PostgreSQL local del Nodo 2 (i5)

CREATE TABLE IF NOT EXISTS dispositivos_video (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    mac_address VARCHAR(17) NULL,
    nombre VARCHAR(100) NOT NULL DEFAULT 'Cámara Detectada',
    puerto_rtsp INTEGER DEFAULT 554,
    ruta_rtsp VARCHAR(255) DEFAULT '/stream1',
    usuario VARCHAR(100) DEFAULT 'admin',
    password VARCHAR(255) DEFAULT '',
    puerto_onvif INTEGER DEFAULT 80,
    fabricante VARCHAR(100) DEFAULT 'Genérico',
    estado VARCHAR(20) DEFAULT 'desconocido' CHECK (estado IN ('online', 'offline', 'error', 'desconocido')),
    ultima_conexion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registros_conteo (
    id BIGSERIAL PRIMARY KEY,
    dispositivo_id INTEGER REFERENCES dispositivos_video(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ingresos_total INTEGER DEFAULT 0,
    egresos_total INTEGER DEFAULT 0,
    ocupacion_actual INTEGER DEFAULT 0,
    metadatos JSONB NULL
);

-- Índices para optimización de consultas de analítica
CREATE INDEX IF NOT EXISTS idx_registros_conteo_timestamp ON registros_conteo(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_registros_conteo_dispositivo ON registros_conteo(dispositivo_id);

-- Trigger para actualizar el campo 'actualizado_el' automáticamente
CREATE OR REPLACE FUNCTION update_actualizado_el_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_el = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_dispositivos_video_actualizado_el
    BEFORE UPDATE ON dispositivos_video
    FOR EACH ROW
    EXECUTE FUNCTION update_actualizado_el_column();
