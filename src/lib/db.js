import pg from 'pg';

const { Pool } = pg;

// Cargamos variables de entorno si están disponibles
const isProduction = process.env.NODE_ENV === 'production';

// Configuración de conexión
// En el VPS usaremos la variable DATABASE_URL o campos individuales
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://alvarez_admin:AlvarezAdmin2026@alvarez_db:5432/alvarezplacas',
    ssl: false
});

export const query = async (text, params) => {
    try {
        return await pool.query(text, params);
    } catch (e) {
        console.error(`Database Query Error [${text.substring(0, 50)}...]:`, e.message);
        return { rows: [] }; // Retornar vacío en lugar de lanzar error para no romper SSR
    }
};

export default pool;
