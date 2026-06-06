const { Client } = require('pg');
const c = new Client('postgresql://alvarez_admin:AlvarezAdmin2026@100.127.6.20:5432/alvarezplacas');

async function run() {
    await c.connect();
    
    // Add missing columns if they don't exist
    await c.query(`
        ALTER TABLE control_personal ADD COLUMN IF NOT EXISTS id_reloj VARCHAR(50);
        ALTER TABLE control_personal ADD COLUMN IF NOT EXISTS email VARCHAR(100);
        ALTER TABLE control_personal ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
        ALTER TABLE control_personal ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    `);

    // Create asistencias table
    await c.query(`
        CREATE TABLE IF NOT EXISTS control_asistencias (
            id SERIAL PRIMARY KEY,
            id_reloj VARCHAR(50) NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            estado VARCHAR(50),
            UNIQUE(id_reloj, timestamp)
        );
    `);

    // Clear fake data
    await c.query(`DELETE FROM control_personal`);

    // Insert real data
    const empleados = [
        "ALTAMIRANDA, Luis Marcelo",
        "ESCOBAR, Jóse Ignacio",
        "GOMEZ, Jóse Isaias",
        "LOZA, Maria Emilia",
        "MENDONÇA, Braian E.",
        "PASTRANA, Maria Fernanda",
        "PEREZ, Oscar Alejandro",
        "ROBLES, Maximiliano D.",
        "SANCHEZ, Diego"
    ];

    for (const emp of empleados) {
        await c.query(`INSERT INTO control_personal (nombre, funcion, sueldo_base, status) VALUES ($1, 'Operario', 600000.00, 'active')`, [emp]);
    }
    
    console.log("DB Updated with real employees");
    await c.end();
}
run().catch(console.error);
