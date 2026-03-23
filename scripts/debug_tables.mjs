import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://alvarez_admin:alvarez_password@localhost:5433/alvarezplacas'
});

async function debug() {
    console.log("--- Listing All Tables in 'alvarezplacas' ---");
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log("Tables found:");
        res.rows.forEach(row => console.log(` - ${row.table_name}`));
        
        console.log("\nChecking for 'clientes' specifically (case sensitivity test):");
        const res2 = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_name = 'clientes'");
        console.log(" 'clientes' exists:", res2.rows[0].count > 0);
        
        const res3 = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_name = 'Clientes'");
        console.log(" 'Clientes' exists:", res3.rows[0].count > 0);

    } catch (e) {
        console.error("Error debugging tables:", e.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

debug();
