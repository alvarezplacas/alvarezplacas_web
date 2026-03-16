import { query } from './src/lib/db.js';

async function checkUsers() {
    console.log('--- Checking Users Table ---');
    const res = await query("SELECT id, email, role, full_name, assigned_seller_id FROM users");
    console.table(res.rows);
}

checkUsers().then(() => process.exit(0));
