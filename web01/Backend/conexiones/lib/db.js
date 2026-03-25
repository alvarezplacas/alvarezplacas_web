import pg from 'pg';

const { Pool } = pg;

// Cargamos variables de entorno usando el estándar de Astro
const isProduction = import.meta.env.PROD;

// Configuración de conexión (Astro inyecta .env automáticamente en import.meta.env)
const connectionString = import.meta.env.DATABASE_URL || 'postgresql://alvarez_admin:AlvarezAdmin2026@alvarezplacas_db:5432/alvarezplacas';

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
