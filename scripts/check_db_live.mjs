import { query } from './src/lib/db.js';

async function check() {
  try {
    console.log("Checking tables...");
    const tables = ['productos', 'variantes_sku', 'marcas', 'categorias'];
    for (const table of tables) {
      console.log(`\n--- Columns for ${table} ---`);
      const res = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
      res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
