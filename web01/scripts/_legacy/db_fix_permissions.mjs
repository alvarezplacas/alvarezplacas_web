import pkg from 'pg';
const { Client } = pkg;

/**
 * SQL PERMISSIONS FIX - ALVAREZ PLACAS
 * Inserta directamente en la tabla de Directus para asegurar visibilidad total.
 */

const connectionString = 'postgresql://alvarez_admin:AlvarezAdmin2026@localhost:5433/alvarezplacas';

const collections = ['materiales', 'marcas', 'categorias', 'espesores', 'sucursales', 'site_settings'];

async function fix() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log("✅ Conectado a PostgreSQL 16.");

        for (const coll of collections) {
            const query = `
                INSERT INTO directus_permissions (collection, action, fields, permissions, role)
                SELECT $1, 'read', '*', '{}', NULL
                WHERE NOT EXISTS (
                    SELECT 1 FROM directus_permissions 
                    WHERE collection = $1 AND action = 'read' AND role IS NULL
                );
            `;
            await client.query(query, [coll]);
            console.log(`✅ Permiso SQL de lectura asegurado para: ${coll}`);
        }

        console.log("--- ✨ Base de Datos Optimizada para lectura pública ---");
    } catch (e) {
        console.error("❌ Error SQL:", e.message);
    } finally {
        await client.end();
    }
}

fix();
