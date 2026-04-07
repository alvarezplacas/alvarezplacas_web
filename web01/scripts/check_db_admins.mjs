import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://alvarez_admin:AlvarezAdmin2026@localhost:5433/alvarezplacas';

async function queryDB() {
    console.log("--- Querying DB for Admin Users ---");
    const client = new Client({ connectionString });
    try {
        await client.connect();
        
        // Buscamos usuarios con roles que tengan admin_access
        console.log("Fetching Directus Admins...");
        const res = await client.query(`
            SELECT u.email, r.name as role_name, r.admin_access 
            FROM directus_users u
            JOIN directus_roles r ON u.role = r.id
            WHERE r.admin_access = true OR r.name ILIKE '%admin%';
        `);
        console.log("Results:", res.rows);

        console.log("Checking collections...");
        const colls = await client.query(`SELECT collection FROM directus_collections WHERE collection NOT LIKE 'directus_%'`);
        console.log("Existing non-system collections:", colls.rows.map(r => r.collection));

    } catch (e) {
        console.error("❌ DB Error:", e.message);
    } finally {
        await client.end();
    }
}

queryDB();
