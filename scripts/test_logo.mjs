import { query } from '../src/lib/db.js';

async function test() {
  const res = await query("SELECT id, title, filename_download FROM directus_files WHERE title ILIKE '%logo%' LIMIT 5;");
  console.log("Logos:", res.rows);
}
test().catch(console.error).finally(()=>process.exit(0));
