import pkg from 'pg';
const { Client } = pkg;

const dbConfig = {
    user: 'alvarez_admin',
    host: 'localhost', // Se debe ejecutar desde el HOST o vía port-forward si es remoto
    database: 'alvarezplacas',
    password: 'AlvarezAdmin2026!',
    port: 5432,
};

async function optimizeSearch() {
    console.log("--- 🚀 Iniciando Optimización de Búsqueda PG16 (Doctor Edition) ---");
    
    // Nota: Este script debe ejecutarse dentro del contenedor de DB o tener acceso al puerto 5432
    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log("✅ Conexión a PostgreSQL exitosa.");

        console.log("🛠️ Activando extensión pg_trgm...");
        await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        console.log("🛠️ Creando Índice GIN para Búsqueda Neuronal...");
        // Creamos un índice sobre el nombre para búsquedas rápidas con trigramas
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_materiales_nombre_trgm 
            ON materiales USING gin (nombre gin_trgm_ops);
        `);

        console.log("🛠️ Creando Índice GIN para SKUs...");
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_materiales_sku_trgm 
            ON materiales USING gin (sku gin_trgm_ops);
        `);

        console.log("--- ✨ Optimización Finalizada con Éxito ---");
        console.log("💡 Ahora el catálogo funcionará a velocidades supersónicas.");

    } catch (err) {
        console.error("❌ Error durante la optimización:", err.message);
    } finally {
        await client.end();
    }
}

optimizeSearch();
