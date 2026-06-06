const { Client } = require('pg');
const c = new Client('postgresql://alvarez_admin:AlvarezAdmin2026@100.127.6.20:5432/alvarezplacas');
c.connect()
.then(() => c.query("SELECT * FROM vendedores LIMIT 1"))
.then(r => console.log('vendedores columns:', Object.keys(r.rows[0]||{})))
.then(() => c.query("SELECT * FROM control_personal LIMIT 10"))
.then(r => console.log('control_personal rows:', r.rows))
.catch(console.error)
.finally(()=>c.end());
