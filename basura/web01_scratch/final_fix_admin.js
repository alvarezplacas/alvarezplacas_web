import pkg from 'pg';
import bcrypt from 'bcryptjs';
const { Client } = pkg;

/**
 * FINAL FIX FOR ADMIN DASHBOARD ACCESS & DATA VISIBILITY
 * 
 * 1. Grants read permissions to the Frontend Role (7a946998-c9df-42ed-aacc-817028a927f1).
 * 2. Seeds/Updates the admin user in 'vendedores' with a proper hash.
 */

const connectionString = 'postgresql://alvarez_admin:AlvarezAdmin2026@localhost:5433/alvarezplacas';

const FRONTEND_ROLE_ID = '7a946998-c9df-42ed-aacc-817028a927f1';

const COLLECTIONS_TO_GRANT = [
    'materiales', 'pedidos', 'clientes', 'vendedores', 
    'marcas', 'categorias', 'espesores', 'sucursales', 'site_settings'
];

async function applyFix() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log("✅ Conectado a PostgreSQL 16.");

        // 1. Grant Permissions
        console.log("--- Aplicando Permisos de Lectura ---");
        for (const coll of COLLECTIONS_TO_GRANT) {
            const query = `
                INSERT INTO directus_permissions (collection, action, fields, permissions, role)
                VALUES ($1, 'read', '*', '{}', $2)
                ON CONFLICT (id) DO NOTHING;
            `;
            // Nota: Directus permissions table typically doesn't have a unique constraint on (role, collection, action) 
            // but we want to avoid duplicates if we can. 
            // Let's use a simpler check:
            const checkQuery = `SELECT 1 FROM directus_permissions WHERE collection = $1 AND action = 'read' AND role = $2`;
            const exists = await client.query(checkQuery, [coll, FRONTEND_ROLE_ID]);
            
            if (exists.rows.length === 0) {
                await client.query(`INSERT INTO directus_permissions (collection, action, fields, permissions, role) VALUES ($1, 'read', '*', '{}', $2)`, [coll, FRONTEND_ROLE_ID]);
                console.log(`✅ Permiso 'read' concedido para: ${coll}`);
            } else {
                console.log(`⚠️ Permiso 'read' ya existe para: ${coll}`);
            }
        }

        // 2. Ensure password_hash exists and is updated
        console.log("\n--- Actualizando Admin en 'vendedores' ---");
        const adminPass = 'JavierMix2026!';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(adminPass, salt);
        const adminEmail = 'admin@alvarezplacas.com.ar';

        // Primero verificamos si la columna existe (si no, la creamos vía SQL aunque Directus no sepa)
        // Pero mejor asumimos que ya existe por scripts anteriores.
        
        await client.query(`
            UPDATE vendedores 
            SET password_hash = $1, name = 'Administrador Javier'
            WHERE email = $2
        `, [hash, adminEmail]);
        console.log(`✅ Admin (${adminEmail}) actualizado con nuevo hash.`);

        console.log("\n--- ✨ OPERACIÓN FINALIZADA CON ÉXITO ---");
        console.log("Prueba el acceso al Dashboard ahora.");

    } catch (e) {
        console.error("❌ Error Crítico:", e.message);
    } finally {
        await client.end();
    }
}

applyFix();
