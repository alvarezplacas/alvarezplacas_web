const { Client } = require('pg');
const c = new Client('postgresql://alvarez_admin:AlvarezAdmin2026@100.127.6.20:5432/alvarezplacas');
c.connect()
.then(() => c.query("SELECT collection FROM directus_collections"))
.then(r => console.log('Collections:', r.rows.map(x=>x.collection).filter(t => t.includes('personal') || t.includes('empleado') || t.includes('asistencia') || t.includes('user') || t.includes('vendedor'))))
.catch(console.error)
.finally(()=>c.end());
