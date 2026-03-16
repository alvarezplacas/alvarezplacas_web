import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { Pool } = pg;

// Cargamos variables de entorno si están disponibles
const isProduction = process.env.NODE_ENV === 'production';

// Configuración de conexión
const connectionString = process.env.DATABASE_URL || 'postgresql://alvarez_admin:AlvarezAdmin2026@alvarezplacas_db:5432/alvarezplacas';

console.log(`[Database] Connecting to: ${connectionString.split('@')[1]}`);

const pool = new Pool({
    connectionString,
    ssl: false
});

pool.on('error', (err) => {
    console.error('[Database] Unexpected error on idle client', err);
});

export const query = async (text, params) => {
    return await pool.query(text, params);
};

export default pool;
