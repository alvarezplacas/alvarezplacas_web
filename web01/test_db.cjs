const { Client } = require('pg');
const c = new Client('postgresql://alvarez_admin:AlvarezAdmin2026@100.127.6.20:5432/alvarezplacas');
c.connect().then(() => c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
.then(r => console.log(r.rows.map(x=>x.table_name)))
.catch(console.error)
.finally(()=>c.end());
