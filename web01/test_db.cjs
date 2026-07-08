const { Client } = require('pg');
const c = new Client('postgresql://alvarez_admin:AlvarezAdmin2026@100.127.6.20:5432/alvarezplacas');
c.connect().then(() => c.query(`
    ALTER TABLE control_personal 
    ADD COLUMN IF NOT EXISTS dni_file_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS dni_dorso_file_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cuil_file_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS codem_file_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS examen_medico_file_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS foto_file_id VARCHAR(100);
`))
.then(r => console.log("Postgres columns added successfully"))
.catch(console.error)
.finally(()=>c.end());
