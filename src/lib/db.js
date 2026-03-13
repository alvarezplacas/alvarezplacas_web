import pg from 'pg';

const { Pool } = pg;

// Cargamos variables de entorno si están disponibles
const isProduction = process.env.NODE_ENV === 'production';

// Configuración de conexión
// En el VPS usaremos la variable DATABASE_URL o campos individuales
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://alvarez_admin:alvarez_password@db:5432/alvarezplacas',
    ssl: isProduction ? { rejectUnauthorized: false } : false
});

export const query = (text, params) => pool.query(text, params);

export default pool;
